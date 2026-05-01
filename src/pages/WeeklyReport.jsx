import { useSelector } from 'react-redux';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { format, subDays } from 'date-fns';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';

const WeeklyReport = () => {
   const workouts = useSelector(state => state.workouts.data);
   const settings = useSelector(state => state.settings);

   const today = new Date();
   const weekAgo = subDays(today, 7);
   const weekStartStr = format(weekAgo, 'yyyy-MM-dd');

   const weeklyWorkouts = workouts.filter(w => w.date >= weekStartStr);
   const totalLoad = weeklyWorkouts.reduce((sum, w) => sum + (w.loadScore || 0), 0);

   return (
      <div className="space-y-6 max-w-4xl mx-auto">

         {/* Header */}
         <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
               Weekly Report
            </h1>
            <p className="text-gray-700 dark:text-gray-400 mt-1">
               Summary of your last 7 days of training.
            </p>
         </div>

         {/* Summary */}
         <Card className="flex flex-col md:flex-row justify-between items-start md:items-center p-8
         bg-white dark:bg-[#111827]
         border border-gray-200 dark:border-[#243244]">

            <div>
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Week ending {format(today, 'MMM d, yyyy')}
               </h2>

               <div className="flex gap-4 mt-4">

                  <div>
                     <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-bold">
                        Total Sessions
                     </p>
                     <p className="text-3xl font-bold text-accent">
                        {weeklyWorkouts.length}
                     </p>
                  </div>

                  <div className="w-px bg-gray-200 dark:bg-[#243244]"></div>

                  <div>
                     <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-bold">
                        Total Load
                     </p>
                     <p className="text-3xl font-bold text-success">
                        {Math.round(totalLoad)}
                     </p>
                  </div>

               </div>
            </div>

            <div className="mt-8 md:mt-0 flex flex-col sm:flex-row gap-4">
               <Button size="lg" className="bg-danger hover:bg-danger/90">
                  <FileText size={18} className="mr-2" />
                  Export PDF
               </Button>

               <Button size="lg" className="bg-success hover:bg-success/90">
                  <Download size={18} className="mr-2" />
                  Export Excel
               </Button>
            </div>
         </Card>

         {/* Workout Log */}
         <h3 className="text-gray-900 dark:text-white font-bold text-xl mt-8 mb-4">
            Workout Log
         </h3>

         <div className="space-y-4">
            {weeklyWorkouts.map(w => (
               <div
                  key={w.id}
                  className="flex justify-between items-center p-4 rounded-xl
                  bg-white dark:bg-[#111827]
                  border border-gray-200 dark:border-[#243244]
                  hover:border-accent transition-colors"
               >

                  <div>
                     <p className="font-bold text-gray-900 dark:text-white mb-1">
                        {w.sport} - {w.type}
                     </p>

                     <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(w.date), 'MMM d')} • {w.distance ? w.distance + 'km' : ''} {w.duration}
                     </p>
                  </div>

                  <div className="text-right border-l border-gray-200 dark:border-[#243244] pl-4">
                     <p className="text-sm text-gray-600 dark:text-gray-400">
                        Load
                     </p>
                     <p className="font-bold text-accent text-lg">
                        {w.loadScore}
                     </p>
                  </div>

               </div>
            ))}

            {weeklyWorkouts.length === 0 && (
               <p className="text-gray-500 dark:text-gray-400 italic">
                  No workouts found for this period.
               </p>
            )}
         </div>

      </div>
   );
};

export default WeeklyReport;