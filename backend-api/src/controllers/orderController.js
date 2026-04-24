import prisma from '../utils/prisma.js';
import { sendMail, TEMPLATES } from '../utils/mailer.js';
import { notifyOrderStatus } from '../services/notificationService.js';

export const getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: {
          select: { name: true, email: true }
        },
        items: {
          include: {
            product: {
              select: { name: true, thumbnailUrl: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formatting if needed for the admin view
    const formattedOrders = orders.map(order => ({
      id: order.id,
      customer: order.customer,
      createdAt: order.createdAt,
      total: order.totalAmount, // Map totalAmount to total for the frontend
      status: order.status,
      items: order.items,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId
    }));

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  const { id } = req.params;
  const { user } = req; // From requireAuth middleware

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        },
        activities: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Customer can only access their own order. Admin can access any order.
    // Guests (no req.auth) can access the order if they have the UUID.
    if (req.auth?.type === 'customer' && order.customerId && order.customerId !== user?.id) {
      return res.status(403).json({ message: 'Forbidden: You do not have access to this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCustomerOrders = async (req, res) => {
  const { customerId } = req.params;
  const { user } = req; // From requireAuth middleware

  try {
    // Verify the authenticated user can only see their own orders
    if (customerId !== user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own orders' });
    }

    const orders = await prisma.order.findMany({
      // Hide unpaid Razorpay orders from customer history until payment is verified.
      where: {
        customerId,
        NOT: {
          OR: [
            { status: 'PAYMENT_PENDING' },
            { AND: [{ status: 'PENDING' }, { paymentMethod: { not: 'cod' } }] },
          ],
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, thumbnailUrl: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true }
    });

    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const statusChanged = existingOrder.status !== status;

    const order = await prisma.order.update({
      where: { id },
      data: { status }
    });

    // Send notifications only when status actually changes to avoid duplicate SMS/email costs.
    const destEmail = order.shippingAddress?.email || null;
    if (statusChanged && destEmail) {
      switch (status) {
        case 'PACKED':
          await sendMail(destEmail, 'Order Packed', TEMPLATES.ORDER_PACKED());
          break;
        case 'SHIPPED':
          // We can fetch tracking link if it's available in order table.
          await sendMail(destEmail, 'Order Shipped', TEMPLATES.ORDER_SHIPPED(order.trackingLink || ''));
          break;
        case 'OUT_FOR_DELIVERY':
          await sendMail(destEmail, 'Out for Delivery', TEMPLATES.OUT_FOR_DELIVERY());
          break;
        case 'DELIVERED':
          await sendMail(destEmail, 'Order Delivered', TEMPLATES.DELIVERED());
          break;
        case 'CANCELLED':
          await sendMail(destEmail, 'Order Cancelled', TEMPLATES.ORDER_CANCELLED());
          break;
        case 'REFUND_INITIATED':
          await sendMail(destEmail, 'Refund Initiated', TEMPLATES.REFUND_INITIATED());
          break;
        case 'REFUNDED':
          await sendMail(destEmail, 'Refund Completed', TEMPLATES.REFUND_COMPLETED());
          break;
      }
    }

    // SMS notification: should never block admin status updates
    try {
      if (!statusChanged) {
        return res.json(order);
      }

      if (status === 'SHIPPED') {
        const shipment = await prisma.shipment.findUnique({
          where: { orderId: order.id },
        });
        await notifyOrderStatus(order, status, {
          trackingLink: shipment?.labelUrl || '',
        });
      } else {
        await notifyOrderStatus(order, status);
      }
    } catch (error) {
      console.error('notifyOrderStatus failed:', error?.message || error);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
