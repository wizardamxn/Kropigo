import { Router } from 'express';
import { register, login, refresh, logout /*, sendOtp, verifyOtp, otpLimiter, msg91Webhook*/ } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router: Router = Router();

router.post('/register', register);
router.post('/login', login);

/*
router.post('/send-otp', otpLimiter, sendOtp);
router.post('/verify-otp', verifyOtp);
*/

router.post('/refresh', refresh);
router.post('/logout', logout); // Optionally add authenticate middleware if you strictly want only logged-in users to hit logout

/*
// MSG91 Webhook (Accepts both GET and POST)
router.get('/', msg91Webhook);
router.post('/', msg91Webhook);
*/

// Example of protected route (can be moved later)
router.get('/me', authenticate, (req, res) => {
    res.json({ success: true, data: (req as any).user });
});

export default router;
