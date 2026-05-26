import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../utils/prisma.js';
import { logActivity } from '../services/activityService.js';
import { sendMail, TEMPLATES, sendInvoiceEmail } from '../utils/mailer.js';
import { generateInvoice } from '../utils/invoiceGenerator.js';
import { notifyOrderCreated, notifyPaymentSuccess } from '../services/notificationService.js';
import { logger } from '../utils/logger.js';
import { calculateOrderTotals } from '../utils/orderPricing.js';

const reduceInventory = async (orderId) => {
  try {
    const items = await prisma.orderItem.findMany({
      where: { orderId },
      include: { product: true }
    });

    logger.info('inventory.reduce.start', {
      order_id: orderId,
      items_count: items.length
    });

    for (const item of items) {
      const quantity = Math.max(1, item.quantity || 0);
      
      if (item.variantTitle) {
        const itemTitle = (item.variantTitle || '').trim();
        const itemTitleSlug = itemTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        logger.info('inventory.reduce.attempt_match', {
          product_id: item.productId,
          target_title: itemTitle,
          target_slug: itemTitleSlug
        });

        // 1. Try exact (case-insensitive) match first
        let variant = await prisma.productVariant.findFirst({
          where: {
            productId: item.productId,
            title: {
              equals: itemTitle,
              mode: 'insensitive'
            }
          }
        });

        // 2. If no match, try finding by matching normalized slugs (ignores spaces/commas/colons)
        if (!variant) {
          const variants = await prisma.productVariant.findMany({
            where: { productId: item.productId }
          });
          
          variant = variants.find(v => {
            const vSlug = v.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            return vSlug === itemTitleSlug;
          });

          if (variant) {
            logger.info('inventory.reduce.match_found_via_slug', {
              variant_id: variant.id,
              variant_title: variant.title
            });
          }
        }

        if (variant) {
          const currentStock = variant.stock || 0;
          const updatedVariant = await prisma.productVariant.update({
            where: { id: variant.id },
            data: { stock: { decrement: quantity } }
          });

          logger.info('inventory.reduce.variant_decremented', {
            order_id: orderId,
            variant_id: variant.id,
            variant_title: variant.title,
            quantity_decremented: quantity,
            stock_after: updatedVariant.stock
          });
        } else {
          // 3. Final Fallback: Product Global Stock
          logger.warn('inventory.reduce.variant_not_found_falling_back', {
            order_id: orderId,
            product_id: item.productId,
            variant_title: itemTitle
          });

          const updatedProduct = await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: quantity } }
          });

          logger.info('inventory.reduce.product_stock_decremented', {
            product_id: item.productId,
            quantity_decremented: quantity,
            stock_after: updatedProduct.stock
          });
        }
      } else {
        // No variantTitle provided
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: quantity } }
        });
      }
    }

    logger.info('inventory.reduce.complete', {
      order_id: orderId,
      items_processed: items.length
    });
  } catch (error) {
    logger.error('inventory.reduce.error', {
      order_id: orderId,
      error: error.message,
      stack: error.stack,
    });
    throw error; // Re-throw to prevent silent failures
  }
};

const generateNextInvoiceNumber = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const prefix = `GOE-${currentYear}-`;
    
    const lastOrder = await prisma.order.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' }
    });

    let nextNumber = 1;
    if (lastOrder && lastOrder.invoiceNumber) {
      const parts = lastOrder.invoiceNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    return `${prefix}${String(nextNumber).padStart(2, '0')}`;
  } catch (error) {
    const currentYear = new Date().getFullYear();
    logger.error('invoice.generate.error', {
      error: error.message,
      stack: error.stack,
    });
    return `GOE-${currentYear}-${Date.now().toString().slice(-2)}`;
  }
};

