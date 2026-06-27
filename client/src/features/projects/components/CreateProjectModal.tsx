import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../../components/Modal';
import { useAppDispatch } from '../../../hooks';
import { createProject } from '../projectsSlice';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

interface CreateProjectModalProps {
    workspaceId: string;
    isOpen: boolean;
    onClose: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ workspaceId, isOpen, onClose }) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState(COLORS[0]);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (name.trim().length < 2) {
            setError('Project name must be at least 2 characters');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        const result = await dispatch(
            createProject({ workspaceId, name: name.trim(), description: description.trim() || undefined, color })
        );
        setIsSubmitting(false);

        if (createProject.fulfilled.match(result)) {
            setName('');
            setDescription('');
            onClose();
            navigate(`/projects/${result.payload.id}`);
        } else {
            setError(result.error.message || 'Could not create the project');
        }
    };

    return (
        <Modal isOpen={isOpen} title="New project" onClose={onClose}>
            <form onSubmit={onSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                <div>
                    <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                    </label>
                    <input
                        id="project-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-base"
                        placeholder="Website redesign"
                        autoFocus
                    />
                </div>
                <div>
                    <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description (optional)
                    </label>
                    <textarea
                        id="project-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input-base"
                        rows={3}
                    />
                </div>
                <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">Color</span>
                    <div className="flex gap-2">
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                aria-label={`Color ${c}`}
                                className={`h-8 w-8 rounded-full border-2 ${color === c ? 'border-gray-900' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-50">
                        {isSubmitting ? 'Creating...' : 'Create project'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateProjectModal;
