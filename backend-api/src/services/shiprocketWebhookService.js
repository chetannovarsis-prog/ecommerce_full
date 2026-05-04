/**
 * Shiprocket Webhook Service
 * Handles incoming webhooks from Shiprocket and updates order status
 */

import prisma from '../utils/prisma.js';
import { logActivity } from './activityService.js';
import { sendMail, TEMPLATES } from '../utils/mailer.js';

/**
 * Log failed webhook for manual reprocessing
 * Stores in-memory log (can be extended to database table)
 */
const failedWebhookLog = [];

export const logFailedWebhook = (payload, error, reason) => {
  const failedEntry = {
    timestamp: new Date().toISOString(),
    orderId: payload.order_id || payload.customer_reference_id,
    shiprocketStatus: payload.current_status || payload.shipment_status,
    error,
    reason,
    payload,
    retriesAttempted: 0,
    maxRetries: 3
  };

  failedWebhookLog.push(failedEntry);
  console.log(`[Shiprocket] Failed webhook logged for order: ${failedEntry.orderId}. Reason: ${reason}`);
  console.log(`[Shiprocket] Total failed webhooks: ${failedWebhookLog.length}`);

  // TODO: Optionally persist to database for long-term tracking
  // await prisma.webhookLog.create({ data: failedEntry });

  return failedEntry;
};

/**
 * Get failed webhooks for manual inspection/reprocessing
 */
export const getFailedWebhooks = () => {
  return failedWebhookLog;
};

/**
 * Retry a failed webhook
 */
export const retryFailedWebhook = async (webhookId) => {
  const failed = failedWebhookLog.find((w, i) => i === webhookId);
  if (!failed) {
    return { success: false, error: 'Webhook not found' };
  }

  if (failed.retriesAttempted >= failed.maxRetries) {
    return { success: false, error: 'Max retries exceeded' };
  }

  console.log(`[Shiprocket] Retrying webhook for order: ${failed.orderId}`);
  failed.retriesAttempted++;

  return updateOrderFromShiprocket(failed.payload);
};

/**
 * Map Shiprocket status to internal order status
 */
export const mapShiprocketStatus = (shiprocketStatus) => {
  const normalizedStatus = String(shiprocketStatus || '').trim().toUpperCase();
  const statusMap = {
    'SHIPPED': 'SHIPPED',
    'IN TRANSIT': 'IN_TRANSIT',
    'OUT FOR DELIVERY': 'OUT_FOR_DELIVERY',
    'DELIVERED': 'DELIVERED',
    'PICKUP SCHEDULED': 'PICKUP_SCHEDULED',
    'PICKUP FAILED': 'PICKUP_FAILED',
    'RETURN RECEIVED': 'RETURN_RECEIVED',
    'RTO': 'CANCELED',
    'CANCELLED': 'CANCELED',
    'PENDING': 'ORDERED',
    'READY_TO_SHIP': 'ORDERED',
    'UNDELIVERED': 'SHIPPED'
  };

  return statusMap[normalizedStatus] || normalizedStatus.replace(/[^A-Z0-9]+/g, '_') || 'ORDERED';
};

/**
 * Extract important fields from Shiprocket webhook payload
 */
export const extractWebhookPayload = (body) => {
  const rawOrderId = body.order_id || body.customer_reference_id;
  const isReturnShipment = Boolean(body.is_return === 1 || body.is_return === true || /^RETURN-/i.test(String(rawOrderId || '')));
  const baseOrderId = String(rawOrderId || '').replace(/^RETURN-/i, '');

  return {
    awb: body.awb || body.awb_number || body.tracking_number,
    shiprocketStatus: body.current_status || body.shipment_status || body.status,
    orderId: rawOrderId,
    baseOrderId: baseOrderId || rawOrderId,
    isReturnShipment,
    courierName: body.courier_name || body.courier || 'Unknown',
    eventTime: body.event_time || body.timestamp || new Date().toISOString(),
    rawPayload: body
  };
};

/**
 * Find order by order_id or awb
 */
