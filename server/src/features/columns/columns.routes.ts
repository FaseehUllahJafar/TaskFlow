import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, AuthRequest } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { broadcastToProject } from '../../socket/realtime';
import {
    createColumn,
    getProjectColumns,
    updateColumn,
    deleteColumn,
    reorderColumns,
} from './columns.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create column
router.post(
    '/projects/:projectId',
    param('projectId').isUUID(),
    body('name').trim().isLength({ min: 2 }),
    body('color').optional().isHexColor(),
    validate,
    asyncHandler(async (req: AuthRequest, res) => {
        const column = await createColumn(req.params.projectId, req.user!.id, req.body);
        broadcastToProject(req.params.projectId, 'board:column-created', { columnId: column.id });
        res.status(201).json({
            success: true,
            message: 'Column created successfully',
            data: column,
        });
    })
);

// Get columns with tasks
router.get(
    '/projects/:projectId',
    param('projectId').isUUID(),
    validate,
    asyncHandler(async (req: AuthRequest, res) => {
        const columns = await getProjectColumns(req.params.projectId, req.user!.id);
        res.status(200).json({
            success: true,
            data: columns,
        });
    })
);

// Reorder columns
router.patch(
    '/projects/:projectId/reorder',
    param('projectId').isUUID(),
    body('columns').isArray(),
    validate,
    asyncHandler(async (req: AuthRequest, res) => {
        await reorderColumns(req.params.projectId, req.user!.id, req.body.columns);
        broadcastToProject(req.params.projectId, 'board:column-updated', {});
        res.status(200).json({
            success: true,
            message: 'Columns reordered successfully',
        });
    })
);

// Column-specific routes
router.use('/:id', param('id').isUUID(), validate);

// Update column
router.patch(
    '/:id',
    body('name').optional().trim().isLength({ min: 2 }),
    body('color').optional().isHexColor(),
    validate,
    asyncHandler(async (req: AuthRequest, res) => {
        const column = await updateColumn(req.params.id, req.user!.id, req.body);
        broadcastToProject(column.projectId, 'board:column-updated', { columnId: column.id });
        res.status(200).json({
            success: true,
            message: 'Column updated successfully',
            data: column,
        });
    })
);

// Delete column
router.delete(
    '/:id',
    asyncHandler(async (req: AuthRequest, res) => {
        const { projectId } = await deleteColumn(req.params.id, req.user!.id);
        broadcastToProject(projectId, 'board:column-deleted', { columnId: req.params.id });
        res.status(200).json({
            success: true,
            message: 'Column deleted successfully',
        });
    })
);

export default router;
