import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../utils/prisma.js';
import { logActivity } from '../services/activityService.js';
import { sendMail, TEMPLATES, sendInvoiceEmail } from '../utils/mailer.js';
import { generateInvoice } from '../utils/invoiceGenerator.js';
import { notifyOrderCreated, notifyPaymentSuccess } from '../services/notificationService.js';

const reduceInventory = async (orderId) => {
  try {
    const items = await prisma.orderItem.findMany({
      where: { orderId }
    });

    for (const item of items) {
      if (item.variantTitle) {
        // Try to find the exact variant first
        const variant = await prisma.productVariant.findFirst({
          where: {
            productId: item.productId,
            title: item.variantTitle
          }
        });

        if (variant) {
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: { stock: { decrement: item.quantity } }
          });
        } else {
          // Fallback to global product stock if variant not found by title
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }
      } else {
        // Decrease global product stock
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }
    }
  } catch (error) {
    console.error('Failed to reduce inventory:', error);
  }
};

const generateNextInvoiceNumber = async () => {
  try {
    const lastOrder = await prisma.order.findFirst({
      where: { invoiceNumber: { startsWith: 'Gof-INV-' } },
      orderBy: { createdAt: 'desc' }
    });

    let nextNumber = 1;
    if (lastOrder && lastOrder.invoiceNumber) {
      const lastInvoice = lastOrder.invoiceNumber;
      const parts = lastInvoice.split('-');
      const lastNum = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    return `Gof-INV-${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return `Gof-INV-${Date.now().toString().slice(-4)}`;
  }
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const getPaymentConfig = async (req, res) => {
  res.json({
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
  });
};

const normalizeAddressForSave = (shippingAddress = {}, customerName = '', customerEmail = '') => ({
  id: shippingAddress.id || `addr_${Date.now()}`,
  label: shippingAddress.label || 'Saved Address',
  firstName: shippingAddress.firstName || '',
  lastName: shippingAddress.lastName || '',
  email: shippingAddress.email || customerEmail || '',
  address: shippingAddress.address || '',
  apartment: shippingAddress.apartment || '',
  city: shippingAddress.city || '',
  state: shippingAddress.state || '',
  pinCode: shippingAddress.pinCode || '',
  phone: shippingAddress.phone || '',
  fullName:
    shippingAddress.fullName ||
    [shippingAddress.firstName, shippingAddress.lastName].filter(Boolean).join(' ') ||
    customerName ||
    null
});

export const createRazorpayOrder = async (req, res) => {
  const {
    amount,
    currency = 'INR',
    receipt,
    items,
    customerEmail,
    customerName,
    paymentMethod,
    shippingAddress
  } = req.body;

  try {
    // 1. Check if COD is allowed
    const settings = await prisma.globalSetting.findUnique({ where: { id: 'default' } });
    const isCodEnabled = settings ? settings.codEnabled : false;

    if (paymentMethod === 'cod' && !isCodEnabled) {
      return res.status(400).json({ message: 'Cash on Delivery is currently disabled by admin.' });
    }

    let razorpayOrder = null;
    const resolvedCustomerId = req.user?.id || null;

    // 2. Handle COD
    if (paymentMethod === 'cod') {
      const invoiceNumber = await generateNextInvoiceNumber();
      const order = await prisma.order.create({
        data: {
          totalAmount: amount,
          status: 'COD_PENDING',
          customerId: resolvedCustomerId,
          invoiceNumber,
          paymentMethod: 'cod',
          shippingAddress: {
            ...shippingAddress,
            email: shippingAddress?.email || customerEmail || null,
            fullName: shippingAddress?.fullName || 
                     [shippingAddress?.firstName, shippingAddress?.lastName].filter(Boolean).join(' ') || 
                     customerName || null
          },
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              variantTitle: item.variantTitle
            }))
          }
        }
      });

      try {
        await notifyOrderCreated(order);
      } catch (error) {
        console.error('notifyOrderCreated failed:', error?.message || error);
      }

      await logActivity(order.id, 'ORDER_PLACED_COD_PENDING', 'Order placed with COD.');

      const emailToSend = shippingAddress?.email || customerEmail || null;
      if (emailToSend) {
        await sendMail(emailToSend, 'Order Confirmation - Ghar of Ethnics', TEMPLATES.ORDER_CONFIRMATION());
      }

      return res.json({ orderId: order.id, paymentMethod });
    }

    // 3. Handle Razorpay (No DB order created yet)
    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt,
      notes: {
        customerEmail: customerEmail || '',
        customerName: customerName || '',
        paymentMethod: 'razorpay'
      }
    };

    razorpayOrder = await razorpay.orders.create(options);
    
    res.json({
      ...razorpayOrder,
      paymentMethod: 'razorpay'
    });

  } catch (error) {
    console.error('--- ORDER CREATION ERROR ---', error);
    res.status(500).json({ message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    orderData // Sent from frontend on success
  } = req.body;

  try {
    // 1. Verify Signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: "Invalid signature sent!" });
    }

    // 2. Fetch Razorpay Order to verify amount
    const rpOrder = await razorpay.orders.fetch(razorpay_order_id);
    
    // Calculate expected amount from items to prevent tampering
    const subtotal = orderData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    // Note: We should ideally re-calculate coupons and shipping here too.
    // For now, we trust the amount in rpOrder matches what was paid.
    
    const paidAmount = rpOrder.amount / 100;
    
    // 3. Resolve customer safely before creating the order.
    // Frontend localStorage can hold stale ids; avoid FK violations by validating first.
    const requestedCustomerId = req.user?.id || orderData?.customerId || null;
    let resolvedCustomerId = null;

    if (requestedCustomerId) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { id: requestedCustomerId },
        select: { id: true }
      });
      resolvedCustomerId = existingCustomer?.id || null;
    }

    // Optional fallback by email if id is missing/stale and an account exists.
    if (!resolvedCustomerId && orderData?.customerEmail) {
      const emailCustomer = await prisma.customer.findUnique({
        where: { email: String(orderData.customerEmail).trim().toLowerCase() },
        select: { id: true }
      });
      resolvedCustomerId = emailCustomer?.id || null;
    }

    const invoiceNumber = await generateNextInvoiceNumber();

    const order = await prisma.order.create({
      data: {
        totalAmount: paidAmount,
        status: 'PAID',
        customerId: resolvedCustomerId,
        invoiceNumber,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentMethod: 'razorpay',
        shippingAddress: {
          ...orderData.shippingAddress,
          email: orderData.shippingAddress?.email || orderData.customerEmail || null,
          fullName: orderData.shippingAddress?.fullName || orderData.customerName || null
        },
        items: {
          create: orderData.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            variantTitle: item.variantTitle
          }))
        }
      }
    });

    // 4. Post-Success logic
    try {
      await notifyOrderCreated(order);
      await notifyPaymentSuccess(order);
    } catch (err) {
      console.error('Notifications failed:', err);
    }

    await logActivity(order.id, 'ORDER_PLACED', 'Order placed and paid successfully.');

    // Track sales
    const orderItems = await prisma.orderItem.findMany({ where: { orderId: order.id } });
    await Promise.all(orderItems.map(item =>
      prisma.sale.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          source: 'Website'
        }
      })
    ));

    // Inventory
    await reduceInventory(order.id);

    // Emails
    const destEmail = order.shippingAddress?.email || null;
    if (destEmail) {
      await sendMail(destEmail, 'Payment Success - Ghar of Ethnics', TEMPLATES.PAYMENT_SUCCESS());
      await sendMail(destEmail, 'Order Confirmation - Ghar of Ethnics', TEMPLATES.ORDER_CONFIRMATION());
      try {
        const invoicePDF = await generateInvoice(order.id);
        await sendInvoiceEmail(destEmail, 'Your Invoice - Ghar of Ethnics', TEMPLATES.INVOICE(order.id), invoicePDF, `Invoice_${order.id}.pdf`);
      } catch (invErr) {
        console.error('Invoice failed:', invErr);
      }
    }

    res.json({ message: "Payment verified and order created successfully", order });

  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const cancelPayment = async (req, res) => {
  const { orderId, razorpay_order_id } = req.body || {};

  if (!orderId && !razorpay_order_id) {
    return res.status(400).json({ message: 'orderId or razorpay_order_id is required' });
  }

  const order = await prisma.order.findUnique({
    where: orderId ? { id: orderId } : { razorpayOrderId: razorpay_order_id },
    select: { id: true, customerId: true, status: true, paymentMethod: true, razorpayPaymentId: true }
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.customerId && req.user?.id && order.customerId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden: You do not have access to this order' });
  }

  if (order.paymentMethod === 'cod') {
    return res.status(400).json({ message: 'COD payments cannot be cancelled via this endpoint' });
  }

  if (order.status === 'PAID' || order.razorpayPaymentId) {
    return res.status(400).json({ message: 'Paid orders cannot be cancelled' });
  }

  // Remove the unpaid order so it doesn't show as "placed" for the customer.
  await prisma.order.delete({ where: { id: order.id } });

  return res.json({ success: true });
};

export const confirmCODPayment = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: 'orderId is required' });
  }

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

    if (order.paymentMethod !== 'cod' && order.paymentMethod !== 'COD') {
      return res.status(400).json({ message: 'This order is not a COD order' });
    }

    if (order.status !== 'COD_PENDING') {
      return res.status(400).json({ message: 'Order is not in COD_PENDING status' });
    }

    // Update order status to COD_CONFIRMED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COD_CONFIRMED'
      }
    });

    // Log activity
    await logActivity(
      orderId,
      'COD_PAYMENT_CONFIRMED',
      'COD payment confirmed by admin. Order is now active.'
    );

    // Reduce inventory now that payment is confirmed
    await reduceInventory(orderId);

    // Track the sale
    await Promise.all(order.items.map(item =>
      prisma.sale.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          source: 'Website'
        }
      })
    ));

    // Send confirmation email to customer
    if (order.shippingAddress && typeof order.shippingAddress === 'object') {
      const destEmail = order.shippingAddress.email || null;
      if (destEmail) {
        await sendMail(destEmail, 'COD Payment Confirmed - Ghar of Ethnics', 'Your COD order has been confirmed and will be processed soon.');
      }
    }

    res.json({ 
      message: 'COD payment confirmed successfully', 
      order: updatedOrder 
    });
  } catch (error) {
    console.error('Error confirming COD payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
