import https from 'https';

const _intlPostalCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const fetchFromHttps = (url) => {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
    });

    https
      .get(url, { agent, timeout: 6000 }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        });
      })
      .on('error', reject);
  });
};

const normalizePostal = (postal = '') => String(postal || '').trim();

const detectCountryCandidates = (postalRaw) => {
  const postal = normalizePostal(postalRaw).toUpperCase();

  // US ZIP: 10001 or 10001-1234
  if (/^\d{5}(-\d{4})?$/.test(postal)) return ['US'];

  // Canada: A1A 1A1
  if (/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(postal)) return ['CA'];

  // UK: broad match (e.g., SW1A 1AA, W1A 0AX, EC1A 1BB)
  if (/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(postal)) return ['GB'];

  // Fallback: try common ones first
  return ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL'];
};

export const getInternationalPostalDetails = async ({ postalCode, countryCode = null }) => {
  const postal = normalizePostal(postalCode);
  if (!postal) return { success: false, message: 'Postal code is required.' };

  const candidates = countryCode
    ? [String(countryCode).trim().toUpperCase()]
    : detectCountryCandidates(postal);

  for (const cc of candidates) {
    const cacheKey = `${cc}:${postal.toUpperCase()}`;
    const cached = _intlPostalCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { success: true, data: cached.data };
    }

    try {
      const response = await fetchFromHttps(
        `https://api.zippopotam.us/${encodeURIComponent(cc.toLowerCase())}/${encodeURIComponent(postal)}`
      );

      const place = response?.places?.[0];
      if (!place) continue;

      const result = {
        country: response?.country || cc,
        countryCode: response?.['country abbreviation'] || cc,
        city: place['place name'] || '',
        state: place['state'] || '',
        stateCode: place['state abbreviation'] || '',
      };

      _intlPostalCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return { success: true, data: result };
    } catch (err) {
      // Try next candidate
    }
  }

  return { success: false, message: 'Postal code not found.' };
};

