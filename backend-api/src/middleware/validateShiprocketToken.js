/**
 * Middleware to validate Shiprocket webhook API key
 * Checks the x-api-key header against the configured secret token
 */

const SHIPROCKET_API_KEY = process.env.SHIPROCKET_API_KEY || 'mysecret123';
const SHIPROCKET_STRICT_TOKEN = process.env.SHIPROCKET_STRICT_TOKEN === 'true';

export const validateShiprocketToken = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['api-key'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!apiKey) {
    console.warn('[Shiprocket Webhook] Missing API key header; continuing in non-strict mode for webhook compatibility');
    req.shiprocketAuth = { validated: false, reason: 'missing-api-key' };
    return next();
  }

  if (apiKey !== SHIPROCKET_API_KEY) {
    console.warn('[Shiprocket Webhook] Invalid API key attempt');

    if (SHIPROCKET_STRICT_TOKEN) {
      return res.status(403).json({ 
        error: 'Forbidden: Invalid API key',
        timestamp: new Date().toISOString()
      });
    }

    req.shiprocketAuth = { validated: false, reason: 'invalid-api-key' };
    return next();
  }

  // Token is valid, proceed
  req.shiprocketAuth = { validated: true };
  next();
};
