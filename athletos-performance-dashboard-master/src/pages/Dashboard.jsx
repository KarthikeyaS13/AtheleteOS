import { useSelector } from 'react-redux';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { calculateATL, calculateCTL, calculateRecoveryScore } from '../utils/calculations';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Flame, Utensils, HeartPulse, PlusCircle, Calendar as CalIcon, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { subDays, format } from 'date-fns';

const Dashboard = () => {
  const workouts = useSelector(state => state.workouts.data);
  const nutrition = useSelector(state => state.nutrition.data);
  const races = useSelector(state => state.races.data);
  const prs = useSelector(state => state.prs.data);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Calculations top row
  const todaysWorkouts = workouts.filter(w => w.date === todayStr);
  const todaysLoad = todaysWorkouts.reduce((sum, w) => sum + w.loadScore, 0);

  // Weekly Volume
  let weeklyDistance = 0;
  for (let i = 0; i < 7; i++) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
    workouts.filter(w => w.date === d).forEach(w => {
      if (w.sport === 'Running' || w.sport === 'Cycling') weeklyDistance += Number(w.distance) || 0;
    });
  }

  // Recovery
  const atl = calculateATL(workouts, new Date());
  const ctl = calculateCTL(workouts, new Date());
  const recoveryScore = calculateRecoveryScore(atl, ctl, 2); // 2 is mocked rest days

  // Nutrition mock data from store
  const todaysNutrition = nutrition[todayStr] || { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
  const totalCals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].reduce((acc, meal) => {
    return acc + (todaysNutrition[meal]?.reduce((s, item) => s + item.calories, 0) || 0);
  }, 0);

  // Recharts Data Prep
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dStr = format(d, 'yyyy-MM-dd');
    const dWorkouts = workouts.filter(w => w.date === dStr);
    let run = 0, cyc = 0, swim = 0, str = 0;
    dWorkouts.forEach(w => {
      if (w.sport === 'Running') run += w.loadScore;
      if (w.sport === 'Cycling') cyc += w.loadScore;
      if (w.sport === 'Swimming') swim += w.loadScore;
      if (w.sport === 'Strength Training') str += w.loadScore;
    });
    chartData.push({
      name: format(d, 'EEE'),
      Run: run,
      Cycle: cyc,
      Swim: swim,
      Strength: str
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-600 dark:text-white tracking-tight">Today's Snapshot</h1>
          <p className="text-gray-400">Welcome back. Here is your current status.</p>
        </div>
        <Link to="/log">
          <Button size="lg" className="shadow-accent/30 shadow-xl gap-2">
            <PlusCircle size={20} />
            Quick Log
          </Button>
        </Link>
      </div>

      {/* Top Row Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex items-center gap-4 bg-white dark:bg-[#111827] border border-transparent dark:border-[#2d3a4f] shadow-sm">
          <div className="p-3 bg-accent/20 text-accent rounded-xl">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Training Load</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold text-gray-500 dark:text-gray-400">{Math.round(todaysLoad)}</h2>
              <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">+12%</span>
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-white dark:bg-[#111827] border border-transparent dark:border-[#273244] shadow-sm ">
          <div className="p-3 bg-purple-500/20 text-purple-500 rounded-xl">
            <Flame size={24} />
          </div>
          <div className="w-full">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Weekly Volume (km)</p>
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-bold text-gray-500 dark:text-gray-400">{Math.round(weeklyDistance)}</h2>
              <span className="text-sm text-gray-500">/ 80 target</span>
            </div>
            <div className="w-full bg-surface border border-[#334155] rounded-full h-1.5 mt-2">
              <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (weeklyDistance / 80) * 100)}%` }}></div>
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-white dark:bg-[#111827] border border-transparent dark:border-[#273244] shadow-sm ">
          <div className="p-3 bg-warning/20 text-warning rounded-xl">
            <Utensils size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Nutrition (kcal)</p>
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-bold text-gray-500 dark:text-gray-400">{totalCals}</h2>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Carbs 140g | Prot 80g | Fat 40g</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-white dark:bg-[#111827] border border-transparent dark:border-[#273244] shadow-sm">
          <div className="p-3 bg-success/20 text-success rounded-xl">
            <HeartPulse size={24} />
          </div>
          <div className="w-full">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Recovery Score</p>
            <h2 className="text-3xl font-bold text-gray-500 dark:text-gray-400">{recoveryScore.toFixed(1)} <span className="text-base text-gray-500 font-normal">/ 10</span></h2>
            <div className="w-full bg-surface border border-[#334155] rounded-full h-1.5 mt-2">
              <div className="bg-success h-1.5 rounded-full" style={{ width: `${recoveryScore * 10}%` }}></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Middle Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1e293b] shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">7-Day Training Load</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRun" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCyc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="Run" stackId="1" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRun)" />
                <Area type="monotone" dataKey="Cycle" stackId="1" stroke="#22c55e" fillOpacity={1} fill="url(#colorCyc)" />
                <Area type="monotone" dataKey="Swim" stackId="1" stroke="#a855f7" fill="#a855f7" />
                <Area type="monotone" dataKey="Strength" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-1 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1e293b] shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Upcoming Races</h3>
          <div className="space-y-3 mt-4 flex-1">
            {races.slice(0, 3).map(race => {
              const daysTo = differenceInDays(new Date(race.date), new Date());

              return (
                <div
                  key={race.id}
                  className="flex items-center justify-between p-3 rounded-xl 
        bg-gray-50 dark:bg-[#1e293b] 
        border border-transparent dark:border-[#243244] 
        border-l-4 border-l-accent 
        hover:border-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg text-accent">
                      <CalIcon size={20} />
                    </div>

                    <div>
                      <p className="text-black dark:text-white font-medium">
                        {race.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {race.distance}km • Goal: {race.targetTime}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-black dark:text-white">
                      {Math.max(0, daysTo)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                      Days
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <h3 className="text-lg font-bold text-gray-800 dark:text-white mt-3 mb-1">Recent PRs</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {/* Mock display of PRs */}
            <div className="flex-shrink-0 border border-transparent dark:border-[#243244] border border-gray-400  dark:border-[#243244] rounded-xl p-3 w-40 ">
              <div className="flex items-center gap-2 text-warning mb-2"><Trophy size={16} /> <span>5K Run</span></div>
              <p className="text-xl font-bold text-gray-800 dark:text-white">00:22:30</p>
              <p className="text-xs text-success text-gray-800 dark:text-white">was 00:23:15</p>
            </div>
            <div className="flex-shrink-0 border border-transparent dark:border-[#243244] border border-gray-400 border-[#334155] rounded-xl p-3 w-40">
              <div className="flex items-center gap-2 text-warning mb-2"><Trophy size={16} /> <span>100K Cycle</span></div>
              <p className="text-xl font-bold text-gray-800 dark:text-white">03:20:00</p>
              <p className="text-xs text-gray-500">New PR!</p>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
};

// Need to import differenceInDays
import { differenceInDays } from 'date-fns';

export default Dashboard;
