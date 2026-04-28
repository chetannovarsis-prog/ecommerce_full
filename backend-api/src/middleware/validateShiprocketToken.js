/**
 * Middleware to validate Shiprocket webhook API key
 * Checks the x-api-key header against the configured secret token
 */

const SHIPROCKET_API_KEY = process.env.SHIPROCKET_API_KEY || 'mysecret123';

export const validateShiprocketToken = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    console.warn('[Shiprocket Webhook] Missing x-api-key header');
    return res.status(401).json({ 
      error: 'Unauthorized: Missing x-api-key header',
      timestamp: new Date().toISOString()
    });
  }

  if (apiKey !== SHIPROCKET_API_KEY) {
    console.warn('[Shiprocket Webhook] Invalid API key attempt');
    return res.status(403).json({ 
      error: 'Forbidden: Invalid API key',
      timestamp: new Date().toISOString()
    });
  }

  // Token is valid, proceed
  next();
};
