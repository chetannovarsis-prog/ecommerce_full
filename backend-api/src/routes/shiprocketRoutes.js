/**
 * Shiprocket Webhook Routes
 * Handles all Shiprocket webhook endpoints
 * 
 * Note: Route is /api/webhook/shipping (NOT /shiprocket/webhook)
 * Reason: Shiprocket sometimes blocks/behaves inconsistently with URLs containing "shiprocket"
 */

import express from 'express';
import { validateShiprocketToken } from '../middleware/validateShiprocketToken.js';
import { 
  handleShiprocketWebhook,
  shiprocketWebhookHealth
} from '../controllers/shiprocketController.js';

const router = express.Router();

/**
 * POST /api/webhook/shipping
 * Main webhook endpoint - requires x-api-key header validation
 * Uses generic route name to avoid Shiprocket URL filtering issues
 */
router.post('/shipping', validateShiprocketToken, handleShiprocketWebhook);

/**
 * GET /api/webhook/shipping/health
 * Health check endpoint - no token required
 */
router.get('/shipping/health', shiprocketWebhookHealth);

export default router;
