import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { sql } from 'drizzle-orm';
import { env } from './config/env';
import { db } from './config/db';
import redisClient from './config/redis';
import passport, { googleAuthEnabled } from './config/passport';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import AppError from './utils/AppError';
import authRoutes from './features/auth/auth.routes';
import googleRoutes from './features/auth/google.routes';
import workspaceRoutes from './features/workspaces/workspaces.routes';
import projectRoutes from './features/projects/projects.routes';
import columnRoutes from './features/columns/columns.routes';
import taskRoutes from './features/tasks/tasks.routes';
import commentRoutes from './features/comments/comments.routes';
import attachmentRoutes from './features/attachments/attachments.routes';
import notificationRoutes from './features/notifications/notifications.routes';
import dashboardRoutes from './features/dashboard/dashboard.routes';
import labelRoutes from './features/labels/labels.routes';

const app = express();

if (env.NODE_ENV === 'production') {
    // Running behind a reverse proxy: needed for correct client IPs in rate limiting.
    app.set('trust proxy', 1);
}

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(','), credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(passport.initialize());

app.get('/health', async (_req: Request, res: Response) => {
    const checks = { database: false, redis: false };
    try {
        await db.execute(sql`select 1`);
        checks.database = true;
    } catch {
        // reported below
    }
    try {
        checks.redis = redisClient.isReady && (await redisClient.ping()) === 'PONG';
    } catch {
        // reported below
    }
    const healthy = checks.database && checks.redis;
    res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', checks });
});

const api = express.Router();
api.use(rateLimiter);
api.use('/auth', authRoutes);
if (googleAuthEnabled) {
    api.use('/auth', googleRoutes);
}
api.use('/workspaces', workspaceRoutes);
api.use('/projects', projectRoutes);
api.use('/columns', columnRoutes);
api.use('/tasks', taskRoutes);
api.use('/comments', commentRoutes);
api.use('/attachments', attachmentRoutes);
api.use('/notifications', notificationRoutes);
api.use('/dashboard', dashboardRoutes);
api.use('/labels', labelRoutes);
app.use('/api/v1', api);

app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError('Route not found', 404));
});

app.use(errorHandler);

export default app;
