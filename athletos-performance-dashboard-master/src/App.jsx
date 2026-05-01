import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { generateSeedData } from './utils/seedData';
import { setWorkouts } from './store/slices/workoutsSlice';
import { setNutritionData } from './store/slices/nutritionSlice';
import { setRaces } from './store/slices/racesSlice';
import { setPRs } from './store/slices/prsSlice';

// Main Layout
import Layout from './components/Layout/Layout';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LogWorkout = lazy(() => import('./pages/LogWorkout'));
const TrainingHistory = lazy(() => import('./pages/TrainingHistory'));
const NutritionTracker = lazy(() => import('./pages/NutritionTracker'));
const RacePlanner = lazy(() => import('./pages/RacePlanner'));
const PersonalRecords = lazy(() => import('./pages/PersonalRecords'));
const Analytics = lazy(() => import('./pages/Analytics'));
const WeeklyReport = lazy(() => import('./pages/WeeklyReport'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  const theme = useSelector(state => state.ui.theme);
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Check if we need to seed data
    const existing = localStorage.getItem('athletos_data');
    if (!existing || Object.keys(JSON.parse(existing)).length === 0 || JSON.parse(existing).workouts?.data?.length === 0) {
       console.log('Generating seed data...');
       const seed = generateSeedData();
       dispatch(setWorkouts(seed.workouts));
       dispatch(setNutritionData(seed.nutrition));
       dispatch(setRaces(seed.races));
       dispatch(setPRs(seed.prs));
    }
  }, [dispatch]);
  
  // Set theme class on body
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  return (
    <div className={`min-h-screen bg-background text-gray-100 ${theme}`}>
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading AthletOS...</div>}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="log" element={<LogWorkout />} />
            <Route path="history" element={<TrainingHistory />} />
            <Route path="nutrition" element={<NutritionTracker />} />
            <Route path="races" element={<RacePlanner />} />
            <Route path="prs" element={<PersonalRecords />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="report" element={<WeeklyReport />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
