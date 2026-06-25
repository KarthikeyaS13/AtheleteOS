import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pool, { query } from './db.js';
import runMigrations from './migrate.js';
import { requireAuth, requireAdmin } from './authMiddleware.js';
import stravaRouter from './routes/strava.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_athleteos_2026';

app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(compression());

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', limiter);

app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected'
    });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: err.message
    });
  }
});

app.use('/api/strava', stravaRouter);


// Helper to format Date objects as YYYY-MM-DD timezone-safely
const formatDate = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- AUTHENTICATION ROUTES ---

app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }

  try {
    const checkUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rowCount > 0) {
      return res.status(400).send('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertUser = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, passwordHash]
    );

    const newUser = insertUser.rows[0];

    // Seed default settings for the new user
    const defaultSettings = {
      profile: { name: '', age: '', weight: '', height: '', photo: '', restingHR: '60', maxHR: '190' },
      targets: { weeklyRunKm: 40, weeklyCycleKm: 100, weeklySwimM: 2000, weeklyStrength: 3, dailyCalories: 2500, dailyProtein: 150, dailyCarbs: 300, dailyFat: 80, dailyWater: 8 },
      equipment: { shoes: [], bikes: [], exercises: [] },
      preferences: { theme: 'dark', units: 'km', weekStart: 'Monday' }
    };

    await query(
      'INSERT INTO settings (owner_id, profile, targets, equipment, preferences) VALUES ($1, $2, $3, $4, $5)',
      [
        newUser.id,
        JSON.stringify(defaultSettings.profile),
        JSON.stringify(defaultSettings.targets),
        JSON.stringify(defaultSettings.equipment),
        JSON.stringify(defaultSettings.preferences)
      ]
    );

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: newUser.id, email: newUser.email, role: 'User', status: 'Active' } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }

  try {
    const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rowCount === 0) {
      return res.status(400).send('Invalid email or password');
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).send('Invalid email or password');
    }

    // Update last login timestamp
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, status: user.status } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).send('Email and new password are required');
  }

  try {
    const userRes = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rowCount === 0) {
      return res.status(400).send('User not found');
    }

    const userId = userRes.rows[0].id;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
    console.log(`[AUTH] Password mock-reset successfully for: ${email}`);
    res.send('Password reset successful');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// --- WORKOUTS ENDPOINTS ---

