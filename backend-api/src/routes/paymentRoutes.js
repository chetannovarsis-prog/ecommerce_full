import express from 'express';
import { createRazorpayOrder, verifyPayment, cancelPayment, getPaymentConfig } from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.get('/config', getPaymentConfig);
router.post('/create', createRazorpayOrder);
router.post('/verify', verifyPayment);
router.post('/cancel', cancelPayment);

export default router;
