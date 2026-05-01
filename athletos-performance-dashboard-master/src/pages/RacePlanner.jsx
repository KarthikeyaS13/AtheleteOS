import { useSelector } from 'react-redux';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { differenceInDays, format, parseISO } from 'date-fns';
import { Calendar, Flag, Timer } from 'lucide-react';

const RacePlanner = () => {
   const races = useSelector(state => state.races.data);

   return (
      <div className="space-y-6">

         {/* Header */}
         <div className="flex justify-between items-center mb-8">
            <div>
               <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Race Planner
               </h1>
               <p className="text-gray-700 dark:text-gray-400 mt-1">
                  Countdown to glory. Map out your season.
               </p>
            </div>
            <Button>Add Race</Button>
         </div>

         {/* Cards */}
         <div className="space-y-6">
            {races.map((race, index) => {
               const daysTo = differenceInDays(parseISO(race.date), new Date());
               const isNext = index === 0 && daysTo > 0;

               return (
                  <Card
                     key={race.id}
                     className={`flex flex-col md:flex-row relative overflow-hidden
                     bg-white dark:bg-[#111827]
                     border border-gray-200 dark:border-[#243244]
                     shadow-md dark:shadow-none
                     ${isNext ? 'border-accent border-2 shadow-accent/10' : ''}`}
                  >

                     {/* NEXT badge */}
                     {isNext && (
                        <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                           NEXT UP
                        </div>
                     )}

                     {/* Left */}
                     <div className="flex-1 md:pr-8">

                        <div className="flex items-center gap-2 mb-2">
                           <span className="bg-gray-100 dark:bg-[#1e293b] border border-gray-200 dark:border-[#243244] text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-md">
                              {race.type}
                           </span>
                           <span className="bg-gray-100 dark:bg-[#1e293b] border border-gray-200 dark:border-[#243244] text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-md">
                              {race.distance}km
                           </span>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                           {race.name}
                        </h2>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                           <div className="flex items-center gap-1">
                              <Calendar size={16} /> {format(parseISO(race.date), 'MMMM d, yyyy')}
                           </div>
                           <div className="flex items-center gap-1">
                              <Timer size={16} /> Target: {race.targetTime}
                           </div>
                        </div>
                     </div>

                     {/* Right */}
                     <div className="mt-6 md:mt-0 md:ml-auto md:w-48 flex-shrink-0
                        bg-gray-50 dark:bg-[#1e293b]
                        rounded-xl flex flex-col items-center justify-center p-6
                        border border-gray-200 dark:border-[#243244]">

                        {daysTo >= 0 ? (
                           <>
                              <span className="text-4xl font-bold text-accent">
                                 {daysTo}
                              </span>
                              <span className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">
                                 Days to go
                              </span>
                           </>
                        ) : (
                           <>
                              <span className="text-success font-bold flex items-center gap-2">
                                 <Flag size={20} /> Completed
                              </span>
                           </>
                        )}
                     </div>

                  </Card>
               );
            })}
         </div>
      </div>
   );
};

export default RacePlanner;