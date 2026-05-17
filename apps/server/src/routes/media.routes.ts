import { Router, type Router as ExpressRouter } from 'express';
import { deleteUploadedMedia, getCloudinarySignature } from '../controllers/media.controller';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router: ExpressRouter = Router();

router.get('/signature', authenticate, requireRole('kisan'), getCloudinarySignature);
router.post('/cleanup', authenticate, requireRole('kisan'), deleteUploadedMedia);

export default router;