const createOrderWithInvoiceRetry = async (data, maxRetries = 4, include = null) => {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const currentYear = new Date().getFullYear();
    const invoiceNumber =
      attempt < maxRetries
        ? await generateNextInvoiceNumber()
        : `GOE-${currentYear}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;

    try {
      return await prisma.order.create({
        data: {
          ...data,
          invoiceNumber,
        },
        include,
      });
    } catch (error) {
      const isInvoiceConflict = error?.code === 'P2002' &&
        String(error?.meta?.target || '').includes('invoiceNumber');
      if (!isInvoiceConflict || attempt === maxRetries) {
        throw error;
      }

      logger.warn('invoice.generate.conflict_retry', {
        attempt,
        reason: 'invoiceNumber unique conflict',
      });
    }
  }

  throw new Error('Unable to generate unique invoice number');
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

const validateCheckoutPayload = ({ items, shippingAddress, customerEmail, customerName }) => {
  const missing = [];

  const resolvedEmail = String(shippingAddress?.email || customerEmail || '').trim();
  const resolvedName = String(
    shippingAddress?.fullName ||
    [shippingAddress?.firstName, shippingAddress?.lastName].filter(Boolean).join(' ') ||
    customerName ||
    ''
  ).trim();

  const requiredShippingFields = [
    ['firstName', String(shippingAddress?.firstName || '').trim()],
    ['lastName', String(shippingAddress?.lastName || '').trim()],
    ['email', resolvedEmail],
    ['phone', String(shippingAddress?.phone || '').trim()],
    ['address', String(shippingAddress?.address || '').trim()],
    ['city', String(shippingAddress?.city || '').trim()],
    ['state', String(shippingAddress?.state || '').trim()],
    ['pinCode', String(shippingAddress?.pinCode || '').trim()],
  ];

  for (const [key, value] of requiredShippingFields) {
    if (!value) missing.push(key);
  }

  if (resolvedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedEmail)) missing.push('email_format');
  if (shippingAddress?.pinCode && !/^[1-9][0-9]{5}$/.test(String(shippingAddress.pinCode).trim())) missing.push('pinCode_format');
  if (!resolvedName) missing.push('fullName');

  const itemErrors = [];
  if (!Array.isArray(items) || items.length === 0) {
    itemErrors.push('items_required');
  } else {
    for (const [index, item] of items.entries()) {
      const productId = String(item?.productId || '').trim();
      const quantity = Number(item?.quantity);
      const price = Number(item?.price);

      if (!productId) itemErrors.push(`items[${index}].productId`);
      if (!Number.isFinite(quantity) || quantity <= 0) itemErrors.push(`items[${index}].quantity`);
      if (!Number.isFinite(price) || price < 0) itemErrors.push(`items[${index}].price`);
    }
  }

  return {
    ok: missing.length === 0 && itemErrors.length === 0,
    missing,
    itemErrors,
    resolvedEmail,
    resolvedName,
  };
};

const setInvoiceNumberWithRetry = async (orderId, maxRetries = 4) => {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const currentYear = new Date().getFullYear();
    const invoiceNumber =
      attempt < maxRetries
        ? await generateNextInvoiceNumber()
        : `GOE-${currentYear}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;

    try {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { invoiceNumber },
      });
      return updated.invoiceNumber || invoiceNumber;
    } catch (error) {
      const isInvoiceConflict = error?.code === 'P2002' &&
        String(error?.meta?.target || '').includes('invoiceNumber');
      if (!isInvoiceConflict || attempt === maxRetries) {
        throw error;
      }

      logger.warn('invoice.set.conflict_retry', {
        order_id: orderId,
        attempt,
        reason: 'invoiceNumber unique conflict',
      });
    }
  }

  throw new Error('Unable to set unique invoice number');
};

