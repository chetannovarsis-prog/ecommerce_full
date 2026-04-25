import express from 'express';
import { 
  getOrders, 
  updateOrderStatus, 
  getOrderById, 
  getCustomerOrders, 
  cancelOrder,
  createReturnRequest,
  getReturnRequest,
  getReturnRequests,
  approveReturnRequest,
  rejectReturnRequest
} from '../controllers/orderController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireCustomerOrAdmin } from '../middleware/requireCustomerOrAdmin.js';

const router = express.Router();

router.get('/', requireAdmin, getOrders);
router.get('/customer/:customerId', requireAuth, getCustomerOrders);
router.get('/:id', getOrderById);
router.put('/:id', requireAdmin, updateOrderStatus);
router.post('/:id/cancel', requireAdmin, cancelOrder);

// Return request routes
router.post('/:orderId/return', requireAuth, createReturnRequest);
router.get('/:orderId/return', getReturnRequest);
router.get('/admin/returns/all', requireAdmin, getReturnRequests);
router.put('/admin/returns/:returnId/approve', requireAdmin, approveReturnRequest);
router.put('/admin/returns/:returnId/reject', requireAdmin, rejectReturnRequest);

export default router;
