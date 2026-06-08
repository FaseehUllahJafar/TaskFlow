import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from '../../../lib/axios';
import AuthCard from '../components/AuthCard';

type Status = 'pending' | 'success' | 'error';

const VerifyEmail: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [status, setStatus] = useState<Status>('pending');
    const [message, setMessage] = useState('');
    // The token is single use, so a double effect run (React StrictMode) must not call twice.
    const requested = useRef(false);

    useEffect(() => {
        if (requested.current) return;
        requested.current = true;

        axios
            .get(`/auth/verify-email/${token}`)
            .then(() => setStatus('success'))
            .catch((err) => {
                setStatus('error');
                setMessage(err?.response?.data?.message || 'This verification link is invalid or was already used.');
            });
    }, [token]);

    return (
        <AuthCard title="Email verification">
            {status === 'pending' && <p className="text-center text-gray-600">Verifying your email...</p>}
            {status === 'success' && (
                <div className="space-y-4 text-center">
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                        Your email is verified. You can sign in now.
                    </div>
                    <Link to="/login" className="btn-primary inline-block">
                        Go to sign in
                    </Link>
                </div>
            )}
            {status === 'error' && (
                <div className="space-y-4 text-center">
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                        {message}
                    </div>
                    <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                        Back to sign in
                    </Link>
                </div>
            )}
        </AuthCard>
    );
};

export default VerifyEmail;
