import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { addNutritionEntry, removeNutritionEntry, updateHydration } from '../store/slices/nutritionSlice';
import { PlusCircle, Trash2, Droplets } from 'lucide-react';

const NutritionTracker = () => {
   const dispatch = useDispatch();
   const todayStr = format(new Date(), 'yyyy-MM-dd');
   const [selectedDate, setSelectedDate] = useState(todayStr);
   const nutritionStore = useSelector(state => state.nutrition.data);
   const targets = useSelector(state => state.settings.targets);

   const dailyData = nutritionStore[selectedDate] || { Breakfast: [], Lunch: [], Dinner: [], Snacks: [], hydration: 0 };

   const calculateTotals = () => {
      let cals = 0, p = 0, c = 0, f = 0;
      ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].forEach(m => {
         dailyData[m].forEach(item => {
            cals += item.calories || 0;
            p += item.protein || 0;
            c += item.carbs || 0;
            f += item.fat || 0;
         });
      });
      return { cals, p, c, f };
   };

   const totals = calculateTotals();

   const macroData = [
      { name: 'Protein', value: totals.p * 4, color: '#3b82f6' },
      { name: 'Carbs', value: totals.c * 4, color: '#22c55e' },
      { name: 'Fat', value: totals.f * 9, color: '#f59e0b' },
   ];
   if (totals.cals === 0) macroData.push({ name: 'Empty', value: 1, color: '#334155' });

   const handleAddFood = (meal) => {
      const newItem = {
         id: Math.random().toString(36).substr(2, 9),
         name: 'Custom Food Item',
         quantity: 1,
         unit: 'serving',
         calories: 250,
         protein: 15,
         carbs: 25,
         fat: 10
      };
      dispatch(addNutritionEntry({ date: selectedDate, meal, item: newItem }));
   };

   return (
      <div className="space-y-6">

         {/* Header */}
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Nutrition</h1>
               <p className="text-gray-700 dark:text-gray-400 mt-1">Fuel for your performance.</p>
            </div>
            <input
               type="date"
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
               className="bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#243244] rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-accent shadow-sm"
            />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Macros Panel */}
            <Card className="col-span-1 flex flex-col items-center justify-center py-8 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244] shadow-md dark:shadow-none">

               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 self-start w-full px-4">
                  Daily Targets
               </h3>

               <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie data={macroData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                           {macroData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                           ))}
                        </Pie>
                     </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-2xl font-bold text-gray-900 dark:text-white">{totals.cals}</span>
                     <span className="text-xs text-gray-500 dark:text-gray-400">/ {targets.dailyCalories} kcal</span>
                  </div>
               </div>

               <div className="w-full px-6 space-y-4 mt-6">
                  {[
                     { label: "Protein", value: totals.p, target: targets.dailyProtein, color: "#3b82f6" },
                     { label: "Carbs", value: totals.c, target: targets.dailyCarbs, color: "#22c55e" },
                     { label: "Fat", value: totals.f, target: targets.dailyFat, color: "#f59e0b" },
                  ].map((item, i) => (
                     <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                           <span style={{ color: item.color }} className="font-medium">{item.label}</span>
                           <span className="text-gray-900 dark:text-white">
                              {item.value}g / {item.target}g
                           </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-[#243244] h-1.5 rounded-full">
                           <div
                              className="h-1.5 rounded-full"
                              style={{
                                 width: `${Math.min(100, (item.value / item.target) * 100)}%`,
                                 backgroundColor: item.color
                              }}
                           />
                        </div>
                     </div>
                  ))}
               </div>

               <div className="w-full px-6 mt-8">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                     <Droplets size={16} className="text-accent" />
                     Hydration ({dailyData.hydration}/{targets.dailyWater})
                  </h4>

                  <div className="flex gap-1">
                     {[...Array(targets.dailyWater)].map((_, i) => (
                        <button
                           key={i}
                           onClick={() => dispatch(updateHydration({ date: selectedDate, quantity: i + 1 }))}
                           className={`flex-1 h-8 rounded-md transition-all ${i < dailyData.hydration
                                 ? 'bg-accent shadow-lg shadow-accent/20'
                                 : 'bg-gray-200 dark:bg-[#243244] hover:bg-accent/50'
                              }`}
                        />
                     ))}
                  </div>
               </div>
            </Card>

            {/* Meals */}
            <div className="col-span-2 space-y-4">
               {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(meal => (
                  <Card key={meal} className="p-0 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#243244] shadow-md dark:shadow-none">

                     <div className="p-4 bg-gray-50 dark:bg-[#1e293b] border-b border-gray-200 dark:border-[#243244] flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{meal}</h3>
                        <Button variant="ghost" size="sm" onClick={() => handleAddFood(meal)}>
                           <PlusCircle size={16} className="mr-1" /> Add Food
                        </Button>
                     </div>

                     <div className="p-4 space-y-2">
                        {dailyData[meal].length === 0 ? (
                           <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-2">
                              No food logged yet.
                           </p>
                        ) : (
                           dailyData[meal].map(item => (
                              <div key={item.id} className="flex justify-between items-center group">
                                 <div>
                                    <p className="text-gray-900 dark:text-white font-medium">{item.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                       {item.quantity} {item.unit} • {item.protein}P / {item.carbs}C / {item.fat}F
                                    </p>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <span className="font-bold text-accent">
                                       {item.calories} <span className="text-xs text-gray-500">kcal</span>
                                    </span>
                                    <button
                                       onClick={() => dispatch(removeNutritionEntry({ date: selectedDate, meal, itemId: item.id }))}
                                       className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-danger transition-all"
                                    >
                                       <Trash2 size={16} />
                                    </button>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>

                  </Card>
               ))}
            </div>

         </div>
      </div>
   );
};

export default NutritionTracker;