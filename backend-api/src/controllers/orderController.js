import prisma from '../utils/prisma.js';
import { sendMail, TEMPLATES } from '../utils/mailer.js';
import { notifyOrderStatus } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';

export const getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        // Show paid orders and all COD orders (pending or confirmed)
        OR: [
          { status: 'PAID' },
          { status: 'COD_CONFIRMED' },
          { status: 'COD_PENDING' }
        ]
      },

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
      select: { id: true, status: true, deliveryDate: true }
    });

    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const statusChanged = existingOrder.status !== status;

    const order = await prisma.order.update({
      where: { id },
      data: { 
        status,
        // Set delivery date when order is marked as delivered
        ...(status === 'DELIVERED' && !existingOrder.deliveryDate ? { deliveryDate: new Date() } : {})
      }
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

export const cancelOrder = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['PENDING', 'PAID', 'COD_CONFIRMED', 'COD_PENDING', 'PAYMENT_PENDING'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ 
        message: `Order cannot be cancelled in ${order.status} status. Only orders in PENDING, PAID, or COD_CONFIRMED status can be cancelled.` 
      });
    }

    // Restore inventory
    for (const item of order.items) {
      if (item.variantTitle) {
        const variant = await prisma.productVariant.findFirst({
          where: {
            productId: item.productId,
            title: item.variantTitle
          }
        });

        if (variant) {
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: { stock: { increment: item.quantity } }
          });
        } else {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
      } else {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
      }
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason || 'Cancelled by admin'
      }
    });

    // Log activity
    await logActivity(
      id,
      'ORDER_CANCELLED',
      `Order cancelled by admin. Reason: ${reason || 'Not specified'}`
    );

    // Send cancellation email
    const destEmail = order.shippingAddress?.email || null;
    if (destEmail) {
      await sendMail(
        destEmail,
        'Order Cancelled - Ghar of Ethnics',
        TEMPLATES.ORDER_CANCELLED()
      );
    }

    // Remove from sales if it was confirmed
    if (order.status === 'PAID' || order.status === 'COD_CONFIRMED') {
      await prisma.sale.deleteMany({
        where: {
          productId: { in: order.items.map(item => item.productId) }
        }
      });
    }

    res.json({
      message: 'Order cancelled successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createReturnRequest = async (req, res) => {
  const { orderId } = req.params;
  const { reason, description } = req.body;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is delivered
    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ 
        message: 'Return can only be initiated for delivered orders' 
      });
    }

    // Check if delivery date is within 7 days
    if (!order.deliveryDate) {
      return res.status(400).json({ 
        message: 'Delivery date not recorded for this order' 
      });
    }

    const deliveryDate = new Date(order.deliveryDate);
    const currentDate = new Date();
    const daysPassedSinceDelivery = Math.floor((currentDate - deliveryDate) / (1000 * 60 * 60 * 24));

    if (daysPassedSinceDelivery > 7) {
      return res.status(400).json({ 
        message: `Return period expired. Returns must be initiated within 7 days of delivery. ${daysPassedSinceDelivery} days have passed.` 
      });
    }

    // Check if return already exists
    const existingReturn = await prisma.returnRequest.findFirst({
      where: {
        orderId,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });

    if (existingReturn) {
      return res.status(400).json({ 
        message: 'A return request already exists for this order' 
      });
    }

    // Create return request
    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderId,
        reason,
        description,
        returnDate: new Date(),
        status: 'PENDING'
      }
    });

    // Log activity
    await logActivity(
      orderId,
      'RETURN_REQUESTED',
      `Return request created. Reason: ${reason}`
    );

    // Send email notification to admin and customer
    if (order.shippingAddress && typeof order.shippingAddress === 'object') {
      const destEmail = order.shippingAddress.email || null;
      if (destEmail) {
        await sendMail(
          destEmail,
          'Return Request Received - Ghar of Ethnics',
          `Your return request for order ${orderId} has been received. Our team will review it shortly.`
        );
      }
    }

    res.status(201).json({
      message: 'Return request created successfully',
      returnRequest
    });
  } catch (error) {
    console.error('Error creating return request:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getReturnRequest = async (req, res) => {
  const { orderId } = req.params;

  try {
    const returnRequest = await prisma.returnRequest.findFirst({
      where: { orderId }
    });

    if (!returnRequest) {
      return res.status(404).json({ message: 'No return request found for this order' });
    }

    res.json(returnRequest);
  } catch (error) {
    console.error('Error fetching return request:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getReturnRequests = async (req, res) => {
  try {
    const { status, orderId } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }
    if (orderId) {
      where.orderId = orderId;
    }

    const returnRequests = await prisma.returnRequest.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            invoiceNumber: true,
            customer: {
              select: {
                name: true,
                email: true
              }
            },
            items: true,
            totalAmount: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(returnRequests);
  } catch (error) {
    console.error('Error fetching return requests:', error);
    res.status(500).json({ error: error.message });
  }
};

export const approveReturnRequest = async (req, res) => {
  const { returnId } = req.params;
  const { refundAmount, adminResponse } = req.body;

  try {
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            paymentMethod: true,
            shippingAddress: true,
            status: true,
            items: true
          }
        }
      }
    });

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    if (returnRequest.status !== 'PENDING') {
      return res.status(400).json({ 
        message: `Return request cannot be approved. Current status: ${returnRequest.status}` 
      });
    }

    const approvalAmount = refundAmount || returnRequest.order.totalAmount;

    // Update return request
    const updatedReturn = await prisma.returnRequest.update({
      where: { id: returnId },
      data: {
        status: 'APPROVED',
        refundAmount: approvalAmount,
        adminResponse: adminResponse || 'Return approved'
      }
    });

    // Update order status
    await prisma.order.update({
      where: { id: returnRequest.orderId },
      data: {
        status: 'RETURN_INITIATED'
      }
    });

    // Log activity
    await logActivity(
      returnRequest.orderId,
      'RETURN_APPROVED',
      `Return request approved. Refund amount: ₹${approvalAmount}`
    );

    // Send email notification
    if (returnRequest.order.shippingAddress && typeof returnRequest.order.shippingAddress === 'object') {
      const destEmail = returnRequest.order.shippingAddress.email || null;
      if (destEmail) {
        await sendMail(
          destEmail,
          'Return Approved - Ghar of Ethnics',
          `Your return request has been approved. Refund amount: ₹${approvalAmount}. Please arrange to send the product back to us.`
        );
      }
    }

    res.json({
      message: 'Return request approved successfully',
      returnRequest: updatedReturn
    });
  } catch (error) {
    console.error('Error approving return request:', error);
    res.status(500).json({ error: error.message });
  }
};

