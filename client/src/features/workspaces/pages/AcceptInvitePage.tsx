import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from '../../../lib/axios';
import { showToast } from '../../../utils';

const AcceptInvitePage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    // Invites are single use; guard against the StrictMode double effect.
    const requested = useRef(false);

    useEffect(() => {
        if (requested.current) return;
        requested.current = true;

        axios
            .post(`/workspaces/accept-invite/${token}`)
            .then(() => {
                showToast.success('You joined the workspace');
                navigate('/workspaces', { replace: true });
            })
            .catch((err) => setError(err?.response?.data?.message || 'This invitation is invalid or has expired.'));
    }, [token, navigate]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            {error ? (
                <div className="max-w-md text-center space-y-4">
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                    <Link to="/workspaces" className="font-medium text-primary-600 hover:text-primary-500">
                        Go to your workspaces
                    </Link>
                </div>
            ) : (
                <p className="text-gray-600">Joining workspace...</p>
            )}
        </div>
    );
};

export default AcceptInvitePage;
