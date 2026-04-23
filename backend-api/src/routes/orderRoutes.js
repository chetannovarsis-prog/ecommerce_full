import express from 'express';
import { getOrders, updateOrderStatus, getOrderById, getCustomerOrders } from '../controllers/orderController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireCustomerOrAdmin } from '../middleware/requireCustomerOrAdmin.js';

const router = express.Router();

router.get('/', requireAdmin, getOrders);
router.get('/customer/:customerId', requireAuth, getCustomerOrders);
router.get('/:id', requireCustomerOrAdmin, getOrderById);
router.put('/:id', requireAdmin, updateOrderStatus);

export default router;
