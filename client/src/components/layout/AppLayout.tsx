import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { logout } from '../../features/auth/authSlice';
import NotificationBell from '../../features/notifications/components/NotificationBell';
import { LogOut, Menu, X } from 'lucide-react';

const AppLayout: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block fixed md:relative w-64 bg-white shadow-lg transition-all duration-300 h-full z-50`}>
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-primary-600">TaskFlow</h2>
                </div>

                <nav className="mt-8 px-4 space-y-2">
                    <Link to="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 rounded-lg transition-colors">
                        Dashboard
                    </Link>
                    <Link to="/workspaces" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 rounded-lg transition-colors">
                        Workspaces
                    </Link>
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                                {user?.fullName?.[0] || 'U'}
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-gray-900">{user?.fullName || 'User'}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between md:justify-end">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden">
                        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AppLayout;
