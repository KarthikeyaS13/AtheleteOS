import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: [],
};

const racesSlice = createSlice({
  name: 'races',
  initialState,
  reducers: {
    addRace: (state, action) => {
      state.data.push(action.payload);
      state.data.sort((a, b) => new Date(a.date) - new Date(b.date));
    },
    updateRace: (state, action) => {
      const index = state.data.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
         state.data[index] = action.payload;
      }
      state.data.sort((a, b) => new Date(a.date) - new Date(b.date));
    },
    deleteRace: (state, action) => {
      state.data = state.data.filter(r => r.id !== action.payload);
    },
    setRaces: (state, action) => {
      state.data = action.payload;
    }
  }
});

export const { addRace, updateRace, deleteRace, setRaces } = racesSlice.actions;
export default racesSlice.reducer;