app.get('/api/workouts', requireAuth, async (req, res) => {
  try {
    const workoutsRes = await query(
      'SELECT * FROM workouts WHERE owner_id = $1 ORDER BY date DESC',
      [req.user.id]
    );
    const mapped = workoutsRes.rows.map(w => ({
      id: w.id,
      date: formatDate(w.date),
      sport: w.sport,
      type: w.type,
      distance: w.distance ? Number(w.distance) : 0,
      duration: w.duration,
      rpe: w.rpe,
      loadScore: w.load_score,
      notes: w.notes
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error fetching workouts');
  }
});

app.post('/api/workouts', requireAuth, async (req, res) => {
  const { date, sport, type, distance, duration, rpe, loadScore, notes } = req.body;
  try {
    const result = await query(
      `INSERT INTO workouts (owner_id, date, sport, type, distance, duration, rpe, load_score, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, date, sport, type, distance === '' ? null : distance, duration, rpe, loadScore, notes]
    );
    const w = result.rows[0];
    await recalculatePRsForUser(req.user.id);
    res.json({
      id: w.id,
      date: formatDate(w.date),
      sport: w.sport,
      type: w.type,
      distance: w.distance ? Number(w.distance) : 0,
      duration: w.duration,
      rpe: w.rpe,
      loadScore: w.load_score,
      notes: w.notes
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error adding workout');
  }
});

app.put('/api/workouts/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { date, sport, type, distance, duration, rpe, loadScore, notes } = req.body;
  try {
    const check = await query('SELECT id FROM workouts WHERE id = $1 AND owner_id = $2', [id, req.user.id]);
    if (check.rowCount === 0) {
      return res.status(404).send('Workout not found');
    }

    const result = await query(
      `UPDATE workouts
       SET date = $1, sport = $2, type = $3, distance = $4, duration = $5, rpe = $6, load_score = $7, notes = $8
       WHERE id = $9 AND owner_id = $10
       RETURNING *`,
      [date, sport, type, distance === '' ? null : distance, duration, rpe, loadScore, notes, id, req.user.id]
    );
    const w = result.rows[0];
    await recalculatePRsForUser(req.user.id);
    res.json({
      id: w.id,
      date: formatDate(w.date),
      sport: w.sport,
      type: w.type,
      distance: w.distance ? Number(w.distance) : 0,
      duration: w.duration,
      rpe: w.rpe,
      loadScore: w.load_score,
      notes: w.notes
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error updating workout');
  }
});

app.delete('/api/workouts/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM workouts WHERE id = $1 AND owner_id = $2', [id, req.user.id]);
    if (result.rowCount === 0) {
      return res.status(404).send('Workout not found');
    }
    await recalculatePRsForUser(req.user.id);
    res.send('Workout deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error deleting workout');
  }
});

// --- NUTRITION & HYDRATION ENDPOINTS ---

app.get('/api/nutrition', requireAuth, async (req, res) => {
  try {
    const entriesRes = await query(
      'SELECT * FROM nutrition_entries WHERE owner_id = $1',
      [req.user.id]
    );
    const hydrationRes = await query(
      'SELECT * FROM hydration WHERE owner_id = $1',
      [req.user.id]
    );

    const data = {};

    entriesRes.rows.forEach(row => {
      const dateStr = formatDate(row.date);
      if (!data[dateStr]) {
        data[dateStr] = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [], hydration: 0 };
      }
      data[dateStr][row.meal].push({
        id: row.item_id,
        name: row.name,
        quantity: Number(row.quantity),
        unit: row.unit,
        calories: row.calories,
        protein: row.protein,
        carbs: row.carbs,
        fat: row.fat
      });
    });

    hydrationRes.rows.forEach(row => {
      const dateStr = formatDate(row.date);
      if (!data[dateStr]) {
        data[dateStr] = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [], hydration: 0 };
      }
      data[dateStr].hydration = row.quantity;
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error fetching nutrition data');
  }
});

app.post('/api/nutrition', requireAuth, async (req, res) => {
  const { date, meal, item } = req.body;
  if (!date || !meal || !item) {
    return res.status(400).send('Missing entry fields');
  }

  try {
    await query(
      `INSERT INTO nutrition_entries (owner_id, date, meal, item_id, name, quantity, unit, calories, protein, carbs, fat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [req.user.id, date, meal, item.id, item.name, item.quantity, item.unit, item.calories, item.protein, item.carbs, item.fat]
    );
    res.json({ date, meal, item });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error adding nutrition entry');
  }
});

app.delete('/api/nutrition/:date/:meal/:itemId', requireAuth, async (req, res) => {
  const { date, meal, itemId } = req.params;
  try {
    const result = await query(
      'DELETE FROM nutrition_entries WHERE owner_id = $1 AND date = $2 AND meal = $3 AND item_id = $4',
      [req.user.id, date, meal, itemId]
    );
    if (result.rowCount === 0) {
      return res.status(404).send('Entry not found');
    }
    res.send('Nutrition entry removed');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error deleting nutrition entry');
  }
});

app.put('/api/nutrition/hydration', requireAuth, async (req, res) => {
  const { date, quantity } = req.body;
  try {
    await query(
      `INSERT INTO hydration (owner_id, date, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (owner_id, date) DO UPDATE SET quantity = EXCLUDED.quantity`,
      [req.user.id, date, quantity]
    );
    res.json({ date, quantity });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error updating hydration');
  }
});

// --- RACES ENDPOINTS ---

app.get('/api/races', requireAuth, async (req, res) => {
  try {
    const racesRes = await query('SELECT * FROM races WHERE owner_id = $1 ORDER BY date ASC', [req.user.id]);
    const mapped = racesRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      date: formatDate(r.date),
      distance: Number(r.distance),
      type: r.type,
      targetTime: r.target_time
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error fetching races');
  }
});

app.post('/api/races', requireAuth, async (req, res) => {
  const { name, date, distance, type, targetTime } = req.body;
  try {
    const result = await query(
      `INSERT INTO races (owner_id, name, date, distance, type, target_time)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, name, date, distance, type, targetTime]
    );
    const r = result.rows[0];
    res.json({
      id: r.id,
      name: r.name,
      date: formatDate(r.date),
      distance: Number(r.distance),
      type: r.type,
      targetTime: r.target_time
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error adding race');
  }
});

app.put('/api/races/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, date, distance, type, targetTime } = req.body;
  try {
    const check = await query('SELECT id FROM races WHERE id = $1 AND owner_id = $2', [id, req.user.id]);
    if (check.rowCount === 0) {
      return res.status(404).send('Race not found');
    }

    const result = await query(
      `UPDATE races
       SET name = $1, date = $2, distance = $3, type = $4, target_time = $5
       WHERE id = $6 AND owner_id = $7
       RETURNING *`,
      [name, date, distance, type, targetTime, id, req.user.id]
    );
    const r = result.rows[0];
    res.json({
      id: r.id,
      name: r.name,
      date: formatDate(r.date),
      distance: Number(r.distance),
      type: r.type,
      targetTime: r.target_time
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error updating race');
  }
});

app.delete('/api/races/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM races WHERE id = $1 AND owner_id = $2', [id, req.user.id]);
    if (result.rowCount === 0) {
      return res.status(404).send('Race not found');
    }
    res.send('Race deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error deleting race');
  }
});

// --- PERSONAL RECORDS (PRs) ENDPOINTS ---

const durationToSeconds = (duration) => {
  if (!duration) return Infinity;
  const parts = duration.split(':');
  if (parts.length === 3) {
    const hrs = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    const secs = parseInt(parts[2], 10) || 0;
    return hrs * 3600 + mins * 60 + secs;
  } else if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
  }
  return Infinity;
};

const normalizeSportName = (sport) => {
  const lower = (sport || '').toLowerCase();
  if (lower === 'running') return 'Running';
  if (lower === 'cycling') return 'Cycling';
  if (lower === 'swimming') return 'Swimming';
  return sport;
};

const getEventForWorkout = (sport, distance) => {
  if (!distance || distance <= 0) return null;
  const distNum = parseFloat(distance);
  const sportLower = (sport || '').toLowerCase();

  if (sportLower === 'running') {
    if (distNum >= 4.7 && distNum <= 5.3) return '5K';
    if (distNum >= 9.5 && distNum <= 10.5) return '10K';
    if (distNum >= 20.5 && distNum <= 21.7) return 'Half Marathon';
    if (distNum >= 41.0 && distNum <= 43.5) return 'Marathon';
  } else if (sportLower === 'cycling') {
    if (distNum >= 9.5 && distNum <= 10.5) return '10K';
    if (distNum >= 38.0 && distNum <= 42.0) return '40K';
    if (distNum >= 95.0 && distNum <= 105.0) return '100K';
  } else if (sportLower === 'swimming') {
    if (distNum >= 0.08 && distNum <= 0.12) return '100m';
    if (distNum >= 0.35 && distNum <= 0.45) return '400m';
    if (distNum >= 1.3 && distNum <= 1.7) return '1500m';
    if (distNum >= 80 && distNum <= 120) return '100m';
    if (distNum >= 350 && distNum <= 450) return '400m';
    if (distNum >= 1300 && distNum <= 1700) return '1500m';
  }
  return null;
};

export const recalculatePRsForUser = async (userId) => {
  try {
    const workoutsRes = await query(
      'SELECT sport, distance, duration, date FROM workouts WHERE owner_id = $1 ORDER BY date ASC',
      [userId]
    );

    const bestPRs = {};

    workoutsRes.rows.forEach(w => {
      const event = getEventForWorkout(w.sport, w.distance);
      if (!event) return;

      const seconds = durationToSeconds(w.duration);
      if (seconds === Infinity) return;

      const sport = normalizeSportName(w.sport);
      if (!bestPRs[sport]) bestPRs[sport] = {};

      const currentBest = bestPRs[sport][event];
      if (!currentBest) {
        bestPRs[sport][event] = {
          value: w.duration,
          date: w.date,
          previousValue: null,
          seconds: seconds
        };
      } else {
        if (seconds < currentBest.seconds) {
          bestPRs[sport][event] = {
            value: w.duration,
            date: w.date,
            previousValue: currentBest.value,
            seconds: seconds
          };
        }
      }
    });

    await query('DELETE FROM prs WHERE owner_id = $1', [userId]);

    for (const [sport, events] of Object.entries(bestPRs)) {
      for (const [event, pr] of Object.entries(events)) {
        await query(
          `INSERT INTO prs (owner_id, sport, event, value, date, previous_value)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, sport, event, pr.value, pr.date, pr.previousValue]
        );
      }
    }
  } catch (err) {
    console.error('Error recalculating PRs:', err);
  }
};

app.get('/api/prs', requireAuth, async (req, res) => {
  try {
    // Proactively recalculate PRs for the user to sync any pre-existing or imported workouts
    await recalculatePRsForUser(req.user.id);

    const prsRes = await query('SELECT * FROM prs WHERE owner_id = $1', [req.user.id]);
    const prData = {};
    prsRes.rows.forEach(row => {
      const sport = row.sport;
      const event = row.event;
      if (!prData[sport]) prData[sport] = {};
      prData[sport][event] = {
        value: row.value,
        date: formatDate(row.date),
        previousValue: row.previous_value
      };
    });
    res.json(prData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error fetching PRs');
  }
});

app.post('/api/prs', requireAuth, async (req, res) => {
  const { sport, event, value, date, previousValue } = req.body;
  try {
    await query(
      `INSERT INTO prs (owner_id, sport, event, value, date, previous_value)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (owner_id, sport, event) DO UPDATE
       SET value = EXCLUDED.value, date = EXCLUDED.date, previous_value = EXCLUDED.previous_value`,
      [req.user.id, sport, event, value, date, previousValue]
    );
    res.json({ sport, event, value, date, previousValue });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error updating PR');
  }
});

// --- SETTINGS ENDPOINTS ---

const parseJsonField = (field) => {
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      return field;
    }
  }
  return field;
};

app.get('/api/settings', requireAuth, async (req, res) => {
  try {
    let settingsRes = await query('SELECT * FROM settings WHERE owner_id = $1', [req.user.id]);

    if (settingsRes.rowCount === 0) {
      // Seed default settings row if it somehow does not exist
      const defaultSettings = {
        profile: { name: '', age: '', weight: '', height: '', photo: '', restingHR: '60', maxHR: '190' },
        targets: { weeklyRunKm: 40, weeklyCycleKm: 100, weeklySwimM: 2000, weeklyStrength: 3, dailyCalories: 2500, dailyProtein: 150, dailyCarbs: 300, dailyFat: 80, dailyWater: 8 },
        equipment: { shoes: [], bikes: [], exercises: [] },
        preferences: { theme: 'dark', units: 'km', weekStart: 'Monday' }
      };
      await query(
        'INSERT INTO settings (owner_id, profile, targets, equipment, preferences) VALUES ($1, $2, $3, $4, $5)',
        [
          req.user.id,
          JSON.stringify(defaultSettings.profile),
          JSON.stringify(defaultSettings.targets),
          JSON.stringify(defaultSettings.equipment),
          JSON.stringify(defaultSettings.preferences)
        ]
      );
      settingsRes = await query('SELECT * FROM settings WHERE owner_id = $1', [req.user.id]);
    }

    const s = settingsRes.rows[0];
    res.json({
      profile: parseJsonField(s.profile),
      targets: parseJsonField(s.targets),
      equipment: parseJsonField(s.equipment),
      preferences: parseJsonField(s.preferences)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error fetching settings');
  }
});

app.put('/api/settings', requireAuth, async (req, res) => {
  const { profile, targets, equipment, preferences } = req.body;
  try {
    const result = await query(
      `UPDATE settings
       SET profile = $1, targets = $2, equipment = $3, preferences = $4
       WHERE owner_id = $5
       RETURNING *`,
      [
        JSON.stringify(profile),
        JSON.stringify(targets),
        JSON.stringify(equipment),
        JSON.stringify(preferences),
        req.user.id
      ]
    );
    const s = result.rows[0];
    res.json({
      profile: parseJsonField(s.profile),
      targets: parseJsonField(s.targets),
      equipment: parseJsonField(s.equipment),
      preferences: parseJsonField(s.preferences)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error updating settings');
  }
});

app.post('/api/settings/clear-data', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM workouts WHERE owner_id = $1', [req.user.id]);
    await query('DELETE FROM nutrition_entries WHERE owner_id = $1', [req.user.id]);
    await query('DELETE FROM hydration WHERE owner_id = $1', [req.user.id]);
    await query('DELETE FROM races WHERE owner_id = $1', [req.user.id]);
    await query('DELETE FROM prs WHERE owner_id = $1', [req.user.id]);

    const defaultSettings = {
      profile: { name: '', age: '', weight: '', height: '', photo: '', restingHR: '60', maxHR: '190' },
      targets: { weeklyRunKm: 40, weeklyCycleKm: 100, weeklySwimM: 2000, weeklyStrength: 3, dailyCalories: 2500, dailyProtein: 150, dailyCarbs: 300, dailyFat: 80, dailyWater: 8 },
      equipment: { shoes: [], bikes: [], exercises: [] },
      preferences: { theme: 'dark', units: 'km', weekStart: 'Monday' }
    };

    await query(
      'UPDATE settings SET profile = $1, targets = $2, equipment = $3, preferences = $4 WHERE owner_id = $5',
      [defaultSettings.profile, defaultSettings.targets, defaultSettings.equipment, defaultSettings.preferences, req.user.id]
    );

    res.send('Data cleared');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error clearing data');
  }
});

// --- EDAMAM PROXY ENDPOINT ---

app.get('/api/nutrition/proxy', requireAuth, async (req, res) => {
  const { food, grams } = req.query;
  if (!food || !grams) {
    return res.status(400).send('Missing food or grams parameters');
  }

  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;

  try {
    const edamamUrl = `https://api.edamam.com/api/nutrition-data?app_id=${appId}&app_key=${appKey}&ingr=${grams}g ${food}`;
    const response = await fetch(edamamUrl);
    if (!response.ok) {
      throw new Error(`Edamam API response failed: ${response.statusText}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Edamam proxy error:', err.message);
    res.status(500).send('Error querying Edamam API');
  }
});

// --- ADMIN & LEADERBOARD ENDPOINTS ---

// Helper to estimate calories burned for a workout using duration and RPE
const estimateWorkoutCalories = (sport, durationStr, rpe) => {
  let minutes = 30; // default fallback
  if (durationStr) {
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 3) {
      minutes = parts[0] * 60 + parts[1] + parts[2] / 60;
    } else if (parts.length === 2) {
      minutes = parts[0] + parts[1] / 60;
    } else if (!isNaN(Number(durationStr))) {
      minutes = Number(durationStr);
    }
  }
  let factor = 8;
  if (sport === 'Running') factor = 11;
  else if (sport === 'Cycling') factor = 8;
  else if (sport === 'Swimming') factor = 9;
  else if (sport === 'Strength Training') factor = 6;
  
  const rpeScale = rpe ? (rpe / 6) : 1;
  return Math.round(minutes * factor * rpeScale);
};

// GET /api/admin/analytics
app.get('/api/admin/analytics', requireAuth, requireAdmin, async (req, res) => {
  try {
    const usersCountRes = await query('SELECT COUNT(*) FROM users');
    const activeUsersCountRes = await query("SELECT COUNT(*) FROM users WHERE status = 'Active'");
    const newUsersCountRes = await query("SELECT COUNT(*) FROM users WHERE created_at >= date_trunc('month', CURRENT_DATE)");
    
    const workoutsRes = await query('SELECT sport, distance, duration, rpe, date FROM workouts');
    
    let totalRunDist = 0;
    let totalCycDist = 0;
    let totalSwimDist = 0;
    let totalCalories = 0;
    
    workoutsRes.rows.forEach(w => {
      const d = w.distance ? Number(w.distance) : 0;
      if (w.sport === 'Running') totalRunDist += d;
      else if (w.sport === 'Cycling') totalCycDist += d;
      else if (w.sport === 'Swimming') totalSwimDist += d;
      
      totalCalories += estimateWorkoutCalories(w.sport, w.duration, w.rpe);
    });

    const weeklyTrendsRes = await query(`
      SELECT date_trunc('week', date) as week, COUNT(*) as count, SUM(distance) as distance
      FROM workouts
      GROUP BY week
      ORDER BY week ASC
      LIMIT 12
    `);

    const monthlyTrendsRes = await query(`
      SELECT date_trunc('month', date) as month, COUNT(*) as count
      FROM workouts
      GROUP BY month
      ORDER BY month ASC
      LIMIT 12
    `);

    const distributionRes = await query(`
      SELECT sport, COUNT(*) as count
      FROM workouts
      GROUP BY sport
    `);

    const activeDaysRes = await query(`
      SELECT to_char(date, 'FMDay') as day_name, COUNT(*) as count
      FROM workouts
      GROUP BY day_name
      ORDER BY count DESC
    `);

    res.json({
      totalUsers: parseInt(usersCountRes.rows[0].count, 10),
      activeUsers: parseInt(activeUsersCountRes.rows[0].count, 10),
      newUsersThisMonth: parseInt(newUsersCountRes.rows[0].count, 10),
      totalWorkouts: workoutsRes.rowCount,
      totalRunningDistance: Math.round(totalRunDist),
      totalCyclingDistance: Math.round(totalCycDist),
      totalSwimmingDistance: Math.round(totalSwimDist),
      totalCaloriesBurned: totalCalories,
      totalTrainingSessions: workoutsRes.rowCount,
      weeklyActivityTrends: weeklyTrendsRes.rows.map(r => ({
        week: formatDate(r.week),
        count: parseInt(r.count, 10),
        distance: Math.round(r.distance || 0)
      })),
      monthlyActivityTrends: monthlyTrendsRes.rows.map(r => ({
        month: format(new Date(r.month), 'MMM yyyy'),
        count: parseInt(r.count, 10)
      })),
      workoutDistribution: distributionRes.rows.map(r => ({
        sport: r.sport,
        count: parseInt(r.count, 10)
      })),
      activeDays: activeDaysRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error fetching admin analytics');
  }
});

// GET /api/admin/users
app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const usersRes = await query(`
      SELECT u.id, u.email, u.role, u.status, u.created_at, u.last_login,
             COALESCE(s.profile->>'name', '') as name,
             COALESCE(s.profile->>'photo', '') as photo,
             COALESCE(stats.run_dist, 0) as run_distance,
             COALESCE(stats.cycle_dist, 0) as cycle_distance,
             COALESCE(stats.workout_count, 0) as workout_count,
             COALESCE(pr_stats.pr_count, 0) as pr_count
      FROM users u
      LEFT JOIN settings s ON u.id = s.owner_id
      LEFT JOIN (
        SELECT owner_id,
               SUM(CASE WHEN sport = 'Running' THEN distance ELSE 0 END) as run_dist,
               SUM(CASE WHEN sport = 'Cycling' THEN distance ELSE 0 END) as cycle_dist,
               COUNT(*) as workout_count
        FROM workouts
        GROUP BY owner_id
      ) stats ON u.id = stats.owner_id
      LEFT JOIN (
        SELECT owner_id, COUNT(*) as pr_count
        FROM prs
        GROUP BY owner_id
      ) pr_stats ON u.id = pr_stats.owner_id
      ORDER BY u.created_at DESC
    `);
    
    const mappedUsers = usersRes.rows.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name || u.email.split('@')[0],
      photo: u.photo,
      role: u.role,
      status: u.status,
      joinDate: formatDate(u.created_at),
      lastLogin: u.last_login ? u.last_login.toISOString() : null,
      runningDistance: Math.round(Number(u.run_distance)),
      cyclingDistance: Math.round(Number(u.cycle_distance)),
      workoutCount: parseInt(u.workout_count, 10),
      prCount: parseInt(u.pr_count, 10)
    }));
    
    res.json(mappedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error fetching admin users list');
  }
});

// PUT /api/admin/users/:id
app.put('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;
  try {
    const checkRes = await query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (checkRes.rowCount === 0) {
      return res.status(404).send('User not found');
    }

    // Don't allow an admin to deactivate themselves to prevent lockout
    if (id === req.user.id && status && status !== 'Active') {
      return res.status(400).send('You cannot deactivate your own account.');
    }

    if (role && status) {
      await query('UPDATE users SET role = $1, status = $2 WHERE id = $3', [role, status, id]);
    } else if (role) {
      await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    } else if (status) {
      await query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
    }

    res.send('User updated successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error updating user');
  }
});

// GET /api/admin/workouts
app.get('/api/admin/workouts', requireAuth, requireAdmin, async (req, res) => {
  try {
    const workoutsRes = await query(`
      SELECT w.*, u.email, COALESCE(s.profile->>'name', '') as name
      FROM workouts w
      JOIN users u ON w.owner_id = u.id
      LEFT JOIN settings s ON u.id = s.owner_id
      ORDER BY w.date DESC, w.created_at DESC
      LIMIT 100
    `);
    
    const mapped = workoutsRes.rows.map(w => ({
      id: w.id,
      athlete: w.name || w.email.split('@')[0],
      date: formatDate(w.date),
      sport: w.sport,
      type: w.type,
      distance: w.distance ? Number(w.distance) : 0,
      duration: w.duration,
      rpe: w.rpe,
      loadScore: w.load_score,
      notes: w.notes
    }));
    
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error fetching platform workouts');
  }
});

// GET /api/leaderboard
app.get('/api/leaderboard', requireAuth, async (req, res) => {
  try {
    const workoutsRes = await query('SELECT owner_id, sport, distance, duration, rpe, date FROM workouts ORDER BY date ASC');
    const usersRes = await query(`
      SELECT u.id, u.email, COALESCE(s.profile->>'name', '') as name, COALESCE(s.profile->>'photo', '') as photo,
             COALESCE(pr_stats.pr_count, 0) as pr_count
      FROM users u
      LEFT JOIN settings s ON u.id = s.owner_id
      LEFT JOIN (
        SELECT owner_id, COUNT(*) as pr_count
        FROM prs
        GROUP BY owner_id
      ) pr_stats ON u.id = pr_stats.owner_id
    `);

    const userWorkouts = {};
    usersRes.rows.forEach(u => {
      userWorkouts[u.id] = [];
    });

    workoutsRes.rows.forEach(w => {
      if (userWorkouts[w.owner_id]) {
        userWorkouts[w.owner_id].push(w);
      }
    });

    const calculateStreak = (workouts) => {
      if (workouts.length === 0) return 0;
      const uniqueDates = [...new Set(workouts.map(w => formatDate(w.date)))].sort();
      let maxStreak = 0;
      let currentStreak = 0;
      let prevDate = null;

      uniqueDates.forEach(dStr => {
        const d = new Date(dStr);
        if (!prevDate) {
          currentStreak = 1;
        } else {
          const diffTime = Math.abs(d - prevDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            currentStreak++;
          } else if (diffDays > 1) {
            if (currentStreak > maxStreak) maxStreak = currentStreak;
            currentStreak = 1;
          }
        }
        prevDate = d;
      });
      if (currentStreak > maxStreak) maxStreak = currentStreak;
      return maxStreak;
    };

    const statsList = usersRes.rows.map(u => {
      const workouts = userWorkouts[u.id] || [];
      
      let runningKm = 0;
      let runningSessions = 0;
      let runningPaceSum = 0;

      let cyclingKm = 0;
      let cyclingRides = 0;
      let cyclingSpeedSum = 0;

      let totalCalories = 0;
      let totalTimeMinutes = 0;

      workouts.forEach(w => {
        const d = w.distance ? Number(w.distance) : 0;
        
        let mins = 30;
        if (w.duration) {
          const parts = w.duration.split(':').map(Number);
          if (parts.length === 3) mins = parts[0] * 60 + parts[1] + parts[2]/60;
          else if (parts.length === 2) mins = parts[0] + parts[1]/60;
          else if (!isNaN(Number(w.duration))) mins = Number(w.duration);
        }
        totalTimeMinutes += mins;

        totalCalories += estimateWorkoutCalories(w.sport, w.duration, w.rpe);

        if (w.sport === 'Running') {
          runningKm += d;
          runningSessions++;
          if (d > 0 && mins > 0) {
            runningPaceSum += (mins / d);
          }
        } else if (w.sport === 'Cycling') {
          cyclingKm += d;
          cyclingRides++;
          if (d > 0 && mins > 0) {
            cyclingSpeedSum += (d / (mins / 60));
          }
        }
      });

      const avgRunningPace = runningSessions > 0 && runningKm > 0 ? (runningPaceSum / runningSessions) : 0;
      const avgCyclingSpeed = cyclingRides > 0 && cyclingKm > 0 ? (cyclingSpeedSum / cyclingRides) : 0;
      const streak = calculateStreak(workouts);
      
      const score = Math.round(
        (runningKm * 2) + 
        (cyclingKm * 0.5) + 
        (streak * 15) + 
        (workouts.length * 10) + 
        (Number(u.pr_count) * 20)
      );

      return {
        id: u.id,
        athlete: u.name || u.email.split('@')[0],
        photo: u.photo,
        runningKm: Math.round(runningKm * 10) / 10,
        runningSessions,
        avgRunningPace: avgRunningPace > 0 ? `${Math.floor(avgRunningPace)}:${String(Math.round((avgRunningPace % 1) * 60)).padStart(2, '0')} /km` : '-',
        cyclingKm: Math.round(cyclingKm * 10) / 10,
        cyclingRides,
        avgCyclingSpeed: avgCyclingSpeed > 0 ? `${Math.round(avgCyclingSpeed * 10) / 10} km/h` : '-',
        totalCalories,
        streak,
        workoutHours: Math.round((totalTimeMinutes / 60) * 10) / 10,
        score
      };
    });

    const rankList = (list, sortKey) => {
      const sorted = [...list].sort((a, b) => b[sortKey] - a[sortKey]);
      return sorted.map((item, index) => {
        const rank = index + 1;
        let trophy = '';
        if (rank === 1) trophy = '🥇 Gold Trophy';
        else if (rank === 2) trophy = '🥈 Silver Trophy';
        else if (rank === 3) trophy = '🥉 Bronze Trophy';
        else if (rank === 4) trophy = '🏅 Platinum Badge';
        else if (rank === 5) trophy = '🎖 Elite Badge';
        
        return {
          ...item,
          rank,
          trophy
        };
      });
    };

    res.json({
      running: rankList(statsList.filter(s => s.runningKm > 0), 'runningKm'),
      cycling: rankList(statsList.filter(s => s.cyclingKm > 0), 'cyclingKm'),
      calories: rankList(statsList.filter(s => s.totalCalories > 0), 'totalCalories'),
      consistency: rankList(statsList.filter(s => s.streak > 0), 'streak'),
      workoutTime: rankList(statsList.filter(s => s.workoutHours > 0), 'workoutHours'),
      overall: rankList(statsList, 'score')
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error fetching leaderboard');
  }
});

// --- DB INITIALIZATION & STARTUP ---

const startServer = async () => {
  try {
    // Run database migrations on start
    await runMigrations();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to run migrations or start server:', err);
    try {
      const fs = await import('fs');
      fs.writeFileSync('backend_error.log', `Error: ${err.message}\nStack: ${err.stack}\n`);
    } catch (fsErr) {
      console.error('Failed to write error log:', fsErr);
    }
    process.exit(1);
  }
};

startServer();
