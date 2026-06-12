import { Router, type Router as ExpressRouter } from 'express';
import { getMandiRatesByCrop, createManualMandiRate } from '../controllers/mandiRate.controller';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { createMandiRateSchema } from '../validators/mandiRate.validator';

const router: ExpressRouter = Router();

// Public: Get rates for a crop
router.get('/:cropId', getMandiRatesByCrop);

// Admin only: Manually enter rates
router.post(
  '/',
  authenticate,
  requireRole('admin'),
  validate(createMandiRateSchema),
  createManualMandiRate
);

export default router;
