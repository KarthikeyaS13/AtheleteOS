import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

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
  },
  loading: false,
  error: null
};

// Async Thunks
export const fetchSettings = createAsyncThunk('settings/fetchSettings', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/settings');
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const saveSettings = async (getState, rejectWithValue) => {
  try {
    const state = getState().settings;
    const { profile, targets, equipment, preferences } = state;
    return await api.put('/settings', { profile, targets, equipment, preferences });
  } catch (err) {
    return rejectWithValue(err.message);
  }
};

export const updateProfile = createAsyncThunk('settings/updateProfile', async (payload, { dispatch, getState, rejectWithValue }) => {
  dispatch(settingsSlice.actions.localUpdateProfile(payload));
  return saveSettings(getState, rejectWithValue);
});

export const updateTargets = createAsyncThunk('settings/updateTargets', async (payload, { dispatch, getState, rejectWithValue }) => {
  dispatch(settingsSlice.actions.localUpdateTargets(payload));
  return saveSettings(getState, rejectWithValue);
});

export const addShoe = createAsyncThunk('settings/addShoe', async (payload, { dispatch, getState, rejectWithValue }) => {
  dispatch(settingsSlice.actions.localAddShoe(payload));
  return saveSettings(getState, rejectWithValue);
});

export const addBike = createAsyncThunk('settings/addBike', async (payload, { dispatch, getState, rejectWithValue }) => {
  dispatch(settingsSlice.actions.localAddBike(payload));
  return saveSettings(getState, rejectWithValue);
});

export const updateShoeDistance = createAsyncThunk('settings/updateShoeDistance', async (payload, { dispatch, getState, rejectWithValue }) => {
  dispatch(settingsSlice.actions.localUpdateShoeDistance(payload));
  return saveSettings(getState, rejectWithValue);
});

export const updatePreferences = createAsyncThunk('settings/updatePreferences', async (payload, { dispatch, getState, rejectWithValue }) => {
  dispatch(settingsSlice.actions.localUpdatePreferences(payload));
  return saveSettings(getState, rejectWithValue);
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    localUpdateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    localUpdateTargets: (state, action) => {
      state.targets = { ...state.targets, ...action.payload };
    },
    localAddShoe: (state, action) => {
      state.equipment.shoes.push(action.payload);
    },
    localAddBike: (state, action) => {
      state.equipment.bikes.push(action.payload);
    },
    localUpdateShoeDistance: (state, action) => {
      const { id, distance } = action.payload;
      const shoe = state.equipment.shoes.find(s => s.id === id);
      if (shoe) shoe.currentKm += distance;
    },
    localUpdatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    clearSettings: (state) => {
      return {
        ...initialState,
        loading: false,
        error: null
      };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const parseField = (field) => {
            if (typeof field === 'string') {
              try {
                return JSON.parse(field);
              } catch (e) {
                return {};
              }
            }
            return field || {};
          };

          const profile = parseField(action.payload.profile);
          const targets = parseField(action.payload.targets);
          const equipment = parseField(action.payload.equipment);
          const preferences = parseField(action.payload.preferences);

          state.profile = { ...initialState.profile, ...state.profile, ...profile };
          state.targets = { ...initialState.targets, ...state.targets, ...targets };
          state.equipment = { ...initialState.equipment, ...state.equipment, ...equipment };
          state.preferences = { ...initialState.preferences, ...state.preferences, ...preferences };
        }
        state.error = null;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