export const createRazorpayOrder = async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized: Login required' });
  }

  const {
    amount: requestedAmount,
    currency = 'INR',
    receipt,
    items,
    customerEmail,
    customerName,
    paymentMethod,
    shippingAddress,
    couponCode
  } = req.body;

  try {
    const validation = validateCheckoutPayload({ items, shippingAddress, customerEmail, customerName });
    if (!validation.ok) {
      return res.status(400).json({
        message: 'Invalid checkout details: Shipping address and items are required',
        missing: validation.missing,
        itemErrors: validation.itemErrors,
      });
    }

    const resolvedCountry =
      shippingAddress?.country ||
      (shippingAddress?.pinCode && /^[1-9][0-9]{5}$/.test(String(shippingAddress.pinCode)) ? 'India' : null) ||
      'India';

    const normalizedCouponCode = couponCode ? String(couponCode).trim().toUpperCase() : null;
    const coupon = normalizedCouponCode
      ? await prisma.coupon.findUnique({ where: { code: normalizedCouponCode } })
      : null;

    const totals = calculateOrderTotals({
      items,
      coupon: coupon?.isActive ? coupon : null,
      country: resolvedCountry,
      paymentMethod,
    });

    const amount = totals.finalTotal;

    console.log('📨 REQUEST BODY:', {
      requestedAmount,
      amount,
      currency,
      paymentMethod,
      itemsCount: items?.length,
      shippingAddressKeys: Object.keys(shippingAddress || {}),
      shippingAddress: shippingAddress
    });

    logger.info('payments.create.request_received', {
      user_id: req.user?.id || null,
      payment_method: paymentMethod || null,
      status: 'requested',
      item_count: Array.isArray(items) ? items.length : 0,
      requested_amount: requestedAmount,
      calculated_amount: amount,
      shipping_country: resolvedCountry,
    });

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
      const order = await createOrderWithInvoiceRetry({
        totalAmount: amount,
        status: 'COD_PENDING',
        customerId: resolvedCustomerId,
        paymentMethod: 'cod',
        shippingAddress: {
          ...shippingAddress,
          country: resolvedCountry,
          pricing: {
            subtotal: totals.subtotal,
            couponDiscount: totals.couponDiscount,
            shippingCharge: totals.shippingCharge,
            codCharge: totals.codCharge,
            finalTotal: totals.finalTotal,
          },
          email: shippingAddress?.email || customerEmail || null,
          fullName: shippingAddress?.fullName ||
            [shippingAddress?.firstName, shippingAddress?.lastName].filter(Boolean).join(' ') ||
            customerName || null,
        },
        items: {
          create: items.map(item => ({
            productId: item.productId,
            productName: item.productName || item.name,
            quantity: item.quantity,
            price: item.price,
            variantTitle: item.variantTitle,
          })),
        },
      });

      logger.info('payments.create.order_inserted', {
        user_id: resolvedCustomerId,
        order_id: order.id,
        payment_id: null,
        status: order.status,
      });

      try {
        await notifyOrderCreated(order);
      } catch (error) {
        logger.error('payments.create.notify_order_created.error', {
          order_id: order.id,
          error: error?.message || String(error),
        });
      }

      await logActivity(order.id, 'ORDER_PLACED_COD_PENDING', 'Order placed with COD.');

      // Increment coupon usage if used
      if (normalizedCouponCode) {
        try {
          await prisma.coupon.update({
            where: { code: normalizedCouponCode },
            data: { usedCount: { increment: 1 } }
          });
        } catch (couponErr) {
          logger.error('payments.create.coupon_increment.error', {
            coupon_code: normalizedCouponCode,
            error: couponErr?.message || String(couponErr)
          });
        }
      }

      const emailToSend = shippingAddress?.email || customerEmail || null;
      if (emailToSend) {
        await sendMail(emailToSend, 'Order Confirmation - Ghar of Ethnics', TEMPLATES.ORDER_CONFIRMATION());
      }

      return res.json({ orderId: order.id, paymentMethod });
    }

    // 3. Handle Razorpay (Create a pending DB order before payment verification)
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

    // In development, when Razorpay keys are missing or invalid, return a mock order
    if (process.env.NODE_ENV === 'development' && (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)) {
      const mockOrder = {
        id: `order_mock_${Date.now()}`,
        amount: options.amount,
        currency: options.currency,
        receipt: options.receipt,
        created_at: Math.floor(Date.now() / 1000),
        paymentMethod: 'razorpay',
        notes: options.notes || {}
      };
      razorpayOrder = mockOrder;
    } else {
      razorpayOrder = await razorpay.orders.create(options);
    }

    const pendingOrder = await prisma.order.create({
      data: {
        totalAmount: amount,
        status: 'PAYMENT_PENDING',
        customerId: resolvedCustomerId,
        razorpayOrderId: razorpayOrder.id,
        paymentMethod: 'razorpay',
        shippingAddress: {
          ...normalizeAddressForSave(shippingAddress || {}, validation.resolvedName, validation.resolvedEmail),
          country: resolvedCountry,
          pricing: {
            subtotal: totals.subtotal,
            couponDiscount: totals.couponDiscount,
            shippingCharge: totals.shippingCharge,
            codCharge: totals.codCharge,
            finalTotal: totals.finalTotal,
          },
          couponCode: normalizedCouponCode,
        },
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName || item.name || null,
            quantity: item.quantity,
            price: item.price,
            variantTitle: item.variantTitle,
          })),
        },
      },
      include: { items: true },
    });

    logger.info('payments.create.pending_order_created', {
      user_id: resolvedCustomerId,
      order_id: pendingOrder.id,
      razorpay_order_id: razorpayOrder.id,
      status: pendingOrder.status,
    });

    res.json({
      orderId: pendingOrder.id,
      ...razorpayOrder,
      paymentMethod: 'razorpay',
    });

  } catch (error) {
    console.error('❌ PAYMENT CREATE ERROR:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      fullError: error
    });
    
    // If it's Razorpay auth error, provide helpful message
    if (error.statusCode === 401) {
      logger.error('payments.create.razorpay_auth_error', {
        user_id: req.user?.id || null,
        payment_method: paymentMethod || null,
        error: 'Invalid Razorpay credentials - check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env'
      });
      return res.status(500).json({ 
        message: 'Payment gateway configuration error. Please contact support.',
        details: 'Invalid Razorpay credentials'
      });
    }
    
    logger.error('payments.create.error', {
      user_id: req.user?.id || null,
      payment_method: paymentMethod || null,
      error: error.message,
      error_code: error.code,
      error_status: error.statusCode,
      stack: error.stack,
    });
    res.status(500).json({ message: error.message || 'Payment creation failed' });
  }
};

