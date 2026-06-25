import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';
import { fetchPRs } from './prsSlice';

export const fetchWorkouts = createAsyncThunk('workouts/fetchWorkouts', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/workouts');
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const addWorkout = createAsyncThunk('workouts/addWorkout', async (workout, { dispatch, rejectWithValue }) => {
  try {
    const res = await api.post('/workouts', workout);
    dispatch(fetchPRs());
    return res;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const updateWorkout = createAsyncThunk('workouts/updateWorkout', async (workout, { dispatch, rejectWithValue }) => {
  try {
    const res = await api.put(`/workouts/${workout.id}`, workout);
    dispatch(fetchPRs());
    return res;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const deleteWorkout = createAsyncThunk('workouts/deleteWorkout', async (id, { dispatch, rejectWithValue }) => {
  try {
    await api.delete(`/workouts/${id}`);
    dispatch(fetchPRs());
    return id;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const initialState = {
  data: [], // array of workout objects
  loading: false,
  error: null
};

const workoutsSlice = createSlice({
  name: 'workouts',
  initialState,
  reducers: {
    clearWorkouts: (state) => {
      state.data = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkouts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWorkouts.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchWorkouts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addWorkout.fulfilled, (state, action) => {
        state.data.push(action.payload);
        state.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      })
      .addCase(updateWorkout.fulfilled, (state, action) => {
        const index = state.data.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        state.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      })
      .addCase(deleteWorkout.fulfilled, (state, action) => {
        state.data = state.data.filter(w => w.id !== action.payload);
      });
  }
});

export const { clearWorkouts } = workoutsSlice.actions;
export default workoutsSlice.reducer;

