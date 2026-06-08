import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../../lib/axios';
import AuthCard from '../components/AuthCard';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await axios.post('/auth/forgot-password', { email });
            setSent(true);
        } catch (err) {
            const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
            setError(message || 'Could not send the reset email. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthCard
            title="Reset your password"
            subtitle={
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                    Back to sign in
                </Link>
            }
        >
            {sent ? (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    If an account exists for {email}, a reset link is on its way. The link expires in one hour.
                </div>
            ) : (
                <form className="mt-8 space-y-6" onSubmit={onSubmit}>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-base"
                            placeholder="you@example.com"
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-50">
                        {isLoading ? 'Sending...' : 'Send reset link'}
                    </button>
                </form>
            )}
        </AuthCard>
    );
};

export default ForgotPassword;
