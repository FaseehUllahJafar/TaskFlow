import React, { useEffect, useState } from 'react';
import axios from '../../../lib/axios';
import Modal from '../../../components/Modal';
import { showToast } from '../../../utils';

interface ClientLinkModalProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
}

const ClientLinkModal: React.FC<ClientLinkModalProps> = ({ projectId, isOpen, onClose }) => {
    const [token, setToken] = useState<string | null>(null);
    const [isBusy, setIsBusy] = useState(false);

    // Does the project already have a link? The project payload carries its token for admins.
    useEffect(() => {
        if (!isOpen) return;
        axios
            .get(`/projects/${projectId}`)
            .then((response) => setToken(response.data.data.clientToken ?? null))
            .catch(() => setToken(null));
    }, [isOpen, projectId]);

    const url = token ? `${window.location.origin}/portal/${token}` : null;

    const errorMessage = (err: unknown, fallback: string) =>
        (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;

    const generate = async () => {
        setIsBusy(true);
        try {
            const response = await axios.post(`/projects/${projectId}/generate-client-link`);
            setToken(response.data.data.clientToken);
        } catch (err) {
            showToast.error(errorMessage(err, 'Could not create the link'));
        } finally {
            setIsBusy(false);
        }
    };

    const revoke = async () => {
        setIsBusy(true);
        try {
            await axios.delete(`/projects/${projectId}/client-link`);
            setToken(null);
        } catch (err) {
            showToast.error(errorMessage(err, 'Could not revoke the link'));
        } finally {
            setIsBusy(false);
        }
    };

    const copy = async () => {
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            showToast.success('Link copied');
        } catch {
            showToast.error('Copy failed, select the link and copy it manually');
        }
    };

    return (
        <Modal isOpen={isOpen} title="Client link" onClose={onClose}>
            <p className="text-sm text-gray-600 mb-4">
                Anyone with this link can view the project board without an account. It is read only.
            </p>
            {url ? (
                <div className="space-y-3">
                    <input readOnly value={url} onFocus={(e) => e.target.select()} className="input-base text-sm" />
                    <div className="flex gap-2">
                        <button onClick={copy} className="btn-primary">
                            Copy link
                        </button>
                        <button onClick={revoke} disabled={isBusy} className="btn-secondary disabled:opacity-50">
                            Revoke
                        </button>
                    </div>
                </div>
            ) : (
                <button onClick={generate} disabled={isBusy} className="btn-primary disabled:opacity-50">
                    {isBusy ? 'Creating...' : 'Create link'}
                </button>
            )}
        </Modal>
    );
};

export default ClientLinkModal;
