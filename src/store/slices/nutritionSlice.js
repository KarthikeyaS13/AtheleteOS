import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export const fetchNutritionData = createAsyncThunk('nutrition/fetchNutritionData', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/nutrition');
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const addNutritionEntry = createAsyncThunk('nutrition/addNutritionEntry', async ({ date, meal, item }, { rejectWithValue }) => {
  try {
    return await api.post('/nutrition', { date, meal, item });
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const removeNutritionEntry = createAsyncThunk('nutrition/removeNutritionEntry', async ({ date, meal, itemId }, { rejectWithValue }) => {
  try {
    await api.delete(`/nutrition/${date}/${meal}/${itemId}`);
    return { date, meal, itemId };
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const updateHydration = createAsyncThunk('nutrition/updateHydration', async ({ date, quantity }, { rejectWithValue }) => {
  try {
    return await api.put('/nutrition/hydration', { date, quantity });
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const initialState = {
  data: {}, // keyed by date string (YYYY-MM-DD), value is array of meals + hydration
  loading: false,
  error: null
};

const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState,
  reducers: {
    clearNutrition: (state) => {
      state.data = {};
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNutritionData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNutritionData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchNutritionData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addNutritionEntry.fulfilled, (state, action) => {
        const { date, meal, item } = action.payload;
        if (!state.data[date]) {
          state.data[date] = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [], hydration: 0 };
        }
        state.data[date][meal].push(item);
      })
      .addCase(removeNutritionEntry.fulfilled, (state, action) => {
        const { date, meal, itemId } = action.payload;
        if (state.data[date]) {
          state.data[date][meal] = state.data[date][meal].filter(i => i.id !== itemId);
        }
      })
      .addCase(updateHydration.fulfilled, (state, action) => {
        const { date, quantity } = action.payload;
        if (!state.data[date]) {
          state.data[date] = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [], hydration: 0 };
        }
        state.data[date].hydration = quantity;
      });
  }
});

export const { clearNutrition } = nutritionSlice.actions;
export default nutritionSlice.reducer;
