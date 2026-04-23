import express from 'express';
import { createRazorpayOrder, verifyPayment, cancelPayment, getPaymentConfig } from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.get('/config', getPaymentConfig);
router.post('/create', requireAuth, createRazorpayOrder);
router.post('/verify', requireAuth, verifyPayment);
router.post('/cancel', requireAuth, cancelPayment);

export default router;
