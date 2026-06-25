import { useSelector } from 'react-redux';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { calculateATL, calculateCTL, calculateRecoveryScore } from '../utils/calculations';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Flame, Utensils, HeartPulse, PlusCircle, Calendar as CalIcon, Trophy, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { subDays, format, differenceInDays } from 'date-fns';

const Dashboard = () => {
  const workouts = useSelector(state => state.workouts.data);
  const nutrition = useSelector(state => state.nutrition.data);
  const races = useSelector(state => state.races.data);
  const prs = useSelector(state => state.prs.data);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Logic remains untouched
  const todaysWorkouts = workouts.filter(w => w.date === todayStr);
  const todaysLoad = todaysWorkouts.reduce((sum, w) => sum + w.loadScore, 0);

  let weeklyDistance = 0;
  for (let i = 0; i < 7; i++) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
    workouts.filter(w => w.date === d).forEach(w => {
      if (w.sport === 'Running' || w.sport === 'Cycling') weeklyDistance += Number(w.distance) || 0;
    });
  }

  const atl = calculateATL(workouts, new Date());
  const ctl = calculateCTL(workouts, new Date());
  const recoveryScore = calculateRecoveryScore(atl, ctl, 2);

  const todaysNutrition = nutrition[todayStr] || { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
  const totalCals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].reduce((acc, meal) => {
    return acc + (todaysNutrition[meal]?.reduce((s, item) => s + item.calories, 0) || 0);
  }, 0);

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
    <div className="space-y-5 pb-5">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in slide-up">
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-accent rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          <h1 className="text-3xl font-black text-gray-900 dark:text-white font-display tracking-tight italic uppercase">
            Today's Snapshot
          </h1>
          <p className="text-gray-500 font-medium ml-1 mt-1 text-sm">Welcome back, Athlete. Here's your performance data.</p>
        </div>
        <Link to="/log">
          <Button size="sm" className="px-6 shadow-xl hover:scale-105 transition-transform">
            <PlusCircle size={18} className="mr-2" />
            Quick Log
          </Button>
        </Link>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Training Load', val: Math.round(todaysLoad), icon: <Activity />, color: 'accent', trend: '+12%' },
          { label: 'Weekly Volume', val: `${Math.round(weeklyDistance)}km`, icon: <Flame />, color: 'purple-500', sub: '/ 80km target', progress: (weeklyDistance / 80) * 100 },
          { label: 'Nutrition', val: `${totalCals}kcal`, icon: <Utensils />, color: 'warning', sub: 'Balanced Macros' },
          { label: 'Recovery', val: recoveryScore.toFixed(1), icon: <HeartPulse />, color: 'success', sub: '/ 10 score', progress: recoveryScore * 10 }
        ].map((stat, i) => (
          <Card key={i} className="flex flex-col p-4 h-full" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex justify-between items-start mb-2">
              <div className={`p-2 rounded-xl bg-${stat.color}/10 text-${stat.color} shadow-inner`}>
                {stat.icon}
              </div>
              {stat.trend && (
                <span className="flex items-center gap-1 text-[10px] font-black text-success bg-success/10 px-2 py-0.5 rounded-lg border border-success/20">
                  <TrendingUp size={10} /> {stat.trend}
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white font-display italic">{stat.val}</h2>
              {stat.sub && <span className="text-[10px] text-gray-400 font-medium">{stat.sub}</span>}
            </div>
            
            {stat.progress !== undefined && (
              <div className="mt-2.5 w-full bg-gray-100 dark:bg-gray-800/50 rounded-full h-1.5 overflow-hidden shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out bg-${stat.color}`}
                  style={{ width: `${Math.min(100, stat.progress)}%` }}
                />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Load Chart */}
        <Card className="lg:col-span-8 p-4 overflow-hidden" style={{ animationDelay: '400ms' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black text-gray-900 dark:text-white font-display italic uppercase tracking-tight">Performance Trends</h3>
            <div className="flex gap-3">
               {['Run', 'Cycle', 'Swim', 'Strength'].map((s, i) => (
                 <div key={i} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full bg-${i === 0 ? 'accent' : i === 1 ? 'success' : i === 2 ? 'purple-500' : 'warning'}`} />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{s}</span>
                 </div>
               ))}
            </div>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRun" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCyc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" dark:stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: 'none', 
                    borderRadius: '16px', 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Area type="monotone" dataKey="Run" stackId="1" stroke="#3b82f6" strokeWidth={3} fill="url(#gradRun)" />
                <Area type="monotone" dataKey="Cycle" stackId="1" stroke="#22c55e" strokeWidth={3} fill="url(#gradCyc)" />
                <Area type="monotone" dataKey="Swim" stackId="1" stroke="#a855f7" strokeWidth={3} fillOpacity={0.1} fill="#a855f7" />
                <Area type="monotone" dataKey="Strength" stackId="1" stroke="#f59e0b" strokeWidth={3} fillOpacity={0.1} fill="#f59e0b" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Races & PRs */}
        <div className="lg:col-span-4 space-y-4">
           <Card className="p-4" style={{ animationDelay: '500ms' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-gray-900 dark:text-white font-display italic uppercase tracking-tight">Race Clock</h3>
                <CalIcon size={18} className="text-accent" />
              </div>
              <div className="space-y-2">
                {races.slice(0, 3).map((race, i) => {
                  const daysTo = differenceInDays(new Date(race.date), new Date());
                  return (
                    <div key={race.id} className="group py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-transparent hover:border-accent/30 transition-all">
                      <div className="flex justify-between items-center">
                         <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{race.name}</p>
                            <p className="text-[10px] font-black text-accent uppercase tracking-widest">{race.distance}KM • {race.targetTime}</p>
                         </div>
                         <div className="text-right">
                            <span className="text-xl font-black text-gray-900 dark:text-white italic">{Math.max(0, daysTo)}</span>
                            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">Days Left</p>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
           </Card>

           <Card className="p-4 bg-gradient-to-br from-accent/5 to-purple-500/5" style={{ animationDelay: '600ms' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-gray-900 dark:text-white font-display italic uppercase tracking-tight">Hall of Fame</h3>
                <Trophy size={18} className="text-warning" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                 {[
                   { label: '5K Run', val: '22:30', sub: 'was 23:15', up: true },
                   { label: '100K Cycle', val: '3:20:00', sub: 'New PR!' }
                 ].map((pr, i) => (
                   <div key={i} className="p-3 rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{pr.label}</p>
                      <p className="text-lg font-black text-gray-900 dark:text-white italic">{pr.val}</p>
                      <p className={`text-[9px] font-bold ${pr.up ? 'text-success' : 'text-accent'}`}>{pr.sub}</p>
                   </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
