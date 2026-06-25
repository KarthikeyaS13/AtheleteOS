import dotenv from 'dotenv';
dotenv.config();

const STRAVA_API_URL = 'https://www.strava.com/api/v3';
const STRAVA_OAUTH_URL = 'https://www.strava.com/oauth/token';

const calculateBackendLoadScore = (sport, distance, durationMin, rpe) => {
  let load = 0;
  switch (sport) {
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

const secondsToDurationStr = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
};

const calculatePace = (sport, distanceKm, durationSeconds) => {
  if (!distanceKm || distanceKm <= 0 || !durationSeconds) return '00:00';
  
  if (sport === 'Swimming') {
    // Pace for swim is typically min/100m
    // distanceKm is actually meters for swimming, let's check
    const paceSeconds = (durationSeconds / (distanceKm / 100));
    const mins = Math.floor(paceSeconds / 60);
    const secs = Math.floor(paceSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /100m`;
  }
  
  const paceSeconds = durationSeconds / distanceKm;
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.floor(paceSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
};

export const stravaService = {
  exchangeCodeForToken: async (code) => {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Strava integration has not been configured by the administrator.');
    }

    const response = await fetch(STRAVA_OAUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Strava token exchange failed: ${errText}`);
    }

    return await response.json();
  },

  refreshAccessToken: async (refreshToken) => {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Strava integration has not been configured by the administrator.');
    }

    const response = await fetch(STRAVA_OAUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Strava token refresh failed: ${errText}`);
    }

    return await response.json();
  },

  fetchActivities: async (accessToken, afterTimestamp) => {
    let url = `${STRAVA_API_URL}/athlete/activities?per_page=50`;
    if (afterTimestamp) {
      url += `&after=${afterTimestamp}`;
    }

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to fetch activities from Strava: ${errText}`);
    }

    return await response.json();
  },

  mapStravaActivityToWorkout: (activity) => {
    const typeLower = (activity.type || '').toLowerCase();
    let sport = 'Running';
    let distance = 0;
    
    // Map types
    if (typeLower === 'run' || typeLower === 'walk' || typeLower === 'hike') {
      sport = 'Running';
      distance = Number((activity.distance / 1000).toFixed(2)); // meters to km
    } else if (typeLower === 'ride' || typeLower === 'virtualride') {
      sport = 'Cycling';
      distance = Number((activity.distance / 1000).toFixed(2)); // meters to km
    } else if (typeLower === 'swim') {
      sport = 'Swimming';
      distance = Number(activity.distance); // swim distance in meters
    } else {
      sport = 'Strength Training';
      distance = 0;
    }

    const durationStr = secondsToDurationStr(activity.moving_time);
    const durationMin = activity.moving_time / 60;
    
    // Estimate RPE: default 5, scale if suffer_score exists
    let rpe = 5;
    if (activity.suffer_score) {
      rpe = Math.min(10, Math.max(1, Math.round(activity.suffer_score / 10)));
    }

    const loadScore = calculateBackendLoadScore(sport, distance, durationMin, rpe);
    
    // Calculate average speed
    let averageSpeed = null;
    if (activity.average_speed) {
      // Strava average_speed is m/s. Convert to km/h for Cycling, keep m/s or convert for running
      if (sport === 'Cycling') {
        averageSpeed = Number((activity.average_speed * 3.6).toFixed(1));
      } else {
        averageSpeed = Number((activity.average_speed * 3.6).toFixed(1));
      }
    }

    const paceStr = calculatePace(sport, distance, activity.moving_time);

    return {
      date: activity.start_date_local.split('T')[0],
      sport,
      type: 'Base',
      distance: distance === 0 ? null : distance,
      duration: durationStr,
      rpe,
      load_score: loadScore,
      notes: activity.description || activity.name || '',
      strava_activity_id: String(activity.id),
      calories: activity.kilojoules ? Number((activity.kilojoules * 1.1).toFixed(0)) : null, // estimate calories from kilojoules
      elevation: activity.total_elevation_gain ? Number(activity.total_elevation_gain.toFixed(0)) : null,
      average_hr: activity.has_heartrate ? Number(activity.average_heartrate.toFixed(0)) : null,
      average_pace: paceStr,
      average_speed: averageSpeed,
      moving_time: activity.moving_time,
      elapsed_time: activity.elapsed_time,
      gear: activity.gear_id || null,
      gps_polyline: activity.map?.summary_polyline || null
    };
  }
};
