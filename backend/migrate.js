import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const client = await pool.connect();
  try {
    // Create migrations tracker table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('Migrations directory does not exist.');
      return;
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    console.log(`Found ${files.length} migration files.`);

    for (const file of files) {
      const checkRes = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
      if (checkRes.rowCount > 0) {
        console.log(`Migration ${file} already run. Skipping.`);
        continue;
      }

      console.log(`Running migration ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`Migration ${file} executed successfully.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error in migration ${file}:`, err);
        throw err;
      }
    }
    console.log('All migrations completed.');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations().then(() => {
    console.log('Migration execution finished.');
    process.exit(0);
  }).catch((err) => {
    console.error('Migration execution failed:', err);
    process.exit(1);
  });
}

export default runMigrations;
