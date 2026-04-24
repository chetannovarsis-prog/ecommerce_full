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
  console.log("BODY:", req.body);
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

  console.log('--- CREATING ORDER ---');
  console.log('Body:', { amount, currency, receipt, customerEmail, paymentMethod });
  console.log('Items Count:', items?.length);

  try {
    let razorpayOrder = null;
    const resolvedCustomerId = req.user?.id || null;
    const invoiceNumber = await generateNextInvoiceNumber();

    // Only create Razorpay order if it's not COD
    if (paymentMethod !== 'cod') {
      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit
        currency,
        receipt,
      };
      console.log('Creating Razorpay order with options:', options);
      razorpayOrder = await razorpay.orders.create(options);
      console.log('Razorpay Order Created:', razorpayOrder.id);
    }

    // Create a pending order in our database
    console.log('Creating database order...');
    const order = await prisma.order.create({
      data: {
        totalAmount: amount,
        status: paymentMethod === 'cod' ? 'COD_PENDING' : 'PAYMENT_PENDING',
        customerId: resolvedCustomerId,
        invoiceNumber,
        razorpayOrderId: razorpayOrder ? razorpayOrder.id : null,
        paymentMethod: paymentMethod,
        shippingAddress: {
          ...shippingAddress,
          email: shippingAddress?.email || customerEmail || null,
          fullName:
            shippingAddress?.fullName ||
            [shippingAddress?.firstName, shippingAddress?.lastName].filter(Boolean).join(' ') ||
            customerName ||
            null
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
    console.log('Database Order Created:', order.id);

      if (paymentMethod === 'cod') {
        // SMS notification: should never block order creation
        try {
          await notifyOrderCreated(order);
        } catch (error) {
          console.error('notifyOrderCreated failed:', error?.message || error);
        }

        // Log activity
        await logActivity(
          order.id,
          'ORDER_PLACED_COD',
          'Order placed successfully via COD.'
        );

        const emailToSend = shippingAddress?.email || customerEmail || null;
        if (emailToSend) {
          await sendMail(emailToSend, 'Order Confirmation - Ghar of Ethnics', TEMPLATES.ORDER_CONFIRMATION());
        }

        // Reduce Inventory for COD
        await reduceInventory(order.id);

        res.json({
          orderId: order.id,
          paymentMethod
        });
        return;
      }

    // Save address to customer profile relational table if user is logged in
    if (resolvedCustomerId && shippingAddress) {
      try {
        const addressToSave = {
          name: shippingAddress.fullName ||
            [shippingAddress.firstName, shippingAddress.lastName].filter(Boolean).join(' ') ||
            customerName || 'Default Name',
          phone: String(shippingAddress.phone || ''),
          addressLine1: shippingAddress.address || shippingAddress.addressLine1 || '',
          addressLine2: shippingAddress.apartment || shippingAddress.addressLine2 || '',
          city: shippingAddress.city || '',
          state: shippingAddress.state || '',
          pincode: String(shippingAddress.pinCode || shippingAddress.pincode || ''),
        };

        // Validate minimal required fields before attempting save
        if (addressToSave.addressLine1 && addressToSave.city && addressToSave.pincode) {
          // Check if this exact address already exists for this customer to avoid duplicates
          const existingAddress = await prisma.address.findFirst({
            where: {
              customerId: resolvedCustomerId,
              addressLine1: { equals: addressToSave.addressLine1, mode: 'insensitive' },
              city: { equals: addressToSave.city, mode: 'insensitive' },
              pincode: addressToSave.pincode,
            }
          });

          if (!existingAddress) {
            console.log(`Saving new address for customer ${resolvedCustomerId}: ${addressToSave.addressLine1}`);
            await prisma.address.create({
              data: {
                ...addressToSave,
                customerId: resolvedCustomerId
              }
            });
          } else {
            console.log(`Address already exists for customer ${resolvedCustomerId}, skipping save.`);
          }
        } else {
          console.warn('Skipping address save: missing required fields', addressToSave);
        }
      } catch (err) {
        console.error('Failed to save address to profile:', err.message);
        // Don't fail the whole order if address saving fails
      }
    }

    res.json({
      ...(razorpayOrder || {}),
      orderId: order.id,
      paymentMethod
    });
  }catch (error) {
    console.error('--- ORDER CREATION ERROR ---');
    console.error(error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    try {
      const existing = await prisma.order.findUnique({
        where: { razorpayOrderId: razorpay_order_id },
        select: { id: true, customerId: true, status: true, razorpayPaymentId: true }
      });

      if (!existing) {
        return res.status(404).json({ message: 'Order not found for this Razorpay order id' });
      }

      if (existing.customerId && req.user?.id && existing.customerId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this order' });
      }

      if (existing.razorpayPaymentId || existing.status === 'PAID') {
        return res.json({ message: 'Payment already verified', orderId: existing.id });
      }

      // Update order status to PAID
      const order = await prisma.order.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: {
          status: 'PAID',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature
        }
      });

      // Order created notification (after payment success)
      try {
        await notifyOrderCreated(order);
      } catch (error) {
        console.error('notifyOrderCreated failed:', error?.message || error);
      }

      // SMS notification: should never block payment verification
      try {
        await notifyPaymentSuccess(order);
      } catch (error) {
        console.error('notifyPaymentSuccess failed:', error?.message || error);
      }

      await logActivity(
        order.id,
        'ORDER_PLACED',
        'Order placed successfully'
      );

      // Track the sale
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: order.id }
      });

      // Send Emails
      if (order.shippingAddress && typeof order.shippingAddress === 'object') {
        const destEmail = order.shippingAddress.email || null;
        if (destEmail) {
          await sendMail(destEmail, 'Payment Success - Ghar of Ethnics', TEMPLATES.PAYMENT_SUCCESS());
          await sendMail(destEmail, 'Order Confirmation - Ghar of Ethnics', TEMPLATES.ORDER_CONFIRMATION());
          
          // Generate and send invoice with PDF attachment
          try {
            const invoicePDF = await generateInvoice(order.id);
            const invoiceFileName = `Invoice_${order.id}.pdf`;
            await sendInvoiceEmail(
              destEmail, 
              'Your Invoice - Ghar of Ethnics', 
              TEMPLATES.INVOICE(order.id),
              invoicePDF,
              invoiceFileName
            );
          } catch (invoiceError) {
            console.error('Error generating or sending invoice:', invoiceError);
            // Still send a notification even if invoice generation fails
            await sendMail(destEmail, 'Your Invoice - Ghar of Ethnics', TEMPLATES.INVOICE(order.id));
          }
        }
      }

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

      // Reduce Inventory for Razorpay
      await reduceInventory(order.id);

      res.json({ message: "Payment verified successfully", order });
    } catch (error) {
      console.error('Error updating order after verification:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(400).json({ message: "Invalid signature sent!" });
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
