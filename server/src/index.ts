import http from 'http';
import { Server } from 'socket.io';
import { env } from './config/env';
import app from './app';
import { pool } from './config/db';
import redisClient, { connectRedis } from './config/redis';
import { initializeSocket } from './socket';
import { setIo } from './socket/realtime';
import logger from './utils/logger';

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: env.CORS_ORIGIN.split(','),
        credentials: true,
    },
});

initializeSocket(io);
setIo(io);

const startServer = async () => {
    try {
        await connectRedis();

        server.listen(env.PORT, () => {
            logger.info(`Server running on port ${env.PORT}`);
            logger.info(`Environment: ${env.NODE_ENV}`);
        });
    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
};

void startServer();

let shuttingDown = false;

const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received, shutting down`);

    // Hard stop if connections refuse to drain.
    setTimeout(() => process.exit(1), 10_000).unref();

    io.close(() => {
        server.close(async () => {
            try {
                await pool.end();
                if (redisClient.isOpen) await redisClient.quit();
            } catch (error) {
                logger.error('Error during shutdown', error);
            }
            process.exit(0);
        });
    });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection', reason));

export { io };
