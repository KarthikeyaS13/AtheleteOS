import { configureStore } from '@reduxjs/toolkit';
import workoutsReducer from './slices/workoutsSlice';
import nutritionReducer from './slices/nutritionSlice';
import racesReducer from './slices/racesSlice';
import prsReducer from './slices/prsSlice';
import settingsReducer from './slices/settingsSlice';
import uiReducer from './slices/uiSlice';

// Middleware to sync specific states to localStorage
const localStorageMiddleware = store => next => action => {
  const result = next(action);
  // Store the relevant parts in LocalStorage
  const state = store.getState();
  localStorage.setItem('athletos_data', JSON.stringify({
    workouts: state.workouts,
    nutrition: state.nutrition,
    races: state.races,
    prs: state.prs,
    settings: state.settings,
    // We might skip UI state from localStorage so it defaults on refresh
  }));
  return result;
};

// Quick helper to load state
const loadPreloadedState = () => {
  try {
    const serialized = localStorage.getItem('athletos_data');
    if (serialized === null) {
      return undefined;
    }
    return JSON.parse(serialized);
  } catch (err) {
    console.error('Could not load state', err);
    return undefined;
  }
};

export const store = configureStore({
  reducer: {
    workouts: workoutsReducer,
    nutrition: nutritionReducer,
    races: racesReducer,
    prs: prsReducer,
    settings: settingsReducer,
    ui: uiReducer,
  },
  preloadedState: loadPreloadedState(),
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(localStorageMiddleware),
});
