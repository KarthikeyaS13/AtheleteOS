import { useState } from "react";
import { api } from "../utils/api";
import { useSelector, useDispatch } from "react-redux";
import { Card } from "../components/UI/Card";
import { Button } from "../components/UI/Button";
import { format, parseISO } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
   addNutritionEntry,
   removeNutritionEntry,
   updateHydration,
} from "../store/slices/nutritionSlice";
import { PlusCircle, Trash2, Droplets, CalendarIcon } from "lucide-react";

const NutritionTracker = () => {
   const dispatch = useDispatch();
   const todayStr = format(new Date(), "yyyy-MM-dd");
   const [selectedDate, setSelectedDate] = useState(todayStr);
   const nutritionStore = useSelector((state) => state.nutrition.data);
   const targets = useSelector((state) => state.settings.targets);

   const dailyData = nutritionStore[selectedDate] || {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snacks: [],
      hydration: 0,
   };
   const [selectMeal, setSelectMeal] = useState(null)
   const [showModal, setShowModal] = useState(false);
   const [foodInput, setFoodInput] = useState({
      name: '',
      type: '',
      grams: 100
   })


   const foodDB = {
      rice: {
         cooked: { calories: 130, protein: 2.5, carbs: 28, fat: 0.3 },
         raw: { calories: 360, protein: 7, carbs: 78, fat: 1 },
      },
      chicken: {
         cooked: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
         raw: { calories: 120, protein: 21, carbs: 0, fat: 3 },
      },
      egg: {
         cooked: { calories: 155, protein: 13, carbs: 1, fat: 11 },
         raw: { calories: 155, protein: 13, carbs: 1, fat: 11 },
      },
      roti: {
         cooked: { calories: 120, protein: 3, carbs: 20, fat: 3 },
         raw: { calories: 300, protein: 8, carbs: 60, fat: 5 },
      },
   };

   const getLocalNutrition = (food, type, grams) => {
      const item = foodDB[food]?.[type];
      if (!item) return null;

      const factor = grams / 100;

      return {
         calories: Math.round(item.calories * factor),
         protein: Math.round(item.protein * factor),
         carbs: Math.round(item.carbs * factor),
         fat: Math.round(item.fat * factor),
      };
   };

   const fetchNutrition = async (food, grams) => {
      try {
         const data = await api.get(`/nutrition/proxy?food=${encodeURIComponent(food)}&grams=${grams}`);

         if (!data || data.calories === 0) return null;

         return {
            calories: Math.round(data.calories),
            protein: Math.round(data.totalNutrients?.PROCNT?.quantity || 0),
            carbs: Math.round(data.totalNutrients?.CHOCDF?.quantity || 0),
            fat: Math.round(data.totalNutrients?.FAT?.quantity || 0),
         };
      } catch (e) {
         console.error(e);
         return null;
      }
   };

   const getNutritionHybrid = async (food, type, grams) => {
      // 1. Try local DB
      const local = getLocalNutrition(food, type, grams);
      if (local && local.calories > 0) return local;

      // 2. Fallback to API
      const apiData = await fetchNutrition(`${food} ${type}`, grams);

      // FIX: reject bad API responses
      if (apiData && apiData.calories > 0) return apiData;

      // 3. Final fallback (never return 0)
      return {
         calories: Math.round(grams * 1.2), // basic estimation
         protein: Math.round(grams * 0.05),
         carbs: Math.round(grams * 0.15),
         fat: Math.round(grams * 0.03),
      };
   };

   const calculateTotals = () => {
      let cals = 0,
         p = 0,
         c = 0,
         f = 0;
      ["Breakfast", "Lunch", "Dinner", "Snacks"].forEach((m) => {
         dailyData[m].forEach((item) => {
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
      { name: "Protein", value: totals.p * 4, color: "#3b82f6" },
      { name: "Carbs", value: totals.c * 4, color: "#22c55e" },
      { name: "Fat", value: totals.f * 9, color: "#f59e0b" },
   ];
   if (totals.cals === 0)
      macroData.push({ name: "Empty", value: 1, color: "#334155" });

   // const handleAddFood = async (meal) => {
   //    const name = prompt("Enter food (rice, chicken, etc):");
   //    if (!name) return;

   //    const type = prompt("Raw or cooked?");
   //    if (!type) return;

   //    const grams = Number(prompt("Enter grams:")) || 100;

   //    const nutrition = await getNutritionHybrid(
   //       name.toLowerCase(),
   //       type.toLowerCase(),
   //       grams,
   //    );

   //    const newItem = {
   //       id: Math.random().toString(36).substr(2, 9),
   //       name: `${name} (${type})`,
   //       quantity: grams,
   //       unit: "g",
   //       ...nutrition,
   //    };

   //    dispatch(addNutritionEntry({ date: selectedDate, meal, item: newItem }));
   // };

   return (
      <div className="space-y-4">
         {/* Header */}
         <div className="flex justify-between items-center animate-in fade-in slide-up">
            <div className="relative">
               <div className="absolute -left-4 top-0 w-1 h-full bg-accent rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
               <h1 className="text-3xl font-black text-gray-900 dark:text-white font-display tracking-tight italic uppercase">
                  Nutrition
               </h1>
               <div className="flex items-center gap-4 animate-in fade-in slide-up" style={{ animationDelay: '100ms' }}>
               <DatePicker
                  selected={parseISO(selectedDate)}
                  onChange={(date) => setSelectedDate(date ? format(date, 'yyyy-MM-dd') : todayStr)}
                  dateFormat="dd/MM/yyyy"
                  className="bg-white dark:bg-[#111827] border-2 border-gray-300 dark:border-[#243244] rounded-xl px-4 py-2 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-accent transition-all w-48 shadow-sm text-sm"
                  placeholderText="DD/MM/YYYY"
               />
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Macros Panel */}
            <Card className="col-span-1 flex flex-col items-center justify-center py-4 px-2">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 self-start w-full px-4">
                  Daily Targets
               </h3>

               <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={macroData}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={2}
                           dataKey="value"
                           stroke="none"
                        >
                           {macroData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                           ))}
                        </Pie>
                     </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {totals.cals}
                     </span>
                     <span className="text-xs text-gray-500 dark:text-gray-400">
                        / {targets.dailyCalories} kcal
                     </span>
                  </div>
               </div>

               <div className="w-full px-4 space-y-2 mt-4">
                  {[
                     {
                        label: "Protein",
                        value: totals.p,
                        target: targets.dailyProtein,
                        color: "#3b82f6",
                     },
                     {
                        label: "Carbs",
                        value: totals.c,
                        target: targets.dailyCarbs,
                        color: "#22c55e",
                     },
                     {
                        label: "Fat",
                        value: totals.f,
                        target: targets.dailyFat,
                        color: "#f59e0b",
                     },
                  ].map((item, i) => (
                     <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                           <span style={{ color: item.color }} className="font-medium">
                              {item.label}
                           </span>
                           <span className="text-gray-900 dark:text-white">
                              {item.value}g / {item.target}g
                           </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-[#243244] h-1.5 rounded-full">
                           <div
                              className="h-1.5 rounded-full"
                              style={{
                                 width: `${Math.min(100, (item.value / item.target) * 100)}%`,
                                 backgroundColor: item.color,
                              }}
                           />
                        </div>
                     </div>
                  ))}
               </div>

               <div className="w-full px-4 mt-5">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                     <Droplets size={16} className="text-accent" />
                     Hydration ({dailyData.hydration}/{targets.dailyWater})
                  </h4>

                  <div className="flex gap-1">
                     {[...Array(targets.dailyWater)].map((_, i) => (
                        <button
                           key={i}
                           onClick={() =>
                              dispatch(
                                 updateHydration({ date: selectedDate, quantity: i + 1 }),
                              )
                           }
                           className={`flex-1 h-8 rounded-md transition-all ${i < dailyData.hydration
                              ? "bg-accent shadow-lg shadow-accent/20"
                              : "bg-gray-200 dark:bg-[#243244] hover:bg-accent/50"
                              }`}
                        />
                     ))}
                  </div>
               </div>
            </Card>

            {/* Meals */}
            <div className="col-span-2 space-y-2.5">
               {["Breakfast", "Lunch", "Dinner", "Snacks"].map((meal) => (
                  <Card
                     key={meal}
                     className="p-0 overflow-hidden"
                  >
                     <div className="py-2 px-3 bg-gray-50/50 dark:bg-[#1e293b]/50 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">
                           {meal}
                        </h3>
                        <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => {
                              setSelectMeal(meal);
                              setShowModal(true);
                           }}
                        >
                           <PlusCircle size={16} className="mr-1" /> Add Food
                        </Button>
                     </div>


                     <div className="py-2 px-3 space-y-2">
                        {dailyData[meal].length === 0 ? (
                           <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center py-1">
                              No food logged yet.
                           </p>
                        ) : (
                           dailyData[meal].map((item) => (
                              <div
                                 key={item.id}
                                 className="flex justify-between items-center group"
                              >
                                 <div>
                                    <p className="text-gray-900 dark:text-white font-medium text-sm">
                                       {item.name}
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                       {item.quantity} {item.unit} • {item.protein}P /{" "}
                                       {item.carbs}C / {item.fat}F
                                    </p>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <span className="font-bold text-accent text-sm">
                                       {item.calories}{" "}
                                       <span className="text-[10px] text-gray-500 font-normal">kcal</span>
                                    </span>
                                    <button
                                       onClick={() =>
                                          dispatch(
                                             removeNutritionEntry({
                                                date: selectedDate,
                                                meal,
                                                itemId: item.id,
                                             }),
                                          )
                                       }
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
         {
            showModal && (
               <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
                  <Card className="max-w-md w-full mx-4 p-8 shadow-2xl transform animate-in zoom-in-95 duration-300">
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add {selectMeal}</h2>
                        <button 
                           onClick={() => setShowModal(false)}
                           className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                           <Trash2 size={20} />
                        </button>
                     </div>

                     <div className="space-y-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Food Name</label>
                           <input
                              placeholder="e.g. Chicken breast"
                              className="w-full bg-gray-50 dark:bg-[#1e293b] border border-gray-300 dark:border-[#243244] rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none"
                              value={foodInput.name}
                              onChange={(e) =>
                                 setFoodInput({ ...foodInput, name: e.target.value })
                              }
                           />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                              <select
                                 className="w-full bg-gray-50 dark:bg-[#1e293b] border border-gray-300 dark:border-[#243244] rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none"
                                 value={foodInput.type}
                                 onChange={(e) =>
                                    setFoodInput({ ...foodInput, type: e.target.value })
                                 }
                              >
                                 <option value="">Select type</option>
                                 <option value="raw">Raw</option>
                                 <option value="cooked">Cooked</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grams</label>
                              <input
                                 type="number"
                                 className="w-full bg-gray-50 dark:bg-[#1e293b] border border-gray-300 dark:border-[#243244] rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none"
                                 value={foodInput.grams}
                                 onChange={(e) =>
                                    setFoodInput({ ...foodInput, grams: Number(e.target.value) })
                                 }
                              />
                           </div>
                        </div>

                        <div className="pt-4">
                           <Button
                              className="w-full py-3 text-lg"
                              onClick={async () => {
                                 const nutrition = await getNutritionHybrid(
                                    foodInput.name.toLowerCase(),
                                    foodInput.type.toLowerCase(),
                                    foodInput.grams
                                 );

                                 const newItem = {
                                    id: Math.random().toString(36).substr(2, 9),
                                    name: `${foodInput.name} (${foodInput.type})`,
                                    quantity: foodInput.grams,
                                    unit: "g",
                                    ...nutrition,
                                 };

                                 dispatch(addNutritionEntry({ date: selectedDate, meal: selectMeal, item: newItem }));
                                 setShowModal(false);
                                 setFoodInput({ name: '', type: '', grams: 100 });
                              }}
                           >
                              Add Food Entry
                           </Button>
                        </div>
                     </div>
                  </Card>
               </div>
            )
         }

      </div>
   );
};

export default NutritionTracker;