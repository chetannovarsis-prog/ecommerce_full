import express from 'express';
import { 
  login, 
  verifyOtp, 
  toggle2FA, 
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
  updateCustomerAddresses
} from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/toggle-2fa', toggle2FA);

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
router.put('/customer/:customerId/addresses', updateCustomerAddresses);
router.get('/customers', getAllCustomers);

export default router;
