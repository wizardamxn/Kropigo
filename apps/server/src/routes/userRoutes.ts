import { Router } from 'express';
import { updateProfile } from '../controllers/userController';
import { authenticate } from '../middleware/authMiddleware';

const router: Router = Router();

// All user routes require authentication
router.use(authenticate);

router.post('/profile', updateProfile);

export default router;
