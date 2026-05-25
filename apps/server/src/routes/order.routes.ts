import { Router } from 'express';
import { getOrders, getOrderById } from '../controllers/order.controller';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all order routes
router.use(authenticate);

// GET /api/v1/orders
router.get('/', getOrders);

// GET /api/v1/orders/:id
router.get('/:id', getOrderById);

export default router;
