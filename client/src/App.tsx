import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from './hooks';
import { fetchCurrentUser } from './features/auth/authSlice';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import ForgotPassword from './features/auth/pages/ForgotPassword';
import ResetPassword from './features/auth/pages/ResetPassword';
import VerifyEmail from './features/auth/pages/VerifyEmail';
import AcceptInvitePage from './features/workspaces/pages/AcceptInvitePage';
import AppLayout from './components/layout/AppLayout';
import WorkspacesPage from './features/workspaces/pages/WorkspacesPage';
import ProjectBoardPage from './features/board/pages/ProjectBoardPage';
import Dashboard from './features/dashboard/pages/Dashboard';
import ClientPortalPage from './features/client-portal/pages/ClientPortalPage';

// Auth callback handler for OAuth
const AuthCallback = () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        window.location.href = '/dashboard';
    }

    return <div>Processing authentication...</div>;
};

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const location = useLocation();

    if (!isAuthenticated) {
        // Remember where the user was headed (e.g. an invite link) so login can return there.
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <>{children}</>;
};

function App() {
    const dispatch = useAppDispatch();
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);

    // Restore the profile after a reload; the axios interceptor refreshes an expired token.
    useEffect(() => {
        if (isAuthenticated && !user) {
            void dispatch(fetchCurrentUser());
        }
    }, [dispatch, isAuthenticated, user]);

    return (
        <ErrorBoundary>
            <Toaster position="top-right" />
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/verify-email/:token" element={<VerifyEmail />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Client Portal (public, no auth required) */}
                <Route path="/portal/:clientToken" element={<ClientPortalPage />} />

                {/* Protected routes with layout */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Dashboard />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="workspaces" element={<WorkspacesPage />} />
                    <Route path="workspaces/new" element={<WorkspacesPage />} />
                    <Route path="accept-invite/:token" element={<AcceptInvitePage />} />
                    <Route path="projects/:projectId" element={<ProjectBoardPage />} />
                </Route>

                {/* 404 route */}
                <Route path="*" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-bold">404 - Not Found</h1></div>} />
            </Routes>
        </ErrorBoundary>
    );
}

export default App;
