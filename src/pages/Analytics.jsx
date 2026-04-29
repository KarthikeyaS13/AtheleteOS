import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Card } from '../components/UI/Card';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { subDays, format, parseISO } from 'date-fns';
import { calculateATL, calculateCTL } from '../utils/calculations';

const COLORS = {
  Running: '#3b82f6',
  Cycling: '#22c55e',
  Swimming: '#a855f7',
  'Strength Training': '#f59e0b'
};

const Analytics = () => {
  const workouts = useSelector(state => state.workouts.data);

  // 1. Training Load Over Time (ATL vs CTL) 30 days
  const loadData = useMemo(() => {
    const data = [];
    for(let i=30; i>=0; i--) {
      const d = subDays(new Date(), i);
      const atl = calculateATL(workouts, d);
      const ctl = calculateCTL(workouts, d);
      data.push({
        date: format(d, 'MMM dd'),
        ATL: Math.round(atl),
        CTL: Math.round(ctl)
      });
    }
    return data;
  }, [workouts]);

  // 2. Sport Distribution (last 30 days)
  const distData = useMemo(() => {
     let counts = { Running: 0, Cycling: 0, Swimming: 0, 'Strength Training': 0 };
     const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
     workouts.filter(w => w.date >= thirtyDaysAgo).forEach(w => {
        if(counts[w.sport] !== undefined) counts[w.sport]++;
     });
     return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).filter(d => d.value > 0);
  }, [workouts]);

  // 3. Volume progression (Last 12 weeks mock - using days to keep it simple but visually appealing)
  const volData = useMemo(() => {
     const data = [];
     for(let i=12; i>=0; i--) {
        const start = subDays(new Date(), i*7 + 7).toISOString();
        const end = subDays(new Date(), i*7).toISOString();
        let runKm = 0, cycKm = 0;
        workouts.filter(w => w.date >= start && w.date < end).forEach(w => {
           if(w.sport === 'Running') runKm += Number(w.distance);
           if(w.sport === 'Cycling') cycKm += (Number(w.distance) / 3); // Normalize cycling volume somewhat
        });
        data.push({
           week: `W-${i}`,
           Running: Math.round(runKm),
           CyclingNormalized: Math.round(cycKm)
        });
     }
     return data;
  }, [workouts]);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-gray-400 mt-1">Deep dive into your performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* ATL vs CTL Chart */}
         <Card className="col-span-1 lg:col-span-2">
            <h3 className="text-lg font-bold text-white mb-6">Fitness & Fatigue (CTL vs ATL) - 30 Days</h3>
            <div className="h-80 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={loadData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                     <XAxis dataKey="date" stroke="#94a3b8" />
                     <YAxis stroke="#94a3b8" />
                     <ReTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                     <Legend />
                     <Area type="monotone" dataKey="CTL" name="Fitness (CTL)" stroke="#3b82f6" fillOpacity={0.2} fill="#3b82f6" strokeWidth={3} />
                     <Area type="monotone" dataKey="ATL" name="Fatigue (ATL)" stroke="#ef4444" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </Card>

         {/* Sport Distribution */}
         <Card className="col-span-1 flex flex-col items-center">
            <h3 className="text-lg font-bold text-white mb-2 self-start w-full">Activity Mix (Last 30 Days)</h3>
            <div className="h-64 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={distData}
                        cx="50%" cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                     >
                        {distData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#ffffff'} />
                        ))}
                     </Pie>
                     <ReTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                     <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </Card>

         {/* Volume Progression */}
         <Card className="col-span-1">
            <h3 className="text-lg font-bold text-white mb-6">Volume Progression (Weekly)</h3>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                     <XAxis dataKey="week" stroke="#94a3b8" />
                     <YAxis stroke="#94a3b8" />
                     <ReTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                     <Legend />
                     <Bar dataKey="Running" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                     <Bar dataKey="CyclingNormalized" name="Cycling (Equiv)" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </Card>
      </div>
    </div>
  );
};

export default Analytics;
