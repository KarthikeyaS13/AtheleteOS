import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: {}, // keyed by sport -> distance/movement e.g. { Running: { '5K': { time: '00:20:00', date: '...' } } }
};

const prsSlice = createSlice({
  name: 'prs',
  initialState,
  reducers: {
    updatePR: (state, action) => {
      // payload: { sport: 'Running', event: '5K', value: '00:20:00', date: 'YYYY-MM-DD' }
      const { sport, event, value, date } = action.payload;
      if (!state.data[sport]) {
        state.data[sport] = {};
      }
      
      const prevPR = state.data[sport][event];
      state.data[sport][event] = {
        value,
        date,
        previousValue: prevPR ? prevPR.value : null
      };
    },
    setPRs: (state, action) => {
      state.data = action.payload;
    }
  }
});

export const { updatePR, setPRs } = prsSlice.actions;
export default prsSlice.reducer;
