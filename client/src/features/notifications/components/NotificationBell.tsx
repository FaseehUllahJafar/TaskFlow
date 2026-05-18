import React, { useCallback, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import axios from '../../../lib/axios';
import { useSocketNotifications } from '../../../hooks';
import { formatRelativeTime } from '../../../utils';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    link?: string | null;
    isRead: boolean;
    createdAt: string;
}

const NotificationBell: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<NotificationItem[]>([]);

    const load = useCallback(async () => {
        try {
            const response = await axios.get('/notifications');
            setItems(response.data.data);
        } catch {
            // The bell is non-critical; keep the last known list if the request fails.
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    useSocketNotifications(load);

    const unreadCount = items.filter((item) => !item.isRead).length;

    const markRead = async (item: NotificationItem) => {
        if (item.isRead) return;
        setItems((current) => current.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
        try {
            await axios.patch(`/notifications/${item.id}/read`);
        } catch {
            void load();
        }
    };

    const markAllRead = async () => {
        setItems((current) => current.map((n) => ({ ...n, isRead: true })));
        try {
            await axios.patch('/notifications/read-all');
        } catch {
            void load();
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-500"
                aria-label="Notifications"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-20 border max-h-96 overflow-y-auto">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="text-sm text-primary-600 hover:text-primary-700"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="divide-y">
                            {items.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => markRead(notification)}
                                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                                        !notification.isRead ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                {formatRelativeTime(notification.createdAt)}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {items.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p>No notifications</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
