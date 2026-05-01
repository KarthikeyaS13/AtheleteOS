import { useSelector } from 'react-redux';
import { Card } from '../components/UI/Card';
import { Trophy, Activity, Bike, Droplet } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const PersonalRecords = () => {
   const prs = useSelector(state => state.prs.data);

   const getIcon = (sport) => {
      switch (sport) {
         case 'Running': return <Activity size={24} />;
         case 'Cycling': return <Bike size={24} />;
         case 'Swimming': return <Droplet size={24} />;
         default: return <Trophy size={24} />;
      }
   };

   const getThemeClass = (sport) => {
      switch (sport) {
         case 'Running': return 'text-accent border-accent';
         case 'Cycling': return 'text-success border-success';
         case 'Swimming': return 'text-purple-500 border-purple-500';
         default: return 'text-warning border-warning';
      }
   };

   return (
      <div className="space-y-6">

         {/* Header */}
         <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
               Personal Records Wall
            </h1>
            <p className="text-gray-700 dark:text-gray-400 mt-1">
               Your best performances. Push the limits.
            </p>
         </div>

         {Object.entries(prs).map(([sport, records]) => (
            <div key={sport} className="mb-10">

               {/* Section title */}
               <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className={getThemeClass(sport).split(' ')[0]}>
                     {getIcon(sport)}
                  </span>
                  {sport}
               </h2>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                  {Object.entries(records).map(([event, pr]) => (
                     <Card
                        key={event}
                        className={`border-t-4 ${getThemeClass(sport).split(' ')[1]}
                        bg-white dark:bg-[#111827]
                        border border-gray-200 dark:border-[#243244]
                        shadow-md dark:shadow-none
                        flex flex-col justify-between`}
                     >

                        <div>
                           <div className="flex justify-between items-start mb-4">
                              <h3 className="font-medium text-gray-700 dark:text-gray-300">
                                 {event}
                              </h3>
                              <Trophy
                                 size={16}
                                 className={getThemeClass(sport).split(' ')[0]}
                              />
                           </div>

                           <p className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                              {pr.value}
                           </p>

                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Set on {format(parseISO(pr.date), 'MMM d, yyyy')}
                           </p>
                        </div>

                        {pr.previousValue ? (
                           <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#243244] flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                 Previous
                              </span>
                              <span className="text-gray-800 dark:text-gray-300">
                                 {pr.previousValue}
                              </span>
                           </div>
                        ) : (
                           <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#243244] text-sm text-center">
                              <span className="text-gray-500 dark:text-gray-400 italic">
                                 No previous mark
                              </span>
                           </div>
                        )}

                     </Card>
                  ))}

               </div>
            </div>
         ))}
      </div>
   );
};

export default PersonalRecords;