import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export const fetchAdminAnalytics = createAsyncThunk(
  'admin/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      return await api.get('/admin/analytics');
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchAdminUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await api.get('/admin/users');
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateAdminUser = createAsyncThunk(
  'admin/updateUser',
  async ({ id, role, status }, { rejectWithValue }) => {
    try {
      await api.put(`/admin/users/${id}`, { role, status });
      return { id, role, status };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchAdminWorkouts = createAsyncThunk(
  'admin/fetchWorkouts',
  async (_, { rejectWithValue }) => {
    try {
      return await api.get('/admin/workouts');
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  analytics: null,
  users: [],
  workouts: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminState: (state) => {
      state.analytics = null;
      state.users = [];
      state.workouts = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Analytics
      .addCase(fetchAdminAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAdminAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Users
      .addCase(fetchAdminUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update User
      .addCase(updateAdminUser.fulfilled, (state, action) => {
        const { id, role, status } = action.payload;
        const index = state.users.findIndex(u => u.id === id);
        if (index !== -1) {
          if (role) state.users[index].role = role;
          if (status) state.users[index].status = status;
        }
      })
      // Workouts
      .addCase(fetchAdminWorkouts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminWorkouts.fulfilled, (state, action) => {
        state.loading = false;
        state.workouts = action.payload;
      })
      .addCase(fetchAdminWorkouts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearAdminState } = adminSlice.actions;
export default adminSlice.reducer;
