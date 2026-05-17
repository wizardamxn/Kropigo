import { Router, type Router as ExpressRouter } from 'express';
import { getCrops } from '../controllers/crop.controller';

const router: ExpressRouter = Router();

router.get('/', getCrops);

export default router;
