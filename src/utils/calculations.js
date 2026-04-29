import { subDays, parseISO, differenceInDays } from 'date-fns';

export const calculateTrainingLoad = (sport, distance, durationStr, rpe) => {
  // distance in km (or meters for swimming), rpe (1-10)
  // duration is HH:MM:SS or minutes
  let load = 0;
  
  const parseDurationStr = (str) => {
     if(!str) return 0;
     if(typeof str === 'number') return str; // if minutes already passed
     const parts = str.split(':').map(Number);
     if (parts.length === 3) {
       return parts[0] * 60 + parts[1] + (parts[2] / 60);
     }
     return 0; // fallback
  }

  const durationMin = parseDurationStr(durationStr);

  switch(sport) {
    case 'Running':
      load = (distance * 10) * (rpe / 5);
      break;
    case 'Cycling':
      load = (distance * 6) * (rpe / 5);
      break;
    case 'Strength Training':
      load = (durationMin * 1.5) * (rpe / 5);
      break;
    case 'Swimming':
      load = ((distance / 100) * 8) * (rpe / 5);
      break;
    default:
      load = 0;
  }
  
  return Math.round(load);
};

export const calculatePace = (distanceKm, durationStr) => {
  if (!distanceKm || distanceKm <= 0) return '00:00';
  
  const parseDurationToSeconds = (str) => {
    if(!str) return 0;
    const parts = str.split(':').map(Number);
    if(parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
    if(parts.length === 2) return parts[0]*60 + parts[1];
    return 0;
  }
  
  const totalSeconds = parseDurationToSeconds(durationStr);
  if (totalSeconds === 0) return '00:00';
  
  const paceSeconds = totalSeconds / distanceKm;
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.floor(paceSeconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const calculateATL = (workouts, targetDate) => {
  // Rolling 7-day average of daily Training Load Score
  let totalLoad = 0;
  for(let i = 0; i < 7; i++) {
    const d = subDays(targetDate, i).toISOString().split('T')[0];
    const daysWorkouts = workouts.filter(w => w.date === d);
    totalLoad += daysWorkouts.reduce((sum, w) => sum + (w.loadScore || 0), 0);
  }
  return totalLoad / 7;
};

export const calculateCTL = (workouts, targetDate) => {
  // Rolling 28-day average
  let totalLoad = 0;
  for(let i = 0; i < 28; i++) {
    const d = subDays(targetDate, i).toISOString().split('T')[0];
    const daysWorkouts = workouts.filter(w => w.date === d);
    totalLoad += daysWorkouts.reduce((sum, w) => sum + (w.loadScore || 0), 0);
  }
  return totalLoad / 28;
};

export const calculateRecoveryScore = (atl, ctl, numRestDaysInLast3) => {
  let score = 10;
  if(atl > ctl) {
    score -= (atl - ctl) * 0.1;
  }
  score += numRestDaysInLast3 * 0.5;
  return Math.max(0, Math.min(10, score));
};
