import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
} from '../controllers/order.controller';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { updateOrderStatusSchema } from '../validators/order.validator';

const router: Router = Router();

// Apply auth middleware to all order routes
router.use(authenticate);

// GET /api/v1/orders
router.get('/', getOrders);

// GET /api/v1/orders/:id
router.get('/:id', getOrderById);

// PATCH /api/v1/orders/:id/status — admin only
router.patch(
  '/:id/status',
  requireRole('admin'),
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

export default router;

