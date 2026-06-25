import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export const fetchPRs = createAsyncThunk('prs/fetchPRs', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/prs');
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const updatePR = createAsyncThunk('prs/updatePR', async ({ sport, event, value, date, previousValue }, { rejectWithValue }) => {
  try {
    return await api.post('/prs', { sport, event, value, date, previousValue });
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const initialState = {
  data: {}, // keyed by sport -> distance/movement e.g. { Running: { '5K': { value: '00:20:00', date: '...', previousValue: '...' } } }
  loading: false,
  error: null
};

const prsSlice = createSlice({
  name: 'prs',
  initialState,
  reducers: {
    clearPRs: (state) => {
      state.data = {};
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPRs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPRs.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchPRs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatePR.fulfilled, (state, action) => {
        const { sport, event, value, date, previousValue } = action.payload;
        if (!state.data[sport]) {
          state.data[sport] = {};
        }
        state.data[sport][event] = {
          value,
          date,
          previousValue
        };
      });
  }
});

export const { clearPRs } = prsSlice.actions;
export default prsSlice.reducer;
