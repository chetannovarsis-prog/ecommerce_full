/**
 * Shiprocket Webhook Service
 * Handles incoming webhooks from Shiprocket and updates order status
 */

import prisma from '../utils/prisma.js';
import { logActivity } from './activityService.js';

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
  const statusMap = {
    'SHIPPED': 'SHIPPED',
    'IN TRANSIT': 'SHIPPED',
    'OUT FOR DELIVERY': 'SHIPPED',
    'DELIVERED': 'DELIVERED',
    'RTO': 'CANCELED',
    'CANCELLED': 'CANCELED',
    'PENDING': 'ORDERED',
    'READY_TO_SHIP': 'ORDERED',
    'UNDELIVERED': 'SHIPPED'
  };

  return statusMap[shiprocketStatus?.toUpperCase()] || 'ORDERED';
};

/**
 * Extract important fields from Shiprocket webhook payload
 */
export const extractWebhookPayload = (body) => {
  return {
    awb: body.awb || body.awb_number || body.tracking_number,
    shiprocketStatus: body.current_status || body.shipment_status || body.status,
    orderId: body.order_id || body.customer_reference_id,
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
    const { awb, shiprocketStatus, orderId, courierName, eventTime } = extractWebhookPayload(payload);

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
    const order = await findOrderByIdOrAwb(orderId, awb);

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

    // Send customer notification (optional - implement based on your needs)
    try {
      if (updatedOrder.customer?.email) {
        // You can implement notification logic here
        // await notifyOrderStatus(updatedOrder, internalStatus);
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
