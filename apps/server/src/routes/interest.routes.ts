import { Router, type Router as ExpressRouter } from 'express';
import { getMyInterests } from '../controllers/interest.controller';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router: ExpressRouter = Router();

// Buyer: Get all interests submitted by the logged-in buyer
router.get('/my', authenticate, requireRole('buyer'), getMyInterests);

export default router;
