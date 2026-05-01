import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: {
    name: '',
    age: '',
    weight: '',
    height: '',
    photo: '',
    restingHR: '60',
    maxHR: '190'
  },
  targets: {
    weeklyRunKm: 40,
    weeklyCycleKm: 100,
    weeklySwimM: 2000,
    weeklyStrength: 3,
    dailyCalories: 2500,
    dailyProtein: 150,
    dailyCarbs: 300,
    dailyFat: 80,
    dailyWater: 8
  },
  equipment: {
    shoes: [], // { id, name, brand, startKm, currentKm, limit }
    bikes: [], // { id, name, type }
    exercises: [], // names of exercises
  },
  preferences: {
    theme: 'dark',
    units: 'km',
    weekStart: 'Monday'
  }
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    updateTargets: (state, action) => {
      state.targets = { ...state.targets, ...action.payload };
    },
    addShoe: (state, action) => {
      state.equipment.shoes.push(action.payload);
    },
    addBike: (state, action) => {
      state.equipment.bikes.push(action.payload);
    },
    updateShoeDistance: (state, action) => {
      const { id, distance } = action.payload;
      const shoe = state.equipment.shoes.find(s => s.id === id);
      if (shoe) shoe.currentKm += distance;
    },
    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    setSettings: (state, action) => {
       // Merge payload over initial state to avoid missing keys
       return { ...state, ...action.payload };
    }
  }
});

export const { updateProfile, updateTargets, addShoe, addBike, updateShoeDistance, updatePreferences, setSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
