import { Router } from 'express';
import { getLaunchStatus, triggerLaunch, resetLaunch } from '../controllers/launch.controller';

const router = Router();

router.get('/launch-status', getLaunchStatus);
router.post('/launch', triggerLaunch);
router.delete('/launch', resetLaunch);

export default router;
