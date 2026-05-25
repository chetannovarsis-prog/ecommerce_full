import https from 'https';
import { validatePincodeFormat } from '../utils/validation.js';

/**
 * Logistics Service - Handles Pincode serviceability and external lookups.
 * Ready for future Shiprocket/Delhivery integration.
 */

// ─── Pincode Cache (in-memory, server-level) ───────────────────────────────
const _pincodeCacheServer = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Helper: Fetch from HTTPS URL with custom agent
const fetchFromHttps = (url) => {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
    });

    https.get(url, { agent, timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    }).on('error', reject);
  });
};

export const getPincodeDetails = async (pincode) => {
  // Format validation
  if (!validatePincodeFormat(pincode)) {
    return { success: false, message: 'Invalid Pincode format.' };
  }

  // Check server-side cache
  if (_pincodeCacheServer.has(pincode)) {
    const cached = _pincodeCacheServer.get(pincode);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ Cache HIT for pincode ${pincode}`);
      return { success: true, data: cached.data };
    }
    _pincodeCacheServer.delete(pincode);
  }

  // Fetch from India Post API with native HTTPS
  try {
    console.log(`🔍 Fetching pincode ${pincode} from India Post API...`);
    const response = await fetchFromHttps(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = response?.[0];
    
    if (!data || data.Status !== 'Success' || !data.PostOffice?.length) {
      console.warn(`⚠️ Pincode ${pincode} not found in API`);
      return { success: false, message: 'Pincode not found or not serviceable.' };
    }

    // Cache the result
    const cachedData = {
      PostOffice: data.PostOffice,
      Status: data.Status
    };
    _pincodeCacheServer.set(pincode, { data: cachedData, timestamp: Date.now() });
    console.log(`✅ Pincode ${pincode} fetched and cached:`, cachedData.PostOffice[0]?.District, cachedData.PostOffice[0]?.State);

    return { success: true, data: cachedData };
  } catch (error) {
    console.error(`❌ Pincode fetch error for ${pincode}:`, error.message);
    return { success: false, message: 'Could not fetch pincode details. Please try again.' };
  }
};

export const checkPincodeServiceability = async (pincode) => {
  // Layer 1: Format Check
  if (!validatePincodeFormat(pincode)) {
    return { success: false, message: 'Invalid Pincode format.' };
  }

  // Layer 2: India Post External Validation (Verification of existence)
  try {
    const result = await getPincodeDetails(pincode);
    if (!result.success) {
      return { success: false, message: 'Pincode not found in official registry.' };
    }
  } catch (error) {
    console.error('India Post API Error:', error.message);
    // If external API is down, maybe allow for now (optional fallback)
  }

  // Layer 3: Logistics Partner Serviceability (Future Integration)
  // Example: Shiprocket check_serviceability API here
  
  return { success: true };
};
