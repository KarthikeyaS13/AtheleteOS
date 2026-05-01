import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  theme: 'dark',
  activeToasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    addToast: (state, action) => {
      // action.payload: { id, type, message }
      state.activeToasts.push(action.payload);
      if (state.activeToasts.length > 3) {
        state.activeToasts.shift();
      }
    },
    removeToast: (state, action) => {
      state.activeToasts = state.activeToasts.filter(t => t.id !== action.payload);
    }
  }
});

export const { toggleSidebar, setSidebarOpen, setTheme, addToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;
