import React, { useEffect, useState } from 'react';
import { X, Trash2, Paperclip, MessageSquare } from 'lucide-react';
import { useAppDispatch, useAppSelector, useSocketTask } from '../../hooks';
import {
    getTaskById,
    updateTask,
    deleteTask,
    addComment,
    uploadAttachment,
    removeAssignee,
    removeLabel,
} from '../taskSlice';

interface TaskDetailModalProps {
    taskId: string;
    isOpen: boolean;
    onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, isOpen, onClose }) => {
    const dispatch = useAppDispatch();
    const { currentTask, isLoading, isSavingComment, isUpdating } = useAppSelector((state) => state.task);

    const [comment, setComment] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedDescription, setEditedDescription] = useState('');

    useSocketTask(taskId);

    useEffect(() => {
        if (taskId && isOpen) {
            dispatch(getTaskById(taskId));
        }
    }, [taskId, isOpen, dispatch]);

    useEffect(() => {
        if (currentTask) {
            setEditedTitle(currentTask.title);
            setEditedDescription(currentTask.description || '');
        }
    }, [currentTask]);

    const handleSaveTitle = async () => {
        if (editedTitle !== currentTask?.title) {
            await dispatch(updateTask({ taskId: currentTask!.id, title: editedTitle }));
        }
        setIsEditingTitle(false);
    };

    const handleSaveDescription = async () => {
        if (editedDescription !== currentTask?.description) {
            await dispatch(updateTask({ taskId: currentTask!.id, description: editedDescription }));
        }
        setIsEditingDescription(false);
    };

    const handleAddComment = async () => {
        if (comment.trim() && currentTask) {
            await dispatch(addComment({ taskId: currentTask.id, content: comment }));
            setComment('');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && currentTask) {
            const file = e.target.files[0];
            await dispatch(uploadAttachment({ taskId: currentTask.id, file }));
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this task?')) {
            await dispatch(deleteTask(currentTask!.id));
            onClose();
        }
    };

    if (!isOpen) return null;

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl h-96 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
                    </div>
                </div>
            </div>
        );
    }

    if (!currentTask) return null;

    const userAvatarInitial = currentTask.createdBy?.fullName?.[0]?.toUpperCase() || 'U';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
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
                                        className="text-xl font-bold text-gray-900 flex-1 border rounded px-2 py-1 focus:ring-2 focus:ring-primary-500"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveTitle();
                                            if (e.key === 'Escape') setIsEditingTitle(false);
                                        }}
                                    />
                                    <button onClick={handleSaveTitle} className="btn-primary text-sm px-3">
                                        Save
                                    </button>
                                </div>
                            ) : (
                                <h1 className="text-xl font-bold text-gray-900 cursor-pointer hover:text-primary-600" onClick={() => setIsEditingTitle(true)}>
                                    {editedTitle}
                                </h1>
                            )}
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex h-[600px]">
                        {/* Left Content */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            {/* Description */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                                {isEditingDescription ? (
                                    <div className="flex gap-2">
                                        <textarea
                                            value={editedDescription}
                                            onChange={(e) => setEditedDescription(e.target.value)}
                                            className="flex-1 min-h-[100px] p-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                            autoFocus
                                        />
                                        <div className="flex flex-col gap-2">
                                            <button onClick={handleSaveDescription} className="btn-primary text-sm px-3 h-min">
                                                Save
                                            </button>
                                            <button onClick={() => setIsEditingDescription(false)} className="btn-secondary text-sm px-3 h-min">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div onClick={() => setIsEditingDescription(true)} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <p className="text-gray-700">{editedDescription || 'Add description...'}</p>
                                    </div>
                                )}
                            </div>

                            {/* Comments */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-4">Activity</h3>
                                <div className="flex gap-3 mb-4">
                                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                                        {userAvatarInitial}
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Write a comment..."
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                                            rows={3}
                                        />
                                        <button onClick={handleAddComment} disabled={!comment.trim() || isSavingComment} className="btn-primary text-sm mt-2 disabled:opacity-50">
                                            <MessageSquare className="h-4 w-4 mr-2 inline" />
                                            {isSavingComment ? 'Posting...' : 'Comment'}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {currentTask.comments?.length ? (
                                        currentTask.comments.map((c) => (
                                            <div key={c.id} className="flex gap-3">
                                                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                                                    {c.user?.fullName?.[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-sm">{c.user?.fullName}</span>
                                                    <span className="text-xs text-gray-500 ml-2">{new Date(c.createdAt).toLocaleDateString()}</span>
                                                    <p className="text-sm text-gray-700 mt-1">{c.content}</p>
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
                        <div className="w-72 bg-gray-50 p-6 border-l overflow-y-auto">
                            {/* Assignees */}
                            <div className="mb-6">
                                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">Members</h3>
                                <div className="flex -space-x-2 mb-2">
                                    {currentTask.assignees?.map((a) => (
                                        <div key={a.user.id} className="h-8 w-8 rounded-full bg-primary-600 border-2 border-white flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:opacity-80" title={a.user.fullName} onClick={() => removeAssignee({ taskId: currentTask.id, userId: a.user.id })}>
                                            {a.user.fullName?.[0]}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Labels */}
                            <div className="mb-6">
                                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">Labels</h3>
                                <div className="flex flex-wrap gap-2">
                                    {currentTask.taskLabels?.map((tl) => (
                                        <span key={tl.label.id} style={{ backgroundColor: tl.label.color + '20', color: tl.label.color }} className="px-2 py-1 text-xs font-medium rounded cursor-pointer hover:opacity-75" onClick={() => removeLabel({ taskId: currentTask.id, labelId: tl.label.id })}>
                                            {tl.label.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="mb-6">
                                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">Due Date</h3>
                                <input type="date" value={currentTask.dueDate?.split('T')[0] || ''} onChange={(e) => dispatch(updateTask({ taskId: currentTask.id, dueDate: e.target.value }))} className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-primary-500" />
                            </div>

                            {/* Attachments */}
                            <div className="mb-6">
                                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">Attachments</h3>
                                {currentTask.attachments?.length && <div className="space-y-1 mb-2">{currentTask.attachments.map((a) => (<a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer" className="block p-1 bg-white rounded border text-xs text-primary-600 hover:bg-gray-100 truncate">{a.fileName}</a>))}</div>}
                                <label className="w-full flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 rounded text-xs text-gray-600 hover:border-primary-500 cursor-pointer">
                                    <Paperclip className="h-3 w-3 mr-1" />
                                    Add File
                                    <input type="file" onChange={handleFileUpload} className="hidden" />
                                </label>
                            </div>

                            <div className="pt-4 border-t">
                                <button onClick={handleDelete} disabled={isUpdating} className="w-full px-3 py-2 text-sm text-red-600 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50">
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
