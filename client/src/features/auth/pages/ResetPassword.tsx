import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from '../../../lib/axios';
import { showToast } from '../../../utils';
import AuthCard from '../components/AuthCard';

const ResetPassword: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await axios.post(`/auth/reset-password/${token}`, { password });
            showToast.success('Password updated. Sign in with your new password.');
            navigate('/login');
        } catch (err) {
            const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
            setError(message || 'This reset link is invalid or has expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthCard
            title="Choose a new password"
            subtitle={
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                    Back to sign in
                </Link>
            }
        >
            <form className="mt-8 space-y-6" onSubmit={onSubmit}>
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            New password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-base"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm password
                        </label>
                        <input
                            id="confirm"
                            type="password"
                            required
                            autoComplete="new-password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="input-base"
                        />
                    </div>
                </div>
                <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-50">
                    {isLoading ? 'Saving...' : 'Update password'}
                </button>
            </form>
        </AuthCard>
    );
};

export default ResetPassword;
