import React, { useState } from 'react';
import axios from '../../../lib/axios';
import Modal from '../../../components/Modal';
import { useAppDispatch } from '../../../hooks';
import { getBoardColumns } from '../boardSlice';

const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'] as const;

interface CreateTaskModalProps {
    projectId: string;
    columnId: string | null;
    onClose: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ projectId, columnId, onClose }) => {
    const dispatch = useAppDispatch();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('none');
    const [dueDate, setDueDate] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!columnId) return;
        if (!title.trim()) {
            setError('Give the task a title');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            await axios.post(`/tasks/columns/${columnId}`, {
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                dueDate: dueDate || undefined,
            });
            await dispatch(getBoardColumns(projectId));
            setTitle('');
            setDescription('');
            setPriority('none');
            setDueDate('');
            onClose();
        } catch (err) {
            const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
            setError(message || 'Could not create the task');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={columnId !== null} title="New task" onClose={onClose}>
            <form onSubmit={onSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                <div>
                    <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                    </label>
                    <input
                        id="task-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input-base"
                        autoFocus
                    />
                </div>
                <div>
                    <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description (optional)
                    </label>
                    <textarea
                        id="task-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input-base"
                        rows={3}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 mb-1">
                            Priority
                        </label>
                        <select
                            id="task-priority"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as (typeof PRIORITIES)[number])}
                            className="input-base"
                        >
                            {PRIORITIES.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="task-due" className="block text-sm font-medium text-gray-700 mb-1">
                            Due date
                        </label>
                        <input
                            id="task-due"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="input-base"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-50">
                        {isSubmitting ? 'Adding...' : 'Add task'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateTaskModal;
