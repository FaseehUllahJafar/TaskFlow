import React, { useEffect, useState } from 'react';
import { X, Trash2, Paperclip, MessageSquare } from 'lucide-react';
import axios from '../../../lib/axios';
import { useAppDispatch, useAppSelector, useSocketTask } from '../../../hooks';
import { showToast } from '../../../utils';
import {
    getTaskById,
    updateTask,
    deleteTask,
    addComment,
    deleteComment,
    uploadAttachment,
    deleteAttachment,
    addAssignee,
    removeAssignee,
    addLabel,
    removeLabel,
    clearCurrentTask,
    PublicUser,
} from '../taskSlice';

interface Label {
    id: string;
    name: string;
    color: string;
}

interface TaskDetailModalProps {
    taskId: string;
    isOpen: boolean;
    workspaceId?: string;
    onClose: () => void;
}

const LABEL_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, isOpen, workspaceId, onClose }) => {
    const dispatch = useAppDispatch();
    const { currentTask, isLoading, isSavingComment, isUpdating } = useAppSelector((state) => state.task);
    const currentUserId = useAppSelector((state) => state.auth.user?.id);

    const [comment, setComment] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedDescription, setEditedDescription] = useState('');
    const [members, setMembers] = useState<PublicUser[]>([]);
    const [labels, setLabels] = useState<Label[]>([]);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

    useSocketTask(isOpen ? taskId : undefined);

    useEffect(() => {
        if (taskId && isOpen) {
            void dispatch(getTaskById(taskId));
        }
    }, [taskId, isOpen, dispatch]);

    // Workspace members and labels feed the pickers in the sidebar.
    useEffect(() => {
        if (!isOpen || !workspaceId) return;
        axios
            .get(`/workspaces/${workspaceId}/members`)
            .then((response) =>
                setMembers((response.data.data as Array<{ user: PublicUser }>).map((m) => m.user))
            )
            .catch(() => setMembers([]));
        axios
            .get(`/labels/workspaces/${workspaceId}`)
            .then((response) => setLabels(response.data.data))
            .catch(() => setLabels([]));
    }, [isOpen, workspaceId]);

    useEffect(() => {
        if (currentTask) {
            setEditedTitle(currentTask.title);
            setEditedDescription(currentTask.description || '');
        }
    }, [currentTask]);

    const handleClose = () => {
        setIsEditingTitle(false);
        setIsEditingDescription(false);
        dispatch(clearCurrentTask());
        onClose();
    };

    if (!isOpen) return null;

    if (isLoading || !currentTask || currentTask.id !== taskId) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleClose} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl h-96 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
                    </div>
                </div>
            </div>
        );
    }

    const task = currentTask;
    const assignedIds = new Set(task.assignees?.map((a) => a.user.id));
    const labelIds = new Set(task.taskLabels?.map((tl) => tl.label.id));
    const availableMembers = members.filter((m) => !assignedIds.has(m.id));
    const availableLabels = labels.filter((l) => !labelIds.has(l.id));
    const topLevelComments = (task.comments ?? []).filter((c) => !c.parentId);
    const isDone = Boolean(task.completedAt);

    const handleSaveTitle = async () => {
        const title = editedTitle.trim();
        if (title && title !== task.title) {
            await dispatch(updateTask({ taskId: task.id, title }));
        } else {
            setEditedTitle(task.title);
        }
        setIsEditingTitle(false);
    };

    const handleSaveDescription = async () => {
        if (editedDescription !== (task.description || '')) {
            await dispatch(updateTask({ taskId: task.id, description: editedDescription }));
        }
        setIsEditingDescription(false);
    };

    const handleAddComment = async () => {
        if (comment.trim()) {
            await dispatch(addComment({ taskId: task.id, content: comment.trim() }));
            setComment('');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const result = await dispatch(uploadAttachment({ taskId: task.id, file }));
        if (uploadAttachment.rejected.match(result)) {
            showToast.error(result.error.message || 'Upload failed');
        }
    };

    const handleCreateLabel = async () => {
        if (!workspaceId || !newLabelName.trim()) return;
        try {
            const response = await axios.post(`/labels/workspaces/${workspaceId}`, {
                name: newLabelName.trim(),
                color: newLabelColor,
            });
            const label: Label = response.data.data;
            setLabels((current) => [...current, label]);
            setNewLabelName('');
            await dispatch(addLabel({ taskId: task.id, labelId: label.id }));
        } catch (err) {
            const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
            showToast.error(message || 'Could not create the label');
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this task?')) {
            await dispatch(deleteTask(task.id));
            handleClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Task details">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleClose} />
                <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl">
                    {/* Header */}
                    <div className="flex items-start justify-between px-6 py-4 border-b">
                        <div className="flex-1">
                            {isEditingTitle ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={editedTitle}
                                        onChange={(e) => setEditedTitle(e.target.value)}
                                        aria-label="Task title"
                                        className="text-xl font-bold text-gray-900 flex-1 border rounded px-2 py-1 focus:ring-2 focus:ring-primary-500"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveTitle();
                                            if (e.key === 'Escape') {
                                                setEditedTitle(task.title);
                                                setIsEditingTitle(false);
                                            }
                                        }}
                                    />
                                    <button onClick={handleSaveTitle} className="btn-primary text-sm px-3">
                                        Save
                                    </button>
                                </div>
                            ) : (
                                <h1
                                    className={`text-xl font-bold cursor-pointer hover:text-primary-600 ${
                                        isDone ? 'text-gray-400 line-through' : 'text-gray-900'
                                    }`}
                                    onClick={() => setIsEditingTitle(true)}
                                >
                                    {task.title}
                                </h1>
                            )}
                        </div>
                        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row md:h-[600px]">
                        {/* Left Content */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                                {isEditingDescription ? (
                                    <div className="flex gap-2">
                                        <textarea
                                            value={editedDescription}
                                            onChange={(e) => setEditedDescription(e.target.value)}
                                            aria-label="Task description"
                                            className="flex-1 min-h-[100px] p-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                            autoFocus
                                        />
                                        <div className="flex flex-col gap-2">
                                            <button onClick={handleSaveDescription} className="btn-primary text-sm px-3 h-min">
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditedDescription(task.description || '');
                                                    setIsEditingDescription(false);
                                                }}
                                                className="btn-secondary text-sm px-3 h-min"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setIsEditingDescription(true)}
                                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                    >
                                        <p className="text-gray-700 whitespace-pre-wrap">
                                            {task.description || 'Add description...'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-4">Comments</h3>
                                <div className="flex gap-3 mb-4">
                                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                                        {task.creator?.fullName?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Write a comment..."
                                            aria-label="New comment"
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                                            rows={3}
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!comment.trim() || isSavingComment}
                                            className="btn-primary text-sm mt-2 disabled:opacity-50"
                                        >
                                            <MessageSquare className="h-4 w-4 mr-2 inline" />
                                            {isSavingComment ? 'Posting...' : 'Comment'}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {topLevelComments.length ? (
                                        topLevelComments.map((c) => (
                                            <div key={c.id} className="flex gap-3">
                                                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                                                    {c.user?.fullName?.[0]?.toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="font-medium text-sm">{c.user?.fullName}</span>
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        {new Date(c.createdAt).toLocaleDateString()}
                                                    </span>
                                                    {c.userId === currentUserId && (
                                                        <button
                                                            onClick={() => dispatch(deleteComment({ taskId: task.id, commentId: c.id }))}
                                                            className="text-xs text-gray-400 hover:text-red-600 ml-3"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{c.content}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No comments yet</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="w-full md:w-72 bg-gray-50 p-6 border-t md:border-t-0 md:border-l overflow-y-auto">
                            <div className="mb-6">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isDone}
                                        disabled={isUpdating}
                                        onChange={(e) =>
                                            dispatch(
                                                updateTask({
                                                    taskId: task.id,
                                                    completedAt: e.target.checked ? new Date().toISOString() : null,
                                                })
                                            )
                                        }
                                    />
                                    Mark as complete
                                </label>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">Priority</h3>
                                <select
                                    value={task.priority}
                                    aria-label="Priority"
                                    onChange={(e) =>
                                        dispatch(
                                            updateTask({ taskId: task.id, priority: e.target.value as typeof task.priority })
                                        )
                                    }
                                    className="w-full px-2 py-1 border rounded text-sm"
                                >
                                    {['none', 'low', 'medium', 'high', 'urgent'].map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">Assignees</h3>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {task.assignees?.map((a) => (
                                        <span
                                            key={a.user.id}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-white border rounded-full text-xs"
                                        >
                                            {a.user.fullName}
                                            <button
                                                onClick={() => dispatch(removeAssignee({ taskId: task.id, userId: a.user.id }))}
                                                className="text-gray-400 hover:text-red-600"
                                                aria-label={`Remove ${a.user.fullName}`}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                {availableMembers.length > 0 && (
                                    <select
                                        value=""
                                        aria-label="Add assignee"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                void dispatch(addAssignee({ taskId: task.id, userId: e.target.value }));
                                            }
                                        }}
                                        className="w-full px-2 py-1 border rounded text-sm"
                                    >
                                        <option value="">Add assignee...</option>
                                        {availableMembers.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.fullName}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">Labels</h3>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {task.taskLabels?.map((tl) => (
                                        <span
                                            key={tl.label.id}
                                            style={{ backgroundColor: tl.label.color + '20', color: tl.label.color }}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
                                        >
                                            {tl.label.name}
                                            <button
                                                onClick={() => dispatch(removeLabel({ taskId: task.id, labelId: tl.label.id }))}
                                                aria-label={`Remove label ${tl.label.name}`}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                {availableLabels.length > 0 && (
                                    <select
                                        value=""
                                        aria-label="Add label"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                void dispatch(addLabel({ taskId: task.id, labelId: e.target.value }));
                                            }
                                        }}
                                        className="w-full px-2 py-1 border rounded text-sm mb-2"
                                    >
                                        <option value="">Add label...</option>
                                        {availableLabels.map((l) => (
                                            <option key={l.id} value={l.id}>
                                                {l.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <div className="flex gap-1">
                                    <input
                                        value={newLabelName}
                                        onChange={(e) => setNewLabelName(e.target.value)}
                                        placeholder="New label"
                                        aria-label="New label name"
                                        className="flex-1 min-w-0 px-2 py-1 border rounded text-sm"
                                    />
                                    <select
                                        value={newLabelColor}
                                        onChange={(e) => setNewLabelColor(e.target.value)}
                                        aria-label="New label color"
                                        className="px-1 border rounded text-sm"
                                        style={{ color: newLabelColor }}
                                    >
                                        {LABEL_COLORS.map((c) => (
                                            <option key={c} value={c} style={{ color: c }}>
                                                &#9679;
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleCreateLabel}
                                        disabled={!newLabelName.trim()}
                                        className="btn-secondary text-xs px-2 disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">Due date</h3>
                                <input
                                    type="date"
                                    aria-label="Due date"
                                    value={task.dueDate?.split('T')[0] || ''}
                                    onChange={(e) =>
                                        dispatch(updateTask({ taskId: task.id, dueDate: e.target.value || null }))
                                    }
                                    className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">Attachments</h3>
                                {(task.attachments?.length ?? 0) > 0 && (
                                    <div className="space-y-1 mb-2">
                                        {task.attachments?.map((a) => (
                                            <div key={a.id} className="flex items-center gap-2">
                                                <a
                                                    href={a.fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex-1 block p-1 bg-white rounded border text-xs text-primary-600 hover:bg-gray-100 truncate"
                                                >
                                                    {a.fileName}
                                                </a>
                                                <button
                                                    onClick={() =>
                                                        dispatch(deleteAttachment({ taskId: task.id, attachmentId: a.id }))
                                                    }
                                                    className="text-gray-400 hover:text-red-600"
                                                    aria-label={`Delete ${a.fileName}`}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <label className="w-full flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 rounded text-xs text-gray-600 hover:border-primary-500 cursor-pointer">
                                    <Paperclip className="h-3 w-3 mr-1" />
                                    Add file
                                    <input type="file" onChange={handleFileUpload} className="hidden" />
                                </label>
                            </div>

                            <div className="pt-4 border-t">
                                <button
                                    onClick={handleDelete}
                                    disabled={isUpdating}
                                    className="w-full px-3 py-2 text-sm text-red-600 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
                                >
                                    <Trash2 className="h-4 w-4 mr-1 inline" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