export const rejectReturnRequest = async (req, res) => {
  const { returnId } = req.params;
  const { adminResponse } = req.body;

  try {
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: {
        order: {
          select: {
            id: true,
            shippingAddress: true
          }
        }
      }
    });

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    if (returnRequest.status !== 'PENDING') {
      return res.status(400).json({ 
        message: `Return request cannot be rejected. Current status: ${returnRequest.status}` 
      });
    }

    // Update return request
    const updatedReturn = await prisma.returnRequest.update({
      where: { id: returnId },
      data: {
        status: 'REJECTED',
        adminResponse: adminResponse || 'Return request rejected'
      }
    });

    // Log activity
    await logActivity(
      returnRequest.orderId,
      'RETURN_REJECTED',
      `Return request rejected. Reason: ${adminResponse || 'Not specified'}`
    );

    // Send email notification
    if (returnRequest.order.shippingAddress && typeof returnRequest.order.shippingAddress === 'object') {
      const destEmail = returnRequest.order.shippingAddress.email || null;
      if (destEmail) {
        await sendMail(
          destEmail,
          'Return Request Decision - Ghar of Ethnics',
          `We're sorry, but your return request has been declined. ${adminResponse || ''}`
        );
      }
    }

    res.json({
      message: 'Return request rejected successfully',
      returnRequest: updatedReturn
    });
  } catch (error) {
    console.error('Error rejecting return request:', error);
    res.status(500).json({ error: error.message });
  }
};
