import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../lib/axios';
import { disconnectSocket } from '../../lib/socket';

export interface User {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string | null;
    isVerified: boolean;
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

interface AuthPayload {
    user: User;
    accessToken: string;
}

const readToken = (): string | null => {
    try {
        return localStorage.getItem('accessToken');
    } catch {
        return null;
    }
};

const storeToken = (token: string | null) => {
    try {
        if (token) {
            localStorage.setItem('accessToken', token);
        } else {
            localStorage.removeItem('accessToken');
        }
    } catch {
        // storage can be unavailable (private mode); the session just won't survive a reload
    }
};

const errorMessage = (error: unknown, fallback: string): string => {
    const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return message || fallback;
};

const initialToken = readToken();

const initialState: AuthState = {
    user: null,
    accessToken: initialToken,
    isAuthenticated: Boolean(initialToken),
    isLoading: false,
    error: null,
};

export const login = createAsyncThunk<AuthPayload, { email: string; password: string }, { rejectValue: string }>(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await axios.post('/auth/login', credentials);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(errorMessage(error, 'Login failed'));
        }
    }
);

export const register = createAsyncThunk<
    AuthPayload,
    { email: string; password: string; fullName: string },
    { rejectValue: string }
>('auth/register', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/auth/register', data);
        return response.data.data;
    } catch (error) {
        return rejectWithValue(errorMessage(error, 'Registration failed'));
    }
});

export const fetchCurrentUser = createAsyncThunk<User, void, { rejectValue: string }>(
    'auth/fetchCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/auth/me');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(errorMessage(error, 'Session expired'));
        }
    }
);

export const logout = createAsyncThunk('auth/logout', async () => {
    // Drop the realtime connection too, or the next user in this tab would inherit this one's rooms.
    disconnectSocket();
    try {
        await axios.post('/auth/logout');
    } catch {
        // the local session is cleared regardless of whether the server call succeeded
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setAccessToken: (state, action: PayloadAction<string>) => {
            state.accessToken = action.payload;
            state.isAuthenticated = true;
            storeToken(action.payload);
        },
    },
    extraReducers: (builder) => {
        const startLoading = (state: AuthState) => {
            state.isLoading = true;
            state.error = null;
        };
        const setSession = (state: AuthState, action: PayloadAction<AuthPayload>) => {
            state.isLoading = false;
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.isAuthenticated = true;
            storeToken(action.payload.accessToken);
        };
        const fail = (state: AuthState, action: { payload?: string }) => {
            state.isLoading = false;
            state.error = action.payload ?? 'Something went wrong';
        };

        builder
            .addCase(login.pending, startLoading)
            .addCase(login.fulfilled, setSession)
            .addCase(login.rejected, fail)
            .addCase(register.pending, startLoading)
            .addCase(register.fulfilled, setSession)
            .addCase(register.rejected, fail)
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(fetchCurrentUser.rejected, (state) => {
                state.user = null;
                state.accessToken = null;
                state.isAuthenticated = false;
                storeToken(null);
            })
            // Sign out locally right away; the server call only revokes the refresh token.
            .addCase(logout.pending, (state) => {
                state.user = null;
                state.accessToken = null;
                state.isAuthenticated = false;
                state.error = null;
                storeToken(null);
            });
    },
});

export const { clearError, setAccessToken } = authSlice.actions;
export default authSlice.reducer;
