import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';
import { fetchWorkouts } from './workoutsSlice';
import { fetchPRs } from './prsSlice';

export const fetchStravaStatus = createAsyncThunk('strava/fetchStatus', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/strava/status');
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch Strava status');
  }
});

export const connectStrava = createAsyncThunk('strava/connect', async (code, { dispatch, rejectWithValue }) => {
  try {
    const res = await api.post('/strava/connect', { code });
    dispatch(fetchStravaStatus());
    dispatch(syncStravaActivities({ isAuto: false }));
    return res;
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to connect Strava');
  }
});

export const disconnectStrava = createAsyncThunk('strava/disconnect', async (_, { dispatch, rejectWithValue }) => {
  try {
    const res = await api.post('/strava/disconnect');
    dispatch(fetchStravaStatus());
    return res;
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to disconnect Strava');
  }
});

export const syncStravaActivities = createAsyncThunk('strava/sync', async (params, { dispatch, rejectWithValue }) => {
  const isAuto = params?.isAuto || false;
  try {
    const res = await api.post('/strava/sync', { auto: isAuto });
    if (res.importedCount > 0) {
      dispatch(fetchWorkouts());
    }
    dispatch(fetchPendingPRs());
    return res;
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to sync Strava activities');
  }
});

export const fetchPendingPRs = createAsyncThunk('strava/fetchPendingPRs', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/strava/prs/pending');
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to fetch pending PRs');
  }
});

export const acceptPendingPR = createAsyncThunk('strava/acceptPR', async ({ sport, event }, { dispatch, rejectWithValue }) => {
  try {
    const res = await api.post('/strava/prs/accept', { sport, event });
    dispatch(fetchPendingPRs());
    dispatch(fetchPRs());
    return res;
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to accept PR');
  }
});

export const rejectPendingPR = createAsyncThunk('strava/rejectPR', async ({ sport, event }, { dispatch, rejectWithValue }) => {
  try {
    const res = await api.post('/strava/prs/reject', { sport, event });
    dispatch(fetchPendingPRs());
    return res;
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to reject PR');
  }
});

const initialState = {
  connected: false,
  clientId: false,
  athlete: null,
  loading: false,
  syncing: false,
  pendingPRs: [],
  error: null,
  syncError: null
};

const stravaSlice = createSlice({
  name: 'strava',
  initialState,
  reducers: {
    clearStravaError: (state) => {
      state.error = null;
      state.syncError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStravaStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStravaStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.connected = action.payload.connected;
        state.clientId = action.payload.clientId;
        state.athlete = action.payload.athlete || null;
      })
      .addCase(fetchStravaStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(syncStravaActivities.pending, (state) => {
        state.syncing = true;
        state.syncError = null;
      })
      .addCase(syncStravaActivities.fulfilled, (state) => {
        state.syncing = false;
      })
      .addCase(syncStravaActivities.rejected, (state, action) => {
        state.syncing = false;
        state.syncError = action.payload;
      })
      .addCase(fetchPendingPRs.fulfilled, (state, action) => {
        state.pendingPRs = action.payload;
      });
  }
});

export const { clearStravaError } = stravaSlice.actions;
export default stravaSlice.reducer;
