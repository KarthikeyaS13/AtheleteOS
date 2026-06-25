import { configureStore } from '@reduxjs/toolkit';
import workoutsReducer from './slices/workoutsSlice';
import nutritionReducer from './slices/nutritionSlice';
import racesReducer from './slices/racesSlice';
import prsReducer from './slices/prsSlice';
import settingsReducer from './slices/settingsSlice';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import adminReducer from './slices/adminSlice';
import leaderboardReducer from './slices/leaderboardSlice';
import stravaReducer from './slices/stravaSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workouts: workoutsReducer,
    nutrition: nutritionReducer,
    races: racesReducer,
    prs: prsReducer,
    settings: settingsReducer,
    ui: uiReducer,
    admin: adminReducer,
    leaderboard: leaderboardReducer,
    strava: stravaReducer,
  },
});

