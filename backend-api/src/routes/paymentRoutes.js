import express from 'express';
import { createRazorpayOrder, verifyPayment, cancelPayment, getPaymentConfig, confirmCODPayment } from '../controllers/paymentController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.get('/config', getPaymentConfig);
router.post('/create', requireAuth, createRazorpayOrder);
router.post('/verify', requireAuth, verifyPayment);
router.post('/cancel', requireAuth, cancelPayment);
router.post('/confirm-cod', requireAdmin, confirmCODPayment);

export default router;
