import { io, Socket } from 'socket.io-client';

// An empty VITE_WS_URL means "same origin" (the nginx image proxies /socket.io to the API).
const WS_URL: string = import.meta.env.VITE_WS_URL ?? 'http://localhost:5000';

let socket: Socket | null = null;

export const initializeSocket = (token: string): Socket => {
    if (socket) {
        return socket;
    }

    socket = io(WS_URL || undefined, {
        auth: {
            token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });

    return socket;
};

export const getSocket = (): Socket | null => {
    return socket;
};

export const disconnectSocket = (): void => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export default socket;
