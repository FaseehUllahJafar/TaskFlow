import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/authenticate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { getDashboard } from './dashboard.service';

const router = Router();

router.use(authenticate);

router.get(
    '/',
    asyncHandler(async (req: AuthRequest, res) => {
        const data = await getDashboard(req.user!.id);
        res.status(200).json({ success: true, data });
    })
);

export default router;
