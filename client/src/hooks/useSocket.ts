import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './index';
import { initializeSocket } from '../lib/socket';
import { getBoardColumns } from '../features/board/boardSlice';
import { getTaskById } from '../features/tasks/taskSlice';

const BOARD_EVENTS = [
    'board:task-created',
    'board:task-updated',
    'board:task-deleted',
    'board:column-created',
    'board:column-updated',
    'board:column-deleted',
] as const;

const TASK_EVENTS = ['task:comment-added', 'task:attachment-added', 'task:assignee-added', 'task:updated'] as const;

/** Keeps the board in sync: any change published for the project triggers a refetch. */
export const useSocketBoard = (projectId?: string) => {
    const dispatch = useAppDispatch();
    const accessToken = useAppSelector((state) => state.auth.accessToken);

    useEffect(() => {
        if (!accessToken || !projectId) return;

        const socket = initializeSocket(accessToken);
        const refresh = () => {
            void dispatch(getBoardColumns(projectId));
        };

        socket.emit('join:project', projectId);
        BOARD_EVENTS.forEach((event) => socket.on(event, refresh));

        return () => {
            BOARD_EVENTS.forEach((event) => socket.off(event, refresh));
            socket.emit('leave:project', projectId);
        };
    }, [projectId, accessToken, dispatch]);
};

/** Reloads the open task when someone else comments, assigns or edits it. */
export const useSocketTask = (taskId?: string) => {
    const dispatch = useAppDispatch();
    const accessToken = useAppSelector((state) => state.auth.accessToken);

    useEffect(() => {
        if (!accessToken || !taskId) return;

        const socket = initializeSocket(accessToken);
        const refresh = () => {
            void dispatch(getTaskById(taskId));
        };

        socket.emit('join:task', taskId);
        TASK_EVENTS.forEach((event) => socket.on(event, refresh));

        return () => {
            TASK_EVENTS.forEach((event) => socket.off(event, refresh));
            socket.emit('leave:task', taskId);
        };
    }, [taskId, accessToken, dispatch]);
};

/** Calls `onNotification` whenever the server pushes a notification to the current user. */
export const useSocketNotifications = (onNotification: () => void) => {
    const accessToken = useAppSelector((state) => state.auth.accessToken);

    useEffect(() => {
        if (!accessToken) return;

        // The server puts every authenticated socket in its own user room, so no join is needed.
        const socket = initializeSocket(accessToken);
        socket.on('notification:new', onNotification);

        return () => {
            socket.off('notification:new', onNotification);
        };
    }, [accessToken, onNotification]);
};
