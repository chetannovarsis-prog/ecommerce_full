/**
 * Shiprocket Webhook Controller
 * Handles incoming webhooks from Shiprocket
 * 
 * IMPORTANT: Returns proper HTTP status codes:
 * - 200: Valid webhook processed successfully
 * - 400: Invalid payload structure or missing required fields
 * - 401: Missing X-API-Key header
 * - 403: Invalid API key
 * - 404: Order not found in database
 * - 500: Server error during processing
 */

import { 
  validateWebhookPayload, 
  updateOrderFromShiprocket 
} from '../services/shiprocketWebhookService.js';

/**
 * Handle Shiprocket webhook POST requests
 * Endpoint: POST /api/webhook/shipping
 * 
 * Returns appropriate HTTP status codes for proper error handling
 */
export const handleShiprocketWebhook = async (req, res) => {
  try {
    // Log incoming webhook
    console.log('[Shiprocket Webhook] Received request from:', req.ip);

    // Validate payload structure
    const validation = validateWebhookPayload(req.body);
    if (!validation.valid) {
      console.warn('[Shiprocket] Invalid payload:', validation.errors);
      return res.status(400).json({
        error: 'Invalid webhook payload',
        details: validation.errors,
        timestamp: new Date().toISOString()
      });
    }

    // Process the webhook
    const result = await updateOrderFromShiprocket(req.body);

    // Return appropriate status code based on result
    if (!result.success) {
      // Determine appropriate error status
      if (result.error?.includes('not found')) {
        // Order not found - 404
        console.error('[Shiprocket] Order not found:', result.error);
        return res.status(404).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString()
        });
      } else {
        // Other server errors - 500
        console.error('[Shiprocket] Processing error:', result.error);
        return res.status(500).json({
          success: false,
          error: 'Webhook processing failed',
          details: process.env.NODE_ENV === 'development' ? result.error : undefined,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Success - 200 OK
    res.status(200).json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
      isDuplicate: result.isDuplicate || false
    });

    console.log('[Shiprocket] Webhook processed successfully:', result.message);
  } catch (error) {
    // Unexpected server error - 500
    console.error('[Shiprocket Webhook] Unexpected error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Health check endpoint for Shiprocket webhook testing
 * Endpoint: GET /api/webhook/shipping/health
 * Returns: 200 OK always (endpoint availability check)
 */
export const shiprocketWebhookHealth = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Shiprocket webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
};
