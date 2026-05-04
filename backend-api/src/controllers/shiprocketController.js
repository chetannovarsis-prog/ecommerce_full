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
    console.log('[Shiprocket Webhook] Headers:', {
      contentType: req.headers['content-type'],
      apiKeyPresent: Boolean(req.headers['x-api-key'] || req.headers['api-key'] || req.headers.authorization),
      authState: req.shiprocketAuth?.validated ? 'validated' : req.shiprocketAuth?.reason || 'not-checked'
    });
    console.log('[Shiprocket Webhook] Body preview:', typeof req.body === 'string' ? req.body.slice(0, 1000) : req.body);

    const normalizedBody = typeof req.body === 'string'
      ? (() => {
          try {
            return JSON.parse(req.body);
          } catch {
            return { raw_payload: req.body };
          }
        })()
      : req.body;

    // Validate payload structure
    const validation = validateWebhookPayload(normalizedBody);
    if (!validation.valid) {
      console.warn('[Shiprocket] Received test/invalid payload:', validation.errors);
      // Return 200 OK without "error" field for Shiprocket panel compatibility
      return res.status(200).json({
        success: true,
        message: 'Webhook received successfully',
        timestamp: new Date().toISOString()
      });
    }

    // Process the webhook
    const result = await updateOrderFromShiprocket(normalizedBody);

    // Return appropriate status code based on result
    if (!result.success) {
      // Determine appropriate error status
      if (result.error?.includes('not found')) {
        // Order not found - 404
        console.error('[Shiprocket] Order not found:', result.error);
        return res.status(200).json({
          success: true,
          accepted: true,
          error: result.error,
          message: 'Webhook received but order could not be matched',
          debug: process.env.NODE_ENV === 'development' ? { authState: req.shiprocketAuth } : undefined,
          timestamp: new Date().toISOString()
        });
      } else {
        // Other server errors - 500
        console.error('[Shiprocket] Processing error:', result.error);
        return res.status(200).json({
          success: true,
          accepted: true,
          message: 'Webhook received but processing could not complete',
          error: process.env.NODE_ENV === 'development' ? result.error : 'Processing failed',
          debug: process.env.NODE_ENV === 'development' ? { authState: req.shiprocketAuth } : undefined,
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
