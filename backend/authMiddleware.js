import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_athleteos_2026';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized: No token provided');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch latest user status and role directly from DB
    const userRes = await pool.query('SELECT id, email, role, status FROM users WHERE id = $1', [decoded.id]);
    if (userRes.rowCount === 0) {
      return res.status(401).send('Unauthorized: User no longer exists');
    }

    const dbUser = userRes.rows[0];
    if (dbUser.status !== 'Active') {
      return res.status(403).send('Forbidden: Account has been deactivated');
    }

    req.user = dbUser; // Contains id, email, role, status
    next();
  } catch (err) {
    console.error('JWT Verification error:', err.message);
    return res.status(401).send('Unauthorized: Invalid or expired token');
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
     return res.status(403).send('Forbidden: Admin access required');
  }
  next();
};