const findOrderByIdOrAwb = async (orderId, awb) => {
  let order = null;

  // Try to find by orderId first
  if (orderId) {
    order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { email: true, name: true } },
        items: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    });
  }

  // If not found and awb exists, find by awb (stored in shippingAddress JSON or custom field)
  if (!order && awb) {
    // Try to find in orders where shippingAddress JSON contains the awb
    // For now, we'll just warn about this limitation
    console.warn(`[Shiprocket] Could not find order by orderId (${orderId}). AWB tracking (${awb}) would require additional database field.`);
  }

  return order;
};

/**
 * Check if status update is a duplicate (idempotency check)
 */
const isDuplicateUpdate = (currentStatus, newStatus, lastActivityTime) => {
  // If same status, likely a duplicate
  if (currentStatus === newStatus) {
    return true;
  }

  // If last activity was within 5 seconds with same status change, it's a duplicate
  if (lastActivityTime) {
    const timeSinceLastActivity = Date.now() - new Date(lastActivityTime).getTime();
    if (timeSinceLastActivity < 5000) {
      return true;
    }
  }

  return false;
};

/**
 * Update order status from Shiprocket webhook
 * Returns { success: boolean, message: string, order?: Order, error?: string }
 */
export const updateOrderFromShiprocket = async (payload) => {
  try {
    // Extract webhook data
    const { awb, shiprocketStatus, orderId, baseOrderId, isReturnShipment, courierName, eventTime } = extractWebhookPayload(payload);
    const lookupOrderId = baseOrderId || orderId;

    console.log('[Shiprocket] Processing webhook:', {
      awb,
      shiprocketStatus,
      orderId,
      courierName,
      eventTime
    });

    // Validate required fields
    if (!shiprocketStatus) {
      const errorMsg = 'Missing shiprocket status in webhook payload';
      logFailedWebhook(payload, errorMsg, 'Invalid payload');
      return {
        success: false,
        error: errorMsg
      };
    }

    if (!orderId) {
      const errorMsg = 'Missing order_id in webhook payload. Cannot locate order.';
      logFailedWebhook(payload, errorMsg, 'Missing order_id');
      return {
        success: false,
        error: errorMsg
      };
    }

    // Find the order
    const order = await findOrderByIdOrAwb(lookupOrderId, awb);

    if (!order) {
      const errorMsg = `Order not found with ID: ${orderId}`;
      console.warn(`[Shiprocket] ${errorMsg}`);
      logFailedWebhook(payload, errorMsg, 'Order not found');
      return {
        success: false,
        error: errorMsg
      };
    }

    // Map Shiprocket status to internal status
    const internalStatus = mapShiprocketStatus(shiprocketStatus);

    // Reverse pickup lifecycle for return/exchange shipments is tracked separately from forward order delivery.
    if (isReturnShipment || String(orderId || '').toUpperCase().startsWith('RETURN-')) {
      const returnRequest = await prisma.returnRequest.findFirst({
        where: { orderId: order.id },
        include: {
          order: {
            include: {
              items: {
                include: { product: true }
              }
            }
          }
        }
      });

      if (!returnRequest) {
        logger.warn('shiprocket.return_request_not_found', { order_id: order.id, shiprocket_status: shiprocketStatus });
        return {
          success: true,
          message: 'Return shipment webhook received but no return request was found',
          order
        };
      }

      const pickupStatusMap = {
        PICKUP_SCHEDULED: 'SCHEDULED',
        PICKUP_FAILED: 'FAILED',
        IN_TRANSIT: 'IN_TRANSIT',
        RETURN_RECEIVED: 'RECEIVED',
        DELIVERED: 'RECEIVED'
      };

      const nextPickupStatus = pickupStatusMap[internalStatus] || returnRequest.pickupStatus || 'REQUESTED';
      const isReceivedAtWarehouse = nextPickupStatus === 'RECEIVED';

      await prisma.returnRequest.update({
        where: { id: returnRequest.id },
        data: {
          pickupStatus: nextPickupStatus,
          ...(isReceivedAtWarehouse ? { inspectionStatus: 'RECEIVED' } : {})
        }
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: isReceivedAtWarehouse
            ? (returnRequest.type || 'RETURN').toUpperCase() === 'EXCHANGE'
              ? 'EXCHANGE_RECEIVED'
              : 'RETURN_RECEIVED'
            : order.status
        }
      }).catch(() => null);

      await logActivity(
        order.id,
        isReceivedAtWarehouse ? 'RETURN_SHIPMENT_RECEIVED' : internalStatus,
        `Shiprocket reverse shipment update: ${shiprocketStatus} (AWB: ${awb || 'N/A'}, Courier: ${courierName})`
      );

      const customerEmail = returnRequest.order?.customer?.email || returnRequest.order?.shippingAddress?.email || null;

      if (internalStatus === 'PICKUP_SCHEDULED' && customerEmail) {
        const subject = (returnRequest.type || 'RETURN').toUpperCase() === 'EXCHANGE'
          ? 'Exchange Pickup Scheduled - Ghar of Ethnics'
          : 'Return Pickup Scheduled - Ghar of Ethnics';
        const bodyText = (returnRequest.type || 'RETURN').toUpperCase() === 'EXCHANGE'
          ? TEMPLATES.EXCHANGE_PICKUP_SCHEDULED()
          : TEMPLATES.RETURN_PICKUP_SCHEDULED();
        await sendMail(customerEmail, subject, bodyText);
      }

      if (internalStatus === 'PICKUP_FAILED') {
        if ((returnRequest.type || 'RETURN').toUpperCase() === 'EXCHANGE' && returnRequest.preferredVariantTitle) {
          const exchangeItem = (returnRequest.order.items || []).find((item) => item.variantTitle);
          if (exchangeItem) {
            const reservedVariant = await prisma.productVariant.findFirst({
              where: {
                productId: exchangeItem.productId,
                title: returnRequest.preferredVariantTitle
              }
            });

            if (reservedVariant && reservedVariant.reservedStock > 0) {
              await prisma.productVariant.update({
                where: { id: reservedVariant.id },
                data: { reservedStock: { decrement: 1 } }
              });
            }
          }
        }

        if (customerEmail) {
          const subject = (returnRequest.type || 'RETURN').toUpperCase() === 'EXCHANGE'
            ? 'Exchange Pickup Failed - Ghar of Ethnics'
            : 'Return Pickup Failed - Ghar of Ethnics';
          await sendMail(
            customerEmail,
            subject,
            TEMPLATES.RETURN_PICKUP_FAILED()
          );
        }
      }

      if (isReceivedAtWarehouse) {
        if ((returnRequest.type || 'RETURN').toUpperCase() === 'EXCHANGE') {
          const exchangeItem = (returnRequest.order.items || []).find((item) => item.variantTitle);
          if (exchangeItem && returnRequest.preferredVariantTitle) {
            await prisma.$transaction(async (tx) => {
              const originalVariant = exchangeItem.variantTitle
                ? await tx.productVariant.findFirst({
                    where: {
                      productId: exchangeItem.productId,
                      title: exchangeItem.variantTitle
                    }
                  })
                : null;

              const preferredVariant = await tx.productVariant.findFirst({
                where: {
                  productId: exchangeItem.productId,
                  title: returnRequest.preferredVariantTitle
                }
              });

              if (!preferredVariant) {
                throw new Error(`Preferred variant not found: ${returnRequest.preferredVariantTitle}`);
              }

              const exchangeQty = Math.max(1, exchangeItem.quantity || 1);
              const reservedQty = Math.min(exchangeQty, preferredVariant.reservedStock || 0);

              if (originalVariant) {
                await tx.productVariant.update({
                  where: { id: originalVariant.id },
                  data: { stock: { increment: exchangeQty } }
                });
              }

              await tx.productVariant.update({
                where: { id: preferredVariant.id },
                data: {
                  reservedStock: { decrement: reservedQty },
                  stock: { decrement: exchangeQty }
                }
              });

              await tx.orderItem.update({
                where: { id: exchangeItem.id },
                data: { variantTitle: returnRequest.preferredVariantTitle }
              });

              await tx.returnRequest.update({
                where: { id: returnRequest.id },
                data: {
                  inspectionStatus: 'RECEIVED',
                  pickupStatus: 'RECEIVED'
                }
              });
            });

            await logActivity(
              order.id,
              'EXCHANGE_RECEIVED',
              `Return item received at warehouse and exchange stock finalized for ${returnRequest.preferredVariantTitle}`
            );

            if (customerEmail) {
              await sendMail(
                customerEmail,
                'Exchange Item Received - Ghar of Ethnics',
                TEMPLATES.EXCHANGE_RECEIVED(returnRequest.preferredVariantTitle || '')
              );
            }
          }
        } else {
          await prisma.returnRequest.update({
            where: { id: returnRequest.id },
            data: { inspectionStatus: 'RECEIVED', pickupStatus: 'RECEIVED' }
          });

          if (customerEmail) {
            await sendMail(
              customerEmail,
              'Return Item Received - Ghar of Ethnics',
              TEMPLATES.RETURN_RECEIVED()
            );
          }
        }
      }

      return {
        success: true,
        message: `Return shipment status updated to ${internalStatus}`,
        order,
        returnRequest
      };
    }

    // Check for duplicate updates (idempotency)
    const lastActivity = order.activities?.[0];
    if (isDuplicateUpdate(order.status, internalStatus, lastActivity?.createdAt)) {
      console.log(`[Shiprocket] Duplicate update detected for order ${orderId}, skipping.`);
      return {
        success: true,
        message: 'Duplicate update ignored (idempotency)',
        order,
        isDuplicate: true
      };
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: internalStatus,
        updatedAt: new Date(eventTime),
        shippingAddress: {
          ...(order.shippingAddress || {}),
          awb,
          courierName,
          lastStatusUpdate: eventTime
        }
      },
      include: {
        customer: { select: { email: true, name: true } },
        items: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    });

    // Log activity
    await logActivity(
      order.id,
      internalStatus,
      `Shiprocket webhook: ${shiprocketStatus} (AWB: ${awb}, Courier: ${courierName})`
    );

    // Send customer notification
    try {
      const customerEmail = updatedOrder.customer?.email || (updatedOrder.shippingAddress && updatedOrder.shippingAddress.email);
      
      if (customerEmail) {
        let mailBody = '';
        let subject = `Order Update: #${updatedOrder.invoiceNumber || updatedOrder.id.slice(-8).toUpperCase()}`;

        switch (internalStatus) {
          case 'SHIPPED':
            // Construct a tracking link or use awb
            const trackingUrl = awb ? `https://shiprocket.co/tracking/${awb}` : '';
            mailBody = TEMPLATES.ORDER_SHIPPED(trackingUrl);
            break;
          case 'IN_TRANSIT':
            mailBody = `Dear Customer, \nYour order is in transit and moving towards your city.\nRegards,\nGhar of Ethnics`;
            break;
          case 'OUT_FOR_DELIVERY':
            mailBody = TEMPLATES.OUT_FOR_DELIVERY();
            break;
          case 'DELIVERED':
            mailBody = TEMPLATES.DELIVERED();
            break;
        }

        if (mailBody) {
          await sendMail(customerEmail, subject, mailBody);
        }
      }
    } catch (notificationError) {
      console.error('[Shiprocket] Notification failed:', notificationError.message);
    }

    console.log(`[Shiprocket] Order ${orderId} updated successfully to status: ${internalStatus}`);

    return {
      success: true,
      message: `Order status updated to ${internalStatus}`,
      order: updatedOrder
    };
  } catch (error) {
    console.error('[Shiprocket] Error updating order:', error);
    const errorMsg = error.message || 'Unknown error occurred while updating order';
    logFailedWebhook(payload, errorMsg, 'Processing error');
    return {
      success: false,
      error: errorMsg
    };
  }
};

/**
 * Validate Shiprocket webhook payload structure
 */
export const validateWebhookPayload = (body) => {
  const errors = [];

  if (!body) {
    errors.push('Empty webhook payload');
  }

  if (!body.current_status && !body.shipment_status && !body.status) {
    errors.push('Missing status field (current_status, shipment_status, or status)');
  }

  if (!body.order_id && !body.customer_reference_id) {
    errors.push('Missing order_id or customer_reference_id');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
