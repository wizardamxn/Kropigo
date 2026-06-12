import { Router, type Router as ExpressRouter } from 'express';
import { deleteUploadedMedia, getCloudinarySignature } from '../controllers/media.controller';
import { authenticate } from '../middleware/authMiddleware';

const router: ExpressRouter = Router();

// Any authenticated user may upload (kisan KYC/listing media, buyer profile photo).
router.get('/signature', authenticate, getCloudinarySignature);
router.post('/cleanup', authenticate, deleteUploadedMedia);

export default router;
