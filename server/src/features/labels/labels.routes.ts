import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, AuthRequest } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { validateBody } from '../../middleware/validateBody';
import { asyncHandler } from '../../middleware/asyncHandler';
import { createLabelSchema } from './labels.schema';
import { createLabel, getWorkspaceLabels } from './labels.service';

const router = Router();

router.use(authenticate);

router.get(
    '/workspaces/:workspaceId',
    param('workspaceId').isUUID(),
    validate,
    asyncHandler(async (req: AuthRequest, res) => {
        const data = await getWorkspaceLabels(req.params.workspaceId, req.user!.id);
        res.status(200).json({ success: true, data });
    })
);

router.post(
    '/workspaces/:workspaceId',
    param('workspaceId').isUUID(),
    validateBody(createLabelSchema),
    validate,
    asyncHandler(async (req: AuthRequest, res) => {
        const data = await createLabel(req.params.workspaceId, req.user!.id, req.body);
        res.status(201).json({ success: true, message: 'Label created', data });
    })
);

export default router;
