import express from 'express';
import { createRazorpayOrder, verifyPayment, cancelPayment, getPaymentConfig, confirmCODPayment } from '../controllers/paymentController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/config', getPaymentConfig);
router.post('/create', createRazorpayOrder);
router.post('/verify', verifyPayment);
router.post('/cancel', cancelPayment);
router.post('/confirm-cod', requireAdmin, confirmCODPayment);

export default router;
