import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: {}, // keyed by date string (YYYY-MM-DD), value is array of meals
};

const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState,
  reducers: {
    addNutritionEntry: (state, action) => {
      // payload: { date, meal: 'Breakfast', ...item }
      const { date, meal, item } = action.payload;
      if (!state.data[date]) {
        state.data[date] = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [], hydration: 0 };
      }
      state.data[date][meal].push(item);
    },
    removeNutritionEntry: (state, action) => {
      const { date, meal, itemId } = action.payload;
      if (state.data[date]) {
        state.data[date][meal] = state.data[date][meal].filter(i => i.id !== itemId);
      }
    },
    updateHydration: (state, action) => {
      const { date, quantity } = action.payload;
      if (!state.data[date]) {
         state.data[date] = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [], hydration: 0 };
      }
      state.data[date].hydration = quantity;
    },
    setNutritionData: (state, action) => {
      state.data = action.payload;
    }
  }
});

export const { addNutritionEntry, removeNutritionEntry, updateHydration, setNutritionData } = nutritionSlice.actions;
export default nutritionSlice.reducer;
