import prisma from '../utils/prisma.js';
import { sendMail, TEMPLATES } from '../utils/mailer.js';

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

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCustomerOrders = async (req, res) => {
  const { customerId } = req.params;
  try {
    const orders = await prisma.order.findMany({
      where: { customerId },
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
    const order = await prisma.order.update({
      where: { id },
      data: { status }
    });

    const destEmail = order.shippingAddress?.email || order.customerEmail || null;
    if (destEmail) {
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

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