export const verifyPayment = async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized: Login required' });
  }

  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    orderData // Sent from frontend on success
  } = req.body;

  try {
    logger.info('payments.verify.request_received', {
      user_id: req.user?.id || null,
      payment_id: razorpay_payment_id || null,
      razorpay_order_id: razorpay_order_id || null,
      status: 'requested',
    });

    // 🔥 NEW: Log FULL orderData
    logger.info('🧾 ORDER_DATA_RECEIVED', {
      orderData
    });

    // 1. Verify Signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      logger.warn('payments.verify.signature_mismatch', {
        user_id: req.user?.id || null,
        payment_id: razorpay_payment_id || null,
        razorpay_order_id: razorpay_order_id || null,
        status: 'failed',
      });
      return res.status(400).json({ message: "Invalid signature sent!" });
    }

    logger.info('payments.verify.signature_valid', {
      user_id: req.user?.id || null,
      payment_id: razorpay_payment_id || null,
      razorpay_order_id: razorpay_order_id || null,
      status: 'verified',
    });

    // 🔥 NEW: Log products inside order
    logger.info('🛒 ORDER_ITEMS', {
      items: orderData?.items?.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        variant: i.variantTitle
      }))
    });

    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { razorpayPaymentId: razorpay_payment_id },
          { AND: [{ razorpayOrderId: razorpay_order_id }, { status: 'PAID' }] },
        ],
      },
      include: { items: true },
    });

    if (existingOrder) {
      logger.warn('payments.verify.idempotent_hit', {
        user_id: req.user?.id || null,
        payment_id: razorpay_payment_id || null,
        order_id: existingOrder.id,
        status: existingOrder.status,
      });
      return res.json({ message: 'Payment already verified', order: existingOrder });
    }

    const rpOrder = await razorpay.orders.fetch(razorpay_order_id);

    const paidAmount = rpOrder.amount / 100;

    const resolvedCountry =
      orderData?.shippingAddress?.country ||
      (orderData?.shippingAddress?.pinCode && /^[1-9][0-9]{5}$/.test(String(orderData.shippingAddress.pinCode)) ? 'India' : null) ||
      'India';

    const normalizedCouponCode = orderData?.couponCode ? String(orderData.couponCode).trim().toUpperCase() : null;
    const coupon = normalizedCouponCode
      ? await prisma.coupon.findUnique({ where: { code: normalizedCouponCode } })
      : null;

    const totals = calculateOrderTotals({
      items: orderData?.items || [],
      coupon: coupon?.isActive ? coupon : null,
      country: resolvedCountry,
      paymentMethod: 'razorpay',
    });

    if (Math.round(paidAmount) !== Math.round(totals.finalTotal)) {
      logger.warn('payments.verify.amount_mismatch', {
        razorpay_order_id,
        razorpay_payment_id,
        paid_amount: paidAmount,
        expected_amount: totals.finalTotal,
        shipping_country: resolvedCountry,
        coupon_code: normalizedCouponCode,
      });
      return res.status(400).json({ message: 'Order amount mismatch. Please contact support.' });
    }

    logger.info('💰 PAYMENT_DETAILS', {
      paidAmount,
      expectedAmount: totals.finalTotal,
      razorpay_amount: rpOrder.amount
    });

    let order = null;
    const requestedCustomerId = req.user?.id || orderData?.customerId || null;
    let resolvedCustomerId = null;

    if (requestedCustomerId) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { id: requestedCustomerId },
        select: { id: true }
      });
      resolvedCustomerId = existingCustomer?.id || null;
    }

    if (!resolvedCustomerId && orderData?.customerEmail) {
      const emailCustomer = await prisma.customer.findUnique({
        where: { email: String(orderData.customerEmail).trim().toLowerCase() },
        select: { id: true }
      });
      resolvedCustomerId = emailCustomer?.id || null;
    }

    // 🔥 NEW: Log before DB insert
    logger.info('📥 BEFORE_DB_INSERT', {
      customerId: resolvedCustomerId,
      totalAmount: paidAmount,
      itemCount: orderData.items?.length
    });

    if (!order) {
      const existingPendingOrder = await prisma.order.findUnique({
        where: { razorpayOrderId: razorpay_order_id },
        include: { items: true },
      });

      if (existingPendingOrder?.customerId && resolvedCustomerId && existingPendingOrder.customerId !== resolvedCustomerId) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this order' });
      }

      if (existingPendingOrder?.status === 'PAID' || existingPendingOrder?.razorpayPaymentId) {
        logger.warn('payments.verify.idempotent_hit', {
          user_id: resolvedCustomerId || null,
          payment_id: razorpay_payment_id || null,
          order_id: existingPendingOrder.id,
          status: existingPendingOrder.status,
        });
        return res.json({ message: 'Payment already verified', order: existingPendingOrder });
      }

      if (existingPendingOrder) {
        logger.info('payments.verify.before_db_update', {
          customerId: resolvedCustomerId,
          totalAmount: paidAmount,
          itemCount: orderData?.items?.length || 0,
          pending_order_id: existingPendingOrder.id,
        });

        order = await prisma.order.update({
          where: { id: existingPendingOrder.id },
          data: {
            totalAmount: paidAmount,
            status: 'PAID',
            customerId: resolvedCustomerId,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paymentMethod: 'razorpay',
            shippingAddress: {
              ...(existingPendingOrder.shippingAddress || {}),
              ...(orderData?.shippingAddress || {}),
              country: resolvedCountry,
              pricing: {
                subtotal: totals.subtotal,
                couponDiscount: totals.couponDiscount,
                shippingCharge: totals.shippingCharge,
                codCharge: totals.codCharge,
                finalTotal: totals.finalTotal,
              },
              email: orderData?.shippingAddress?.email || orderData?.customerEmail || existingPendingOrder?.shippingAddress?.email || null,
              fullName: orderData?.shippingAddress?.fullName || orderData?.customerName || existingPendingOrder?.shippingAddress?.fullName || null,
            },
          },
          include: { items: true },
        });

        if (!order.invoiceNumber) {
          try {
            order.invoiceNumber = await setInvoiceNumberWithRetry(order.id);
          } catch (invoiceErr) {
            logger.error('invoice.set.error', {
              order_id: order.id,
              error: invoiceErr?.message || String(invoiceErr),
            });
          }
        }

        logger.info('payments.verify.order_marked_paid', {
          user_id: resolvedCustomerId || null,
          order_id: order.id,
          payment_id: razorpay_payment_id,
          razorpay_order_id,
          status: order.status,
        });
      }
    }

    if (!order) {
      order = await createOrderWithInvoiceRetry({
      totalAmount: paidAmount,
      status: 'PAID',
      customerId: resolvedCustomerId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentMethod: 'razorpay',
      shippingAddress: {
        ...orderData.shippingAddress,
        country: resolvedCountry,
        pricing: {
          subtotal: totals.subtotal,
          couponDiscount: totals.couponDiscount,
          shippingCharge: totals.shippingCharge,
          codCharge: totals.codCharge,
          finalTotal: totals.finalTotal,
        },
        email: orderData.shippingAddress?.email || orderData.customerEmail || null,
        fullName: orderData.shippingAddress?.fullName || orderData.customerName || null,
      },
      items: {
        create: orderData.items.map(item => ({
          productId: item.productId,
          productName: item.productName || item.name,
          quantity: item.quantity,
          price: item.price,
          variantTitle: item.variantTitle,
        })),
      },
    }, 4, { items: true });
    }

    // 🔥 NEW: Confirm insert success
    logger.info('✅ ORDER_CREATED_SUCCESS', {
      order_id: order.id,
      payment_id: razorpay_payment_id,
      totalAmount: paidAmount
    });

    // Reduce inventory (don't fail payment if inventory reduction fails)
    try {
      await reduceInventory(order.id);
    } catch (inventoryError) {
      logger.error('payments.verify.inventory_reduce_failed', {
        order_id: order.id,
        payment_id: razorpay_payment_id,
        error: inventoryError.message,
        stack: inventoryError.stack
      });
      // Continue - don't throw, payment is still valid
    }

    // Track sales
    await Promise.all(order.items.map(item =>
      prisma.sale.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          source: 'Website',
          orderId: order.id,
          customerName: order.shippingAddress?.fullName || null,
          customerEmail: order.shippingAddress?.email || null,
          customerPhone: order.shippingAddress?.phone || null,
          paymentMode: 'Razorpay',
          paymentId: razorpay_payment_id
        }
      })
    ));

    // Send emails & notifications
    try {
      await notifyPaymentSuccess(order);
      await logActivity(order.id, 'PAYMENT_RECEIVED', `Payment of ₹${paidAmount} verified.`);
      
      const emailToSend = order.shippingAddress?.email || orderData.customerEmail || null;
      if (emailToSend) {
        await sendMail(emailToSend, 'Order Confirmation - Ghar of Ethnics', TEMPLATES.ORDER_CONFIRMATION());
        // Generate and send invoice
        const invoiceBuffer = await generateInvoice(order);
        if (invoiceBuffer) {
          const subject = `Invoice for Order #${order.invoiceNumber || order.id.slice(-6).toUpperCase()}`;
          const text = TEMPLATES.INVOICE(order.invoiceNumber || order.id);
          await sendInvoiceEmail(emailToSend, subject, text, invoiceBuffer);
        }
      }
    } catch (notifyErr) {
      logger.error('payments.verify.post_actions.error', {
        order_id: order.id,
        error: notifyErr.message
      });
    }

    res.json({ message: "Payment verified and order created successfully", order });

  } catch (error) {
    // 🔥 NEW: Detailed error log
    logger.error('❌ VERIFY_PAYMENT_FAILED', {
      error: error.message,
      stack: error.stack,
      razorpay_order_id,
      razorpay_payment_id
    });

    logger.error('payments.verify.error', {
      user_id: req.user?.id || null,
      payment_id: razorpay_payment_id || null,
      razorpay_order_id: razorpay_order_id || null,
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({ message: "Internal server error" });
  }
};


export const cancelPayment = async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized: Login required' });
  }

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

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CANCELED',
      cancellationReason: 'Cancelled before payment completion',
    },
  });

  logger.info('payments.cancel.marked_canceled', {
    user_id: req.user?.id || null,
    payment_id: order.razorpayPaymentId || null,
    order_id: order.id,
    status: 'CANCELED',
  });

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

    // Reduce inventory (don't fail payment if inventory reduction fails)
    try {
      await reduceInventory(orderId);
    } catch (inventoryError) {
      logger.error('payments.cod.inventory_reduce_failed', {
        order_id: orderId,
        error: inventoryError.message,
        stack: inventoryError.stack
      });
      // Continue - don't throw, payment is still valid
    }

    // Track the sale
    await Promise.all(order.items.map(item =>
      prisma.sale.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          source: 'Website',
          orderId: order.id,
          customerName: `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`.trim() || null,
          customerEmail: order.shippingAddress?.email || null,
          customerPhone: order.shippingAddress?.phone || null,
          paymentMode: 'COD',
          paymentId: order.razorpayPaymentId || null
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
