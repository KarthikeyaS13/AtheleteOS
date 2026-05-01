import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: [], // array of workout objects
};

const workoutsSlice = createSlice({
  name: 'workouts',
  initialState,
  reducers: {
    addWorkout: (state, action) => {
      state.data.push(action.payload);
      // Sort desc by date
      state.data.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    updateWorkout: (state, action) => {
      const index = state.data.findIndex(w => w.id === action.payload.id);
      if (index !== -1) {
        state.data[index] = action.payload;
      }
      state.data.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    deleteWorkout: (state, action) => {
      state.data = state.data.filter(w => w.id !== action.payload);
    },
    setWorkouts: (state, action) => {
      state.data = action.payload;
      state.data.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  }
});

export const { addWorkout, updateWorkout, deleteWorkout, setWorkouts } = workoutsSlice.actions;
export default workoutsSlice.reducer;
