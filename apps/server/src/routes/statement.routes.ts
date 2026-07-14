import { Router } from 'express';
import { getMyStatements, getStatementSummary } from '../controllers/statement.controller';
import { authenticate } from '../middleware/authMiddleware';

const router: Router = Router();

router.use(authenticate);

// GET /api/v1/statements — caller's own day-wise statements (admins may pass ?sellerId=)
router.get('/', getMyStatements);

// GET /api/v1/statements/summary — per-crop rollup for the printable statement
router.get('/summary', getStatementSummary);

export default router;
