import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export const fetchLeaderboard = createAsyncThunk(
  'leaderboard/fetchLeaderboard',
  async (_, { rejectWithValue }) => {
    try {
      return await api.get('/leaderboard');
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  data: {
    running: [],
    cycling: [],
    calories: [],
    consistency: [],
    workoutTime: [],
    overall: []
  },
  loading: false,
  error: null
};

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    clearLeaderboard: (state) => {
      state.data = {
        running: [],
        cycling: [],
        calories: [],
        consistency: [],
        workoutTime: [],
        overall: []
      };
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearLeaderboard } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
