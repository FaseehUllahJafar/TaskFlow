import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../lib/axios';

export interface PublicUser {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    email: string;
}

export interface TaskDetail {
    id: string;
    columnId: string;
    projectId: string;
    title: string;
    description?: string | null;
    priority: 'none' | 'low' | 'medium' | 'high' | 'urgent';
    position: number;
    dueDate?: string | null;
    completedAt?: string | null;
    coverImageUrl?: string | null;
    creator?: PublicUser;
    updatedAt: string;
    assignees?: Array<{ user: PublicUser }>;
    taskLabels?: Array<{ label: { id: string; name: string; color: string } }>;
    comments?: Comment[];
    attachments?: Attachment[];
}

export interface Comment {
    id: string;
    taskId: string;
    userId: string;
    content: string;
    parentId?: string | null;
    isEdited: boolean;
    createdAt: string;
    updatedAt: string;
    user: PublicUser;
    replies?: Comment[];
}

export interface Attachment {
    id: string;
    taskId: string;
    fileName: string;
    fileUrl: string;
    fileType?: string | null;
    fileSize?: number | null;
    createdAt: string;
}

export interface TaskState {
    currentTask: TaskDetail | null;
    isLoading: boolean;
    isSavingComment: boolean;
    isUpdating: boolean;
    error: string | null;
}

const initialState: TaskState = {
    currentTask: null,
    isLoading: false,
    isSavingComment: false,
    isUpdating: false,
    error: null,
};

export const getTaskById = createAsyncThunk('task/getTaskById', async (taskId: string) => {
    const response = await axios.get(`/tasks/${taskId}`);
    return response.data.data as TaskDetail;
});

// Every mutation reloads the task afterwards: the mutation endpoints return the bare row,
// while the modal needs the joined view (assignees, labels, comments, attachments).
export const updateTask = createAsyncThunk(
    'task/updateTask',
    async (
        data: {
            taskId: string;
            title?: string;
            description?: string;
            priority?: TaskDetail['priority'];
            dueDate?: string | null;
            completedAt?: string | null;
        },
        { dispatch }
    ) => {
        const { taskId, ...changes } = data;
        await axios.patch(`/tasks/${taskId}`, changes);
        await dispatch(getTaskById(taskId));
    }
);

export const deleteTask = createAsyncThunk('task/deleteTask', async (taskId: string) => {
    await axios.delete(`/tasks/${taskId}`);
    return taskId;
});

export const addComment = createAsyncThunk(
    'task/addComment',
    async (data: { taskId: string; content: string; parentId?: string }, { dispatch }) => {
        await axios.post(`/comments/tasks/${data.taskId}`, {
            content: data.content,
            parentId: data.parentId,
        });
        await dispatch(getTaskById(data.taskId));
    }
);

export const deleteComment = createAsyncThunk(
    'task/deleteComment',
    async (data: { taskId: string; commentId: string }, { dispatch }) => {
        await axios.delete(`/comments/${data.commentId}`);
        await dispatch(getTaskById(data.taskId));
    }
);

export const uploadAttachment = createAsyncThunk(
    'task/uploadAttachment',
    async (data: { taskId: string; file: File }, { dispatch }) => {
        const formData = new FormData();
        formData.append('file', data.file);
        await axios.post(`/attachments/tasks/${data.taskId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        await dispatch(getTaskById(data.taskId));
    }
);

export const deleteAttachment = createAsyncThunk(
    'task/deleteAttachment',
    async (data: { taskId: string; attachmentId: string }, { dispatch }) => {
        await axios.delete(`/attachments/${data.attachmentId}`);
        await dispatch(getTaskById(data.taskId));
    }
);

export const addAssignee = createAsyncThunk(
    'task/addAssignee',
    async (data: { taskId: string; userId: string }, { dispatch }) => {
        await axios.post(`/tasks/${data.taskId}/assignees`, { userIds: [data.userId] });
        await dispatch(getTaskById(data.taskId));
    }
);

export const removeAssignee = createAsyncThunk(
    'task/removeAssignee',
    async (data: { taskId: string; userId: string }, { dispatch }) => {
        await axios.delete(`/tasks/${data.taskId}/assignees/${data.userId}`);
        await dispatch(getTaskById(data.taskId));
    }
);

export const addLabel = createAsyncThunk(
    'task/addLabel',
    async (data: { taskId: string; labelId: string }, { dispatch }) => {
        await axios.post(`/tasks/${data.taskId}/labels`, { labelIds: [data.labelId] });
        await dispatch(getTaskById(data.taskId));
    }
);

export const removeLabel = createAsyncThunk(
    'task/removeLabel',
    async (data: { taskId: string; labelId: string }, { dispatch }) => {
        await axios.delete(`/tasks/${data.taskId}/labels/${data.labelId}`);
        await dispatch(getTaskById(data.taskId));
    }
);

const taskSlice = createSlice({
    name: 'task',
    initialState,
    reducers: {
        clearCurrentTask: (state) => {
            state.currentTask = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getTaskById.pending, (state, action) => {
                // Only show the loading state when opening a different task; background refreshes are silent.
                state.isLoading = state.currentTask?.id !== action.meta.arg;
                state.error = null;
            })
            .addCase(getTaskById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentTask = action.payload;
            })
            .addCase(getTaskById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to load task';
            })
            .addCase(updateTask.pending, (state) => {
                state.isUpdating = true;
            })
            .addCase(updateTask.fulfilled, (state) => {
                state.isUpdating = false;
            })
            .addCase(updateTask.rejected, (state, action) => {
                state.isUpdating = false;
                state.error = action.error.message || 'Failed to update task';
            })
            .addCase(deleteTask.fulfilled, (state) => {
                state.currentTask = null;
            })
            .addCase(addComment.pending, (state) => {
                state.isSavingComment = true;
            })
            .addCase(addComment.fulfilled, (state) => {
                state.isSavingComment = false;
            })
            .addCase(addComment.rejected, (state, action) => {
                state.isSavingComment = false;
                state.error = action.error.message || 'Failed to add comment';
            });
    },
});

export const { clearCurrentTask } = taskSlice.actions;
export default taskSlice.reducer;
