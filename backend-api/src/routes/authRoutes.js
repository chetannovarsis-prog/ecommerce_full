import express from 'express';
import { 
  login, 
  verifyOtp, 
  sendOtp,
  verifyMobileOtp,
  toggle2FA, 
  register,
  emailLogin,
  customerSignup, 
  verifyCustomerSignupOtp,
  customerLogin, 
  verifyCustomerLoginOtp,
  customerForgotPassword, 
  verifyCustomerForgotPasswordOtp,
  resetCustomerPassword,
  googleLogin,
  getAllCustomers,
  getCustomerProfile,
  updateCustomerAddresses,
  requestCustomerProfileUpdateOtp,
  verifyCustomerProfileUpdateOtp
} from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', (req, res) => {
  // Dispatch: if `mobile` exists, treat this as mobile OTP verification.
  if (req.body?.mobile) {
    return verifyMobileOtp(req, res);
  }
  return verifyOtp(req, res);
});
router.post('/toggle-2fa', toggle2FA);

// Email wrappers (new endpoints)
router.post('/email-login', emailLogin);
router.post('/register', register);

// Customer Routes
router.post('/customer/signup', customerSignup);
router.post('/customer/signup/verify-otp', verifyCustomerSignupOtp);
router.post('/customer/login', customerLogin);
router.post('/customer/login/verify-otp', verifyCustomerLoginOtp);
router.post('/customer/forgot-password', customerForgotPassword);
router.post('/customer/forgot-password/verify-otp', verifyCustomerForgotPasswordOtp);
router.post('/customer/reset-password', resetCustomerPassword);
router.post('/customer/google-login', googleLogin);
router.get('/customer/:customerId/profile', getCustomerProfile);
router.post('/customer/:customerId/profile/request-update', requestCustomerProfileUpdateOtp);
router.post('/customer/:customerId/profile/verify-update', verifyCustomerProfileUpdateOtp);
router.put('/customer/:customerId/addresses', updateCustomerAddresses);
router.get('/customers', getAllCustomers);

export default router;
