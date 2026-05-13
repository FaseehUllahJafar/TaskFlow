import type { Server } from 'socket.io';

let io: Server | null = null;

/** Registered once at startup so services and routes can publish events without importing the HTTP server. */
export const setIo = (server: Server): void => {
    io = server;
};

export const broadcast = (room: string, event: string, data?: unknown): void => {
    io?.to(room).emit(event, data);
};

export const broadcastToProject = (projectId: string, event: string, data?: unknown): void =>
    broadcast(`project:${projectId}`, event, data);

export const broadcastToTask = (taskId: string, event: string, data?: unknown): void =>
    broadcast(`task:${taskId}`, event, data);

export const broadcastToUser = (userId: string, event: string, data?: unknown): void =>
    broadcast(`user:${userId}`, event, data);
