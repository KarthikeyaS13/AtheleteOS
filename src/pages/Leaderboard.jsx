import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaderboard } from '../store/slices/leaderboardSlice';
import {
  Trophy,
  Flame,
  Calendar,
  Clock,
  Zap,
  Activity,
  Award,
  Crown,
  Search,
  Loader2
} from 'lucide-react';

const Leaderboard = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector(state => state.leaderboard);
  const currentUser = useSelector(state => state.auth.user);

  const [activeCategory, setActiveCategory] = useState('overall');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  // Map category to readable titles & icons
  const categories = {
    overall: { label: 'Combined Score', icon: <Crown size={16} className="text-amber-500" />, unit: 'points' },
    running: { label: 'Running Distance', icon: <Zap size={16} className="text-blue-500" />, unit: 'km' },
    cycling: { label: 'Cycling Distance', icon: <Activity size={16} className="text-emerald-500" />, unit: 'km' },
    calories: { label: 'Calories Burned', icon: <Flame size={16} className="text-rose-500" />, unit: 'kcal' },
    consistency: { label: 'Training Streak', icon: <Calendar size={16} className="text-amber-500" />, unit: 'days' },
    workoutTime: { label: 'Workout Time', icon: <Clock size={16} className="text-indigo-500" />, unit: 'hours' },
  };

  const activeList = data[activeCategory] || [];

  // Filter list by search term
  const filteredList = activeList.filter(item =>
    item.athlete.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Divide into podium (top 3) and remaining rows (index 3+)
  const podiumList = filteredList.slice(0, 3);
  const tableList = filteredList.slice(3);

  // Podium order: Silver (2nd) at index 1, Gold (1st) at index 0, Bronze (3rd) at index 2
  const sortedPodium = [];
  if (podiumList[1]) sortedPodium.push(podiumList[1]); // 2nd
  if (podiumList[0]) sortedPodium.push(podiumList[0]); // 1st
  if (podiumList[2]) sortedPodium.push(podiumList[2]); // 3rd

  const getStatValue = (item, cat) => {
    switch (cat) {
      case 'overall': return `${item.score.toLocaleString()} pts`;
      case 'running': return `${item.runningKm} km (${item.runningSessions} runs)`;
      case 'cycling': return `${item.cyclingKm} km (${item.cyclingRides} rides)`;
      case 'calories': return `${item.totalCalories.toLocaleString()} kcal`;
      case 'consistency': return `${item.streak} day streak`;
      case 'workoutTime': return `${item.workoutHours} hrs`;
      default: return '';
    }
  };

  const getTrophyBadge = (rank) => {
    switch (rank) {
      case 1: return '🥇 Gold Trophy';
      case 2: return '🥈 Silver Trophy';
      case 3: return '🥉 Bronze Trophy';
      case 4: return '🏅 Platinum';
      case 5: return '🎖 Elite';
      default: return null;
    }
  };

  if (loading && Object.values(data).every(arr => arr.length === 0)) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
        <p className="font-semibold text-lg">Loading leaderboard rankings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="text-amber-500 w-7 h-7" /> Athlete Leaderboards
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Compare metrics, track achievements, and rise through the ranks.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search athletes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 rounded-xl text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Categories Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
        {Object.entries(categories).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeCategory === key
                ? 'bg-accent/5 border-accent text-accent'
                : 'border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-850 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Podium Highlights (only show when not searching or if search matches top 3) */}
      {sortedPodium.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-3xl mx-auto pt-6 pb-2">
          {sortedPodium.map((item) => {
            const initials = item.athlete.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const isGold = item.rank === 1;
            const isSilver = item.rank === 2;
            const isBronze = item.rank === 3;
            
            // Adjust order: Silver on left, Gold in middle (larger), Bronze on right
            const orderClass = isSilver ? 'order-1 md:order-1' : isGold ? 'order-2 md:order-2 md:scale-105 z-10' : 'order-3 md:order-3';
            
            return (
              <div
                key={item.id}
                className={`flex flex-col items-center p-6 bg-white dark:bg-slate-800/60 rounded-3xl border transition-all ${orderClass} ${
                  isGold ? 'border-amber-400/80 shadow-xl shadow-amber-500/5 dark:bg-slate-800/90' :
                  isSilver ? 'border-slate-300/60 shadow-lg' :
                  'border-amber-600/40 shadow-lg'
                }`}
              >
                {/* Badge/Rank */}
                <div className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] mb-3 uppercase tracking-wider ${
                  isGold ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' :
                  isSilver ? 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400' :
                  'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-500'
                }`}>
                  {isGold ? '🏆 Champion' : isSilver ? '🥈 2nd Place' : '🥉 3rd Place'}
                </div>

                {/* Avatar */}
                <div className="relative mb-3">
                  {item.photo ? (
                    <img src={item.photo} alt={item.athlete} className="w-16 h-16 rounded-full object-cover border-2 border-accent" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-accent to-blue-500 flex items-center justify-center font-black text-white text-lg shadow-lg">
                      {initials}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-black">
                    {item.rank}
                  </div>
                </div>

                {/* Athlete name */}
                <p className="font-bold text-sm text-gray-900 dark:text-white text-center truncate w-full max-w-[150px]">
                  {item.athlete} {item.id === currentUser?.id && <span className="text-[10px] text-accent">(You)</span>}
                </p>

                {/* Value */}
                <p className="text-lg font-black text-accent mt-2">
                  {getStatValue(item, activeCategory)}
                </p>
                <p className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase mt-0.5">
                  {categories[activeCategory].label}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Table List (for index 4+) */}
      <div className="bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ranked Athletes</span>
          <span className="text-xs text-gray-400 font-semibold">{filteredList.length} total users</span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {filteredList.length > 0 ? (
            filteredList.map((item, index) => {
              const initials = item.athlete.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              const isCurrentUser = item.id === currentUser?.id;
              const trophyText = getTrophyBadge(item.rank);

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-slate-800/20 ${
                    isCurrentUser ? 'bg-accent/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-6 text-center font-bold text-xs text-gray-400">
                      {item.rank}
                    </div>

                    {/* Avatar */}
                    {item.photo ? (
                      <img src={item.photo} alt={item.athlete} className="w-9 h-9 rounded-xl object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent to-blue-500 flex items-center justify-center font-bold text-white uppercase text-xs">
                        {initials}
                      </div>
                    )}

                    {/* Name & Trophies */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900 dark:text-white text-xs">{item.athlete}</span>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent font-bold text-[8px] uppercase tracking-wide">
                            You
                          </span>
                        )}
                      </div>
                      
                      {trophyText && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 mt-0.5">
                          <Award size={10} /> {trophyText}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stat value */}
                  <div className="text-right">
                    <p className="font-black text-gray-900 dark:text-white text-sm">
                      {getStatValue(item, activeCategory)}
                    </p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mt-0.5">
                      {categories[activeCategory].unit}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-400 text-xs">
              No athletes found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
