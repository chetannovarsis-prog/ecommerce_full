import prisma from '../utils/prisma.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import { sendMail, TEMPLATES } from '../utils/mailer.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const CUSTOMER_OTP_TTL_MINUTES = 10;

const sanitizeAddresses = (addresses) => {
  if (!Array.isArray(addresses)) return [];

  return addresses.map((addr) => ({
    id: addr.id,
    label: addr.label || 'Saved Address',
    firstName: addr.name?.split(' ')[0] || '',
    lastName: addr.name?.split(' ').slice(1).join(' ') || '',
    name: addr.name,
    address: addr.addressLine1, // For frontend compatibility if needed
    addressLine1: addr.addressLine1,
    addressLine2: addr.addressLine2,
    city: addr.city,
    state: addr.state,
    pinCode: addr.pincode,
    pincode: addr.pincode,
    phone: addr.phone,
  }));
};

const serializeCustomer = (customer) => ({
  id: customer.id,
  name: customer.name,
  email: customer.email,
  addresses: sanitizeAddresses(customer.addresses || [])
});

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const signActionToken = (payload, expiresIn = `${CUSTOMER_OTP_TTL_MINUTES}m`) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn });

const verifyActionToken = (token, expectedPurpose) => {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (decoded.purpose !== expectedPurpose) {
    throw new Error('Invalid token purpose');
  }

  return decoded;
};

