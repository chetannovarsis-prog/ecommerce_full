import prisma from '../utils/prisma.js';
import { normalizeString, validateEmailFormat, validatePhoneFormat, validatePincodeFormat } from '../utils/validation.js';
import { checkPincodeServiceability, getPincodeDetails } from '../services/logisticsService.js';
import { isIndia } from '../utils/orderPricing.js';
import { getInternationalPostalDetails } from '../services/internationalPostalService.js';

/**
 * Address Controller - Handles server-side validation and storage.
 */

export const validateAddress = async (req, res) => {
  try {
    const { 
      country,
      email, 
      name, 
      phone, 
      addressLine1, 
      addressLine2, 
      city, 
      state, 
      pincode 
    } = req.body;

    const errors = {};
    const resolvedCountry = country || (validatePincodeFormat(pincode) ? 'India' : '');
    const india = isIndia(resolvedCountry);

    // 1. Basic Format Validation
    if (!validateEmailFormat(email)) errors.email = 'Invalid email address.';
    if (!name || name.trim().length < 3) errors.name = 'Name must be at least 3 characters.';
    if (india) {
      if (!validatePhoneFormat(phone)) errors.phone = 'Invalid phone number (6-9 followed by 9 digits).';
    } else {
      const digits = String(phone || '').replace(/[^0-9]/g, '');
      if (digits.length < 7 || digits.length > 15) errors.phone = 'Invalid phone number.';
    }
    if (!addressLine1 || addressLine1.trim().length < 10) errors.addressLine1 = 'Address must be at least 10 characters.';
    if (!city) errors.city = 'City is required.';
    if (india) {
      if (!state) errors.state = 'State is required.';
      if (!validatePincodeFormat(pincode)) errors.pincode = 'Invalid pincode format.';
    } else {
      if (!pincode || String(pincode).trim().length < 3) errors.pincode = 'Invalid postal/ZIP code.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // 2. Logistics Serviceability Check (India only)
    if (india) {
      const serviceability = await checkPincodeServiceability(pincode);
      if (!serviceability.success) {
        return res.status(400).json({ 
          success: false, 
          errors: { pincode: serviceability.message || 'Pincode not serviceable.' } 
        });
      }
    }

    // 3. Normalization (Internal use)
    const normalizedCity = normalizeString(city);
    const normalizedState = normalizeString(state);

    res.json({ 
      success: true, 
      message: 'Address validated successfully.',
      normalized: { city: normalizedCity, state: normalizedState },
      country: resolvedCountry || null,
    });

  } catch (error) {
    console.error('Validate Address Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during validation.' });
  }
};

export const saveAddress = async (req, res) => {
  try {
    const { id: customerId } = req.user; // Assuming auth middleware
    const { 
      name, 
      firstName, 
      lastName, 
      phone, 
      address, 
      addressLine1, 
      apartment, 
      addressLine2, 
      city, 
      state, 
      pinCode, 
      pincode 
    } = req.body;

    const addressToSave = {
      customerId,
      name: name || `${firstName || ''} ${lastName || ''}`.trim() || 'Saved Address',
      phone: String(phone || ''),
      addressLine1: addressLine1 || address || '',
      addressLine2: addressLine2 || apartment || '',
      city: normalizeString(city || ''),
      state: normalizeString(state || ''),
      pincode: String(pincode || pinCode || ''),
    };

    // Duplicate check
    const existing = await prisma.address.findFirst({
      where: {
        customerId,
        addressLine1: { equals: addressToSave.addressLine1, mode: 'insensitive' },
        city: { equals: addressToSave.city, mode: 'insensitive' },
        pincode: addressToSave.pincode
      }
    });

    if (existing) {
      return res.status(200).json({ success: true, message: 'Address already saved.', address: existing });
    }

    const addressResult = await prisma.address.create({
      data: addressToSave
    });

    res.status(201).json({ success: true, address: addressResult });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const lookupPincode = async (req, res) => {
  try {
    const { pincode } = req.params;

    if (!pincode) {
      return res.status(400).json({ success: false, message: 'Pincode is required.' });
    }

    const result = await getPincodeDetails(pincode);
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: result.message 
      });
    }

    res.json({ 
      success: true, 
      data: result.data
    });
  } catch (error) {
    console.error('Pincode lookup error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during pincode lookup.' });
  }
};

export const lookupInternationalPostal = async (req, res) => {
  try {
    const { postal } = req.params;
    const countryCode = req.query?.country ? String(req.query.country) : null;

    const result = await getInternationalPostalDetails({ postalCode: postal, countryCode });
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('International postal lookup error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during postal lookup.' });
  }
};
