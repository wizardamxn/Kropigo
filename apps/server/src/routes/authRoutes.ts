import { Router } from 'express';
import { register, login, me, logout } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router: Router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
