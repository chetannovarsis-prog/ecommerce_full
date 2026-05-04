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

// Shiprocket may send bodies as JSON, form-urlencoded, or plain text depending on the webhook/testing path.
router.use(express.json({ type: ['application/json', 'application/*+json', 'text/plain'] }));
router.use(express.urlencoded({ extended: true }));
router.use(express.text({ type: ['text/plain', 'application/xml', 'application/octet-stream'] }));

/**
 * POST /api/webhook/shipping
 * Main webhook endpoint - requires x-api-key header validation
 * Uses generic route name to avoid Shiprocket URL filtering issues
 */
router.post('/shipping', validateShiprocketToken, handleShiprocketWebhook);

/**
 * GET /api/webhook/shipping
 * Handle ping/verification requests from Shiprocket
 */
router.get('/shipping', (req, res) => res.status(200).send('OK'));

/**
 * GET /api/webhook/shipping/health
 * Health check endpoint - no token required
 */
router.get('/shipping/health', shiprocketWebhookHealth);

export default router;