const issueCustomerAuthToken = (customer) =>
  jwt.sign(
    { id: customer.id, email: customer.email, role: 'customer' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );


export const login = async (req, res) => {
  let { email, password } = req.body;
  if (email) email = email.trim();
  if (password) password = password.trim();

  // Allow both admin123 and Admin123 for easier entry
  if (password?.toLowerCase() !== 'admin123') {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  try {
    let admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      // Create admin on the fly if it doesn't exist (for easier migration)
      admin = await prisma.admin.create({
        data: { email, is2FAEnabled: true } // Default to 2FA enabled as per user request
      });
    }

    if (admin.is2FAEnabled) {
      // Generate 4-digit OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      await prisma.admin.update({
        where: { id: admin.id },
        data: { otp, otpExpires }
      });

      // Send Email using unified templates
      const emailSent = await sendMail(email, 'Your Admin OTP', TEMPLATES.LOGIN_OTP(otp));



      // If email sent successfully, we require the OTP step.
      if (emailSent) {
        return res.json({ 
          requires2FA: true,
          email: admin.email,
          message: 'OTP sent to your email'
        });
      }

      // If email sending fails (missing credentials / blocked by provider), fall back to issuing a token so the admin can still login.
      // This keeps the app usable in environments where email is not configured.
      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      return res.json({
        success: true,
        email: admin.email,
        token,
        warning: 'Failed to send OTP email; logging in without 2FA.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ 
      success: true, 
      email: admin.email,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin || !admin.otp || admin.otp !== otp || admin.otpExpires < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP after successful verification
    await prisma.admin.update({
      where: { id: admin.id },
      data: { otp: null, otpExpires: null }
    });

    // Generate JWT
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ 
      success: true, 
      email: admin.email,
      token
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggle2FA = async (req, res) => {
  const { email, enabled } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }
    await prisma.admin.update({
      where: { email },
      data: { is2FAEnabled: enabled }
    });
    res.json({ message: `2FA ${enabled ? 'enabled' : 'disabled'}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// --- Customer Authentication ---

export const customerSignup = async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password?.trim();
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const verificationToken = signActionToken({
      purpose: 'customer-signup',
      name,
      email,
      hashedPassword,
      otpHash: hashOtp(otp)
    });

    const emailSent = await sendMail(email, 'Welcome to Ghar of Ethnics', TEMPLATES.SIGNUP_OTP(otp));
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    res.status(200).json({
      success: true,
      requiresOtp: true,
      email,
      verificationToken,
      message: 'OTP sent to your email'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyCustomerSignupOtp = async (req, res) => {
  const { otp, verificationToken } = req.body;

  try {
    if (!otp || !verificationToken) {
      return res.status(400).json({ message: 'OTP and verification token are required' });
    }

    const payload = verifyActionToken(verificationToken, 'customer-signup');
    if (hashOtp(otp.trim()) !== payload.otpHash) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    const existing = await prisma.customer.findUnique({ where: { email: payload.email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const customer = await prisma.customer.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: payload.hashedPassword,
        provider: 'local'
      },
      include: { addresses: true }
    });

    const token = issueCustomerAuthToken(customer);

    res.status(201).json({
      success: true,
      customer: serializeCustomer(customer),
      token
    });
  } catch (error) {
    const status = error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError' ? 401 : 500;
    res.status(status).json({ message: status === 401 ? 'Invalid or expired OTP' : error.message });
  }
};

export const customerLogin = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password?.trim();
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const customer = await prisma.customer.findUnique({
      where: { email },
      include: { addresses: true }
    });
    if (!customer || !customer.password) {
       return res.status(401).json({ message: 'Invalid email or password' });
    }

    let isPasswordValid = false;
    const looksHashed = customer.password.startsWith('$2');

    if (looksHashed) {
      isPasswordValid = await bcrypt.compare(password, customer.password);
    } else {
      isPasswordValid = customer.password === password;
      if (isPasswordValid) {
        const upgradedPassword = await bcrypt.hash(password, 12);
        await prisma.customer.update({
          where: { id: customer.id },
          data: { password: upgradedPassword }
        });
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = issueCustomerAuthToken(customer);

    res.json({
      success: true,
      customer: serializeCustomer(customer),
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyCustomerLoginOtp = async (req, res) => {
  const { otp, verificationToken } = req.body;

  try {
    if (!otp || !verificationToken) {
      return res.status(400).json({ message: 'OTP and verification token are required' });
    }

    const payload = verifyActionToken(verificationToken, 'customer-login');
    if (hashOtp(otp.trim()) !== payload.otpHash) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: payload.customerId },
      include: { addresses: true }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const token = issueCustomerAuthToken(customer);

    res.json({
      success: true,
      customer: serializeCustomer(customer),
      token
    });
  } catch (error) {
    const status = error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError' ? 401 : 500;
    res.status(status).json({ message: status === 401 ? 'Invalid or expired OTP' : error.message });
  }
};

export const customerForgotPassword = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const otp = generateOtp();
    const verificationToken = signActionToken({
      purpose: 'customer-forgot-password',
      customerId: customer.id,
      email: customer.email,
      otpHash: hashOtp(otp)
    });

    const emailSent = await sendMail(email, 'Password Reset OTP', TEMPLATES.FORGOT_PASSWORD_OTP(otp));
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    res.json({
      success: true,
      email,
      verificationToken,
      message: 'Password reset OTP sent to email'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyCustomerForgotPasswordOtp = async (req, res) => {
  const { otp, verificationToken } = req.body;

  try {
    if (!otp || !verificationToken) {
      return res.status(400).json({ message: 'OTP and verification token are required' });
    }

    const payload = verifyActionToken(verificationToken, 'customer-forgot-password');
    if (hashOtp(otp.trim()) !== payload.otpHash) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    const resetToken = signActionToken({
      purpose: 'customer-forgot-password-verified',
      customerId: payload.customerId,
      email: payload.email
    });

    res.json({
      success: true,
      resetToken,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    const status = error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError' ? 401 : 500;
    res.status(status).json({ message: status === 401 ? 'Invalid or expired OTP' : error.message });
  }
};

export const resetCustomerPassword = async (req, res) => {
  const { resetToken, password, confirmPassword } = req.body;

  try {
    if (!resetToken || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Reset token, password, and confirm password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const payload = verifyActionToken(resetToken, 'customer-forgot-password-verified');
    const customer = await prisma.customer.findUnique({ where: { id: payload.customerId } });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 12);
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        password: hashedPassword,
        provider: 'local'
      }
    });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    const status = error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError' ? 401 : 500;
    res.status(status).json({ message: status === 401 ? 'Reset session expired. Please request OTP again.' : error.message });
  }
};

export const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Missing Google credential' });
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Missing GOOGLE_CLIENT_ID env var on server' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Google profile has no email' });
    }

    let customer = await prisma.customer.findUnique({ where: { email } });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          email,
          name: name || 'Google User',
          provider: 'google'
        },
        include: { addresses: true }
      });
    } else {
      // Ensure addresses are included for returning customer
      customer = await prisma.customer.findUnique({
        where: { id: customer.id },
        include: { addresses: true }
      });
    }

    const token = issueCustomerAuthToken(customer);

    return res.json({
      success: true,
      customer: serializeCustomer(customer),
      token
    });
  } catch (error) {
    console.error('Google Login Error:', error);
    const message = error?.message || 'Google login failed';
    return res.status(500).json({ error: `Google login failed: ${message}` });
  }
};

export const getCustomerProfile = async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.customerId },
      include: { addresses: true }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    return res.json({ success: true, customer: serializeCustomer(customer) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateCustomerAddresses = async (req, res) => {
  const { customerId } = req.params;
  const { addresses } = req.body;

  try {
    // We use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete all existing addresses for this customer
      await tx.address.deleteMany({
        where: { customerId }
      });

      // 2. Create new addresses
      if (Array.isArray(addresses) && addresses.length > 0) {
        const dataToCreate = addresses.map(addr => ({
          customerId,
          name: addr.name || `${addr.firstName || ''} ${addr.lastName || ''}`.trim() || 'Saved Address',
          phone: String(addr.phone || ''),
          addressLine1: addr.address || addr.addressLine1 || '',
          addressLine2: addr.apartment || addr.addressLine2 || '',
          city: addr.city || '',
          state: addr.state || '',
          pincode: String(addr.pinCode || addr.pincode || ''),
        }));

        await tx.address.createMany({
          data: dataToCreate
        });
      }

      // 3. Return updated customer with addresses
      return await tx.customer.findUnique({
        where: { id: customerId },
        include: { addresses: true }
      });
    });

    return res.json({
      success: true,
      customer: serializeCustomer(result),
      message: 'Addresses updated successfully'
    });
  } catch (error) {
    console.error('Update addresses error:', error);
    return res.status(500).json({ error: error.message });
  }
};
export const getAllCustomers = async (req, res) => {
  try {
    console.log('Fetching all customers...');
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        orders: {
          select: { id: true, totalAmount: true }
        }
      }
    });
    console.log(`Found ${customers.length} customers`);
    res.json(customers);
  } catch (error) {
    console.error('Error in getAllCustomers:', error);
    res.status(500).json({ error: error.message });
  }
};
