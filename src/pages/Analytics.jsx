import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Card } from '../components/UI/Card';
import {
   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
   PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { subDays, format } from 'date-fns';
import { calculateATL, calculateCTL } from '../utils/calculations';

const COLORS = {
   Running: '#3b82f6',
   Cycling: '#22c55e',
   Swimming: '#a855f7',
   'Strength Training': '#f59e0b'
};

const Analytics = () => {
   const workouts = useSelector(state => state.workouts.data);

   const loadData = useMemo(() => {
      const data = [];
      for (let i = 30; i >= 0; i--) {
         const d = subDays(new Date(), i);
         data.push({
            date: format(d, 'MMM dd'),
            ATL: Math.round(calculateATL(workouts, d)),
            CTL: Math.round(calculateCTL(workouts, d))
         });
      }
      return data;
   }, [workouts]);

   const distData = useMemo(() => {
      let counts = { Running: 0, Cycling: 0, Swimming: 0, 'Strength Training': 0 };
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      workouts.filter(w => w.date >= thirtyDaysAgo).forEach(w => {
         if (counts[w.sport] !== undefined) counts[w.sport]++;
      });
      return Object.keys(counts)
         .map(key => ({ name: key, value: counts[key] }))
         .filter(d => d.value > 0);
   }, [workouts]);

   const volData = useMemo(() => {
      const data = [];
      for (let i = 12; i >= 0; i--) {
         const start = subDays(new Date(), i * 7 + 7).toISOString();
         const end = subDays(new Date(), i * 7).toISOString();

         let runKm = 0, cycKm = 0;

         workouts.filter(w => w.date >= start && w.date < end).forEach(w => {
            if (w.sport === 'Running') runKm += Number(w.distance);
            if (w.sport === 'Cycling') cycKm += (Number(w.distance) / 3);
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

         {/* Header */}
         <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
               Analytics
            </h1>
            <p className="text-gray-700 dark:text-gray-400 mt-1">
               Deep dive into your performance metrics.
            </p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ATL vs CTL */}
            <Card className="col-span-2 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244]">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                  Fitness & Fatigue (CTL vs ATL)
               </h3>

               <div className="h-80">
                  <ResponsiveContainer>
                     <AreaChart data={loadData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <ReTooltip
                           contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              color: '#000'
                           }}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="CTL" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                        <Area type="monotone" dataKey="ATL" stroke="#ef4444" strokeDasharray="5 5" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </Card>

            {/* Pie */}
            <Card className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244]">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Activity Mix
               </h3>

               <div className="h-64">
                  <ResponsiveContainer>
                     <PieChart>
                        <Pie data={distData} dataKey="value" innerRadius={60} outerRadius={90}>
                           {distData.map((entry, i) => (
                              <Cell key={i} fill={COLORS[entry.name]} />
                           ))}
                        </Pie>
                        <ReTooltip
                           contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              color: '#000'
                           }}
                        />
                        <Legend />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
            </Card>

            {/* Bar */}
            <Card className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244]">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Weekly Volume
               </h3>

               <div className="h-64">
                  <ResponsiveContainer>
                     <BarChart data={volData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="week" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <ReTooltip
                           contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              color: '#000'
                           }}
                        />
                        <Legend />
                        <Bar dataKey="Running" fill="#3b82f6" />
                        <Bar dataKey="CyclingNormalized" fill="#22c55e" />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </Card>

         </div>
      </div>
   );
};

export default Analytics;