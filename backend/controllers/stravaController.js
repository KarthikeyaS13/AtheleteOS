import { query } from '../db.js';
import { stravaService } from '../services/stravaService.js';

// Helper to convert duration string "HH:MM:SS" to seconds
const durationToSeconds = (durationStr) => {
  if (!durationStr) return Infinity;
  const parts = durationStr.split(':');
  if (parts.length === 3) {
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
  } else if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }
  return parseInt(durationStr, 10) || Infinity;
};

// Check if a new value beats a current PR
const isNewRecord = (newValueStr, oldPRValueStr) => {
  if (!oldPRValueStr) return true; // If no existing record, it's a new record
  const newSecs = durationToSeconds(newValueStr);
  const oldSecs = durationToSeconds(oldPRValueStr);
  return newSecs < oldSecs;
};

export const stravaController = {
  getStatus: async (req, res) => {
    try {
      const result = await query('SELECT * FROM strava_tokens WHERE user_id = $1', [req.user.id]);
      const clientId = process.env.STRAVA_CLIENT_ID || '';
      
      if (result.rowCount === 0) {
        return res.json({
          connected: false,
          clientId: !!clientId
        });
      }

      const row = result.rows[0];
      res.json({
        connected: true,
        clientId: !!clientId,
        athlete: {
          id: row.strava_athlete_id,
          name: row.athlete_name || 'Connected Athlete',
          username: row.username || '',
          profilePicture: row.profile_picture || '',
          lastSync: row.last_sync
        }
      });
    } catch (err) {
      console.error('Error fetching Strava status:', err);
      res.status(500).json({ error: 'Server error fetching status' });
    }
  },

  connect: async (req, res) => {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    try {
      if (code === 'mock_code') {
        // Handle mock connection
        const mockExpiresAt = new Date(Date.now() + 31536000 * 1000); // 1 year expiry
        await query(
          `INSERT INTO strava_tokens (user_id, strava_athlete_id, athlete_name, username, profile_picture, access_token, refresh_token, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (user_id) DO UPDATE SET
             strava_athlete_id = EXCLUDED.strava_athlete_id,
             athlete_name = EXCLUDED.athlete_name,
             username = EXCLUDED.username,
             profile_picture = EXCLUDED.profile_picture,
             access_token = EXCLUDED.access_token,
             refresh_token = EXCLUDED.refresh_token,
             expires_at = EXCLUDED.expires_at`,
          [
            req.user.id,
            'mock_athlete_123',
            'Mock Athlete',
            'mock_athlete',
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=150&h=150&q=80',
            'mock_access_token',
            'mock_refresh_token',
            mockExpiresAt
          ]
        );

        return res.json({ success: true, message: 'Mock Strava connected successfully' });
      }

      // Real OAuth flow
      const tokenData = await stravaService.exchangeCodeForToken(code);
      const athlete = tokenData.athlete || {};
      const athleteName = `${athlete.firstname || ''} ${athlete.lastname || ''}`.trim() || 'Athlete';
      
      await query(
        `INSERT INTO strava_tokens (user_id, strava_athlete_id, athlete_name, username, profile_picture, access_token, refresh_token, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id) DO UPDATE SET
           strava_athlete_id = EXCLUDED.strava_athlete_id,
           athlete_name = EXCLUDED.athlete_name,
           username = EXCLUDED.username,
           profile_picture = EXCLUDED.profile_picture,
           access_token = EXCLUDED.access_token,
           refresh_token = EXCLUDED.refresh_token,
           expires_at = EXCLUDED.expires_at`,
        [
          req.user.id,
          String(athlete.id),
          athleteName,
          athlete.username || '',
          athlete.profile || '',
          tokenData.access_token,
          tokenData.refresh_token,
          new Date(tokenData.expires_at * 1000)
        ]
      );

      res.json({ success: true, message: 'Strava connected successfully' });
    } catch (err) {
      console.error('Error connecting Strava:', err);
      res.status(500).json({ error: err.message || 'Server error connecting Strava' });
    }
  },

  disconnect: async (req, res) => {
    try {
      await query('DELETE FROM strava_tokens WHERE user_id = $1', [req.user.id]);
      await query('DELETE FROM pending_pr_suggestions WHERE owner_id = $1', [req.user.id]);
      res.json({ success: true, message: 'Strava account disconnected' });
    } catch (err) {
      console.error('Error disconnecting Strava:', err);
      res.status(500).json({ error: 'Server error disconnecting Strava' });
    }
  },

  sync: async (req, res) => {
    try {
      const result = await query('SELECT * FROM strava_tokens WHERE user_id = $1', [req.user.id]);
      if (result.rowCount === 0) {
        return res.status(400).json({ error: 'Strava account is not connected.' });
      }

      const tokenRow = result.rows[0];
      const isMock = tokenRow.access_token === 'mock_access_token';
      
      let workoutsToInsert = [];
      const now = new Date();

      if (isMock) {
        // Generate mock workouts
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        workoutsToInsert = [
          {
            date: yesterday,
            sport: 'Running',
            type: 'Base',
            distance: 5.20,
            duration: '00:24:15',
            rpe: 6,
            load_score: 62,
            notes: 'Simulated Morning Run - Feels great!',
            strava_activity_id: `mock_run_${Date.now()}`,
            calories: 360,
            elevation: 45,
            average_hr: 152,
            average_pace: '4:39 /km',
            average_speed: 12.9,
            moving_time: 1455,
            elapsed_time: 1500,
            gear: 'Mock Shoes',
            gps_polyline: 'mock_poly_run'
          },
          {
            date: threeDaysAgo,
            sport: 'Cycling',
            type: 'Base',
            distance: 40.50,
            duration: '01:20:10',
            rpe: 7,
            load_score: 340,
            notes: 'Simulated Sunday Ride - Nice tailwind.',
            strava_activity_id: `mock_ride_${Date.now()}`,
            calories: 840,
            elevation: 320,
            average_hr: 142,
            average_pace: '1:58 /km',
            average_speed: 30.3,
            moving_time: 4810,
            elapsed_time: 5100,
            gear: 'Mock Bike',
            gps_polyline: 'mock_poly_ride'
          },
          {
            date: fiveDaysAgo,
            sport: 'Swimming',
            type: 'Base',
            distance: 1500,
            duration: '00:35:00',
            rpe: 5,
            load_score: 120,
            notes: 'Simulated Pool Swim - Interval training.',
            strava_activity_id: `mock_swim_${Date.now()}`,
            calories: 420,
            elevation: 0,
            average_hr: 135,
            average_pace: '2:20 /100m',
            average_speed: 2.6,
            moving_time: 2100,
            elapsed_time: 2400,
            gear: null,
            gps_polyline: null
          }
        ];
      } else {
        // Real OAuth sync
        let accessToken = tokenRow.access_token;
        let expiresAt = tokenRow.expires_at;
        let refreshToken = tokenRow.refresh_token;

        // Check if token is expired
        if (new Date() >= expiresAt) {
          const refreshed = await stravaService.refreshAccessToken(refreshToken);
          accessToken = refreshed.access_token;
          refreshToken = refreshed.refresh_token;
          expiresAt = new Date(refreshed.expires_at * 1000);

          // Update tokens in DB
          await query(
            `UPDATE strava_tokens 
             SET access_token = $1, refresh_token = $2, expires_at = $3
             WHERE user_id = $4`,
            [accessToken, refreshToken, expiresAt, req.user.id]
          );
        }

        // Fetch activities since last sync
        const lastSyncUnix = tokenRow.last_sync ? Math.floor(new Date(tokenRow.last_sync).getTime() / 1000) : null;
        // Default to fetching activities from last 30 days if no last_sync exists
        const afterUnix = lastSyncUnix || Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
        
        const rawActivities = await stravaService.fetchActivities(accessToken, afterUnix);
        workoutsToInsert = rawActivities.map(act => stravaService.mapStravaActivityToWorkout(act));
      }

      let insertedCount = 0;
      const prSuggestions = [];

      for (const w of workoutsToInsert) {
        // 1. Insert workout, preventing duplicates on unique strava_activity_id
        const insertRes = await query(
          `INSERT INTO workouts (
            owner_id, date, sport, type, distance, duration, rpe, load_score, notes, 
            strava_activity_id, calories, elevation, average_hr, average_pace, 
            average_speed, moving_time, elapsed_time, gear, gps_polyline
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          ON CONFLICT (strava_activity_id) DO NOTHING
          RETURNING id`,
          [
            req.user.id, w.date, w.sport, w.type, w.distance, w.duration, w.rpe, w.load_score, w.notes,
            w.strava_activity_id, w.calories, w.elevation, w.average_hr, w.average_pace,
            w.average_speed, w.moving_time, w.elapsed_time, w.gear, w.gps_polyline
          ]
        );

        if (insertRes.rowCount > 0) {
          insertedCount++;

          // 2. PR Detection logic
          // Determine event
          let event = null;
          const distNum = parseFloat(w.distance);
          const sportLower = (w.sport || '').toLowerCase();

          if (sportLower === 'running' && distNum) {
            if (distNum >= 4.7 && distNum <= 5.3) event = '5K';
            else if (distNum >= 9.5 && distNum <= 10.5) event = '10K';
            else if (distNum >= 20.5 && distNum <= 21.7) event = 'Half Marathon';
            else if (distNum >= 41.0 && distNum <= 43.5) event = 'Marathon';
          } else if (sportLower === 'cycling' && distNum) {
            if (distNum >= 9.5 && distNum <= 10.5) event = '10K';
            else if (distNum >= 38.0 && distNum <= 42.0) event = '40K';
            else if (distNum >= 95.0 && distNum <= 105.0) event = '100K';
          } else if (sportLower === 'swimming' && distNum) {
            // For swimming, distance could be stored in meters (e.g. 1500)
            if (distNum >= 80 && distNum <= 120) event = '100m';
            else if (distNum >= 350 && distNum <= 450) event = '400m';
            else if (distNum >= 1300 && distNum <= 1700) event = '1500m';
          }

          if (event) {
            // Fetch current PR for this sport/event
            const currentPRRes = await query(
              'SELECT value, date FROM prs WHERE owner_id = $1 AND sport = $2 AND event = $3',
              [req.user.id, w.sport, event]
            );

            const hasBeaten = currentPRRes.rowCount === 0 || isNewRecord(w.duration, currentPRRes.rows[0].value);
            
            if (hasBeaten) {
              const previousVal = currentPRRes.rowCount > 0 ? currentPRRes.rows[0].value : null;
              
              // Store as pending suggestion
              await query(
                `INSERT INTO pending_pr_suggestions (owner_id, sport, event, value, date, previous_value)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (owner_id, sport, event) DO UPDATE SET
                   value = EXCLUDED.value,
                   date = EXCLUDED.date,
                   previous_value = EXCLUDED.previous_value`,
                [req.user.id, w.sport, event, w.duration, w.date, previousVal]
              );

              prSuggestions.push({
                sport: w.sport,
                event,
                value: w.duration,
                date: w.date,
                previousValue: previousVal
              });
            }
          }
        }
      }

      // Update last sync time
      await query(
        'UPDATE strava_tokens SET last_sync = $1 WHERE user_id = $2',
        [now, req.user.id]
      );

      res.json({
        success: true,
        importedCount: insertedCount,
        syncedCount: insertedCount,
        prSuggestions,
        lastSync: now
      });
    } catch (err) {
      console.error('Error syncing Strava:', err);
      res.status(500).json({ error: err.message || 'Server error syncing Strava' });
    }
  },

  getPendingPRs: async (req, res) => {
    try {
      const suggestions = await query(
        'SELECT * FROM pending_pr_suggestions WHERE owner_id = $1',
        [req.user.id]
      );
      res.json(suggestions.rows.map(row => ({
        id: row.id,
        sport: row.sport,
        event: row.event,
        value: row.value,
        date: row.date.toISOString().split('T')[0],
        previousValue: row.previous_value
      })));
    } catch (err) {
      console.error('Error fetching pending PRs:', err);
      res.status(500).json({ error: 'Server error fetching pending PRs' });
    }
  },

  acceptPendingPR: async (req, res) => {
    const { sport, event } = req.body;
    if (!sport || !event) {
      return res.status(400).json({ error: 'sport and event are required' });
    }

    try {
      // Find the pending PR suggestion
      const suggestionRes = await query(
        'SELECT * FROM pending_pr_suggestions WHERE owner_id = $1 AND sport = $2 AND event = $3',
        [req.user.id, sport, event]
      );

      if (suggestionRes.rowCount === 0) {
        return res.status(404).json({ error: 'PR suggestion not found' });
      }

      const suggestion = suggestionRes.rows[0];

      // Update main prs table
      await query(
        `INSERT INTO prs (owner_id, sport, event, value, date, previous_value)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (owner_id, sport, event) DO UPDATE SET
           value = EXCLUDED.value,
           date = EXCLUDED.date,
           previous_value = EXCLUDED.previous_value`,
        [req.user.id, sport, event, suggestion.value, suggestion.date, suggestion.previous_value]
      );

      // Delete from pending suggestions
      await query(
        'DELETE FROM pending_pr_suggestions WHERE owner_id = $1 AND sport = $2 AND event = $3',
        [req.user.id, sport, event]
      );

      res.json({ success: true, message: 'PR updated successfully' });
    } catch (err) {
      console.error('Error accepting PR suggestion:', err);
      res.status(500).json({ error: 'Server error accepting PR suggestion' });
    }
  },

  rejectPendingPR: async (req, res) => {
    const { sport, event } = req.body;
    if (!sport || !event) {
      return res.status(400).json({ error: 'sport and event are required' });
    }

    try {
      await query(
        'DELETE FROM pending_pr_suggestions WHERE owner_id = $1 AND sport = $2 AND event = $3',
        [req.user.id, sport, event]
      );
      res.json({ success: true, message: 'PR suggestion dismissed' });
    } catch (err) {
      console.error('Error dismissing PR suggestion:', err);
      res.status(500).json({ error: 'Server error dismissing PR suggestion' });
    }
  }
};
