import { Router } from "express";
import { sendOtp, verifyOtp } from "../controllers/otpController";
import { otpLimiter } from "../middleware/rateLimiter";

const router: Router = Router();

router.post("/send", otpLimiter, sendOtp);
router.post("/verify", otpLimiter, verifyOtp);

export default router;
