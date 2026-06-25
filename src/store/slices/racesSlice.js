import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export const fetchRaces = createAsyncThunk('races/fetchRaces', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/races');
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const addRace = createAsyncThunk('races/addRace', async (race, { rejectWithValue }) => {
  try {
    return await api.post('/races', race);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const updateRace = createAsyncThunk('races/updateRace', async (race, { rejectWithValue }) => {
  try {
    return await api.put(`/races/${race.id}`, race);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const deleteRace = createAsyncThunk('races/deleteRace', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/races/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const initialState = {
  data: [],
  loading: false,
  error: null
};

const racesSlice = createSlice({
  name: 'races',
  initialState,
  reducers: {
    clearRaces: (state) => {
      state.data = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRaces.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRaces.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchRaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addRace.fulfilled, (state, action) => {
        state.data.push(action.payload);
        state.data.sort((a, b) => new Date(a.date) - new Date(b.date));
      })
      .addCase(updateRace.fulfilled, (state, action) => {
        const index = state.data.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        state.data.sort((a, b) => new Date(a.date) - new Date(b.date));
      })
      .addCase(deleteRace.fulfilled, (state, action) => {
        state.data = state.data.filter(r => r.id !== action.payload);
      });
  }
});

export const { clearRaces } = racesSlice.actions;
export default racesSlice.reducer;
