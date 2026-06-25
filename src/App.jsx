import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from './store/slices/authSlice';
import { fetchWorkouts } from './store/slices/workoutsSlice';
import { fetchNutritionData } from './store/slices/nutritionSlice';
import { fetchRaces } from './store/slices/racesSlice';
import { fetchPRs } from './store/slices/prsSlice';
import { fetchSettings } from './store/slices/settingsSlice';
import { fetchStravaStatus, syncStravaActivities, fetchPendingPRs } from './store/slices/stravaSlice';

// Core Authentication & Layout
import Auth from './pages/Auth';
import Layout from './components/Layout/Layout';
import AdminRoute from './components/Auth/AdminRoute';

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
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const StravaCallback = lazy(() => import('./pages/StravaCallback'));

function App() {
  const theme = useSelector(state => state.ui.theme);
  const { user, token, initialized } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  // Try to load user session on mount
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // Fetch all user module data from the database once authenticated
  useEffect(() => {
    if (user && token) {
      dispatch(fetchWorkouts());
      dispatch(fetchNutritionData());
      dispatch(fetchRaces());
      dispatch(fetchPRs());
      dispatch(fetchSettings());
      
      // Load Strava status and auto-sync if connected
      dispatch(fetchStravaStatus())
        .unwrap()
        .then((status) => {
          if (status.connected) {
            dispatch(syncStravaActivities({ isAuto: true }));
            dispatch(fetchPendingPRs());
          }
        })
        .catch((err) => console.error('Error fetching Strava status on load:', err));
    }
  }, [user, token, dispatch]);

  // Set theme class on body
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // If we haven't checked for existing tokens yet, show loading spinner
  if (!initialized) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 text-gray-100 font-sans">
        <div className="w-12 h-12 border-4 border-accent/25 border-t-accent rounded-full animate-spin mb-4" />
        <p className="font-display text-lg tracking-tight font-semibold text-gray-400">Initializing AthleteOS...</p>
      </div>
    );
  }

  // Auth Guard: Force login page if unauthenticated
  if (!user) {
    return <Auth />;
  }

  return (
    <div className={`min-h-screen bg-background text-gray-100 ${theme}`}>
      <Suspense fallback={
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0f172a] text-gray-100 font-sans">
          <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-3" />
          <p className="font-display text-sm font-medium text-gray-400">Loading module...</p>
        </div>
      }>
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
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="settings" element={<Settings />} />
            <Route path="strava/callback" element={<StravaCallback />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
