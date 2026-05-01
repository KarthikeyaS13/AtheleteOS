import { subDays, format } from 'date-fns';
import { calculateTrainingLoad } from './calculations';

export const generateSeedData = () => {
  const workouts = [];
  const nutrition = {};
  
  const today = new Date();
  
  // Weights for random generation
  const sports = ['Running', 'Cycling', 'Strength Training', 'Swimming', 'Rest'];
  
  for(let i = 29; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    
    // Pick sport
    const r = Math.random();
    let sport = 'Rest';
    if(r > 0.8) sport = 'Swimming';
    else if(r > 0.6) sport = 'Strength Training';
    else if(r > 0.3) sport = 'Cycling';
    else if(r > 0.0) sport = 'Running';
    
    if (sport !== 'Rest') {
      const isLong = Math.random() > 0.8;
      let distance = 0, durationStr = '00:00:00', rpe = Math.floor(Math.random() * 4) + 4; // 4 to 7
      
      if(sport === 'Running') {
         distance = isLong ? Math.floor(Math.random()*15) + 15 : Math.floor(Math.random()*8) + 5;
         const mins = Math.floor(distance * (isLong ? 5.5 : 5));
         durationStr = `${Math.floor(mins/60).toString().padStart(2, '0')}:${(mins%60).toString().padStart(2, '0')}:00`;
         if(isLong) rpe += 2;
      } else if (sport === 'Cycling') {
         distance = isLong ? Math.floor(Math.random()*60) + 40 : Math.floor(Math.random()*20) + 15;
         const mins = Math.floor(distance * (isLong ? 2.5 : 2));
         durationStr = `${Math.floor(mins/60).toString().padStart(2, '0')}:${(mins%60).toString().padStart(2, '0')}:00`;
      } else if (sport === 'Swimming') {
         distance = Math.floor(Math.random()*10)*100 + 1000;
         const mins = Math.floor((distance/100) * 1.8);
         durationStr = `00:${mins.toString().padStart(2, '0')}:00`;
      } else if (sport === 'Strength Training') {
         durationStr = `00:45:00`;
         distance = 0;
      }
      
      workouts.push({
        id: `seed-w-${i}`,
        date: dateStr,
        sport,
        type: isLong ? 'Long' : 'Base',
        distance,
        duration: durationStr,
        rpe: Math.min(10, rpe),
        loadScore: calculateTrainingLoad(sport, distance, durationStr, Math.min(10, rpe)),
        notes: `Seed ${sport} workout.`
      });
    }
    
    // Nutrition
    nutrition[dateStr] = {
      Breakfast: [{ id: 'b1', name: 'Oatmeal', quantity: 1, unit: 'bowl', calories: 350, protein: 12, carbs: 60, fat: 8 }],
      Lunch: [{ id: 'l1', name: 'Chicken Salad', quantity: 1, unit: 'bowl', calories: 450, protein: 40, carbs: 20, fat: 15 }],
      Dinner: [{ id: 'd1', name: 'Salmon & Rice', quantity: 1, unit: 'plate', calories: 600, protein: 45, carbs: 50, fat: 20 }],
      Snacks: [{ id: 's1', name: 'Protein Shake', quantity: 1, unit: 'cup', calories: 150, protein: 25, carbs: 5, fat: 2 }],
      hydration: Math.floor(Math.random() * 4) + 5 // 5 to 8 glasses
    };
    
    // Randomize nutrition a bit
    if(Math.random() > 0.5) {
      nutrition[dateStr].Dinner[0].calories += 200;
      nutrition[dateStr].Dinner[0].carbs += 50;
    }
  }

  const races = [
    { id: 'r1', name: 'City Half Marathon', date: format(subDays(today, -42), 'yyyy-MM-dd'), distance: 21.1, type: 'Running', targetTime: '01:45:00' },
    { id: 'r2', name: 'Endurance Marathon', date: format(subDays(today, -112), 'yyyy-MM-dd'), distance: 42.2, type: 'Running', targetTime: '03:45:00' },
  ];

  const prs = {
    Running: {
      '5K': { value: '00:22:30', date: format(subDays(today, 120), 'yyyy-MM-dd'), previousValue: '00:23:15' },
      '10K': { value: '00:48:10', date: format(subDays(today, 60), 'yyyy-MM-dd'), previousValue: '00:50:00' },
      'Half Marathon': { value: '01:50:00', date: format(subDays(today, 200), 'yyyy-MM-dd'), previousValue: null }
    },
    Cycling: {
      '100K': { value: '03:20:00', date: format(subDays(today, 90), 'yyyy-MM-dd'), previousValue: null }
    }
  };

  return { workouts, nutrition, races, prs };
};
