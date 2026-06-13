import { Router, type Router as ExpressRouter } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { setVerificationSchema } from '../validators/admin.validator';
import { getKisans, setKisanVerification } from '../controllers/admin.controller';

const router: ExpressRouter = Router();

// All admin routes require auth + admin role.
router.use(authenticate, requireRole('admin'));

router.get('/kisans', getKisans);
router.patch('/kisans/:id/verify', validate(setVerificationSchema), setKisanVerification);

export default router;
