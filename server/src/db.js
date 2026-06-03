// PostgreSQL connection (Neon) via a pooled node-postgres client.
import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("\n  ✗ DATABASE_URL is not set. Add your Neon connection string to server/.env\n");
  process.exit(1);
}

// Neon requires SSL. The connection string normally includes ?sslmode=require,
// and we also pass ssl here so it works regardless.
export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

export function query(text, params) {
  return pool.query(text, params);
}

// Create the users table on startup if it doesn't exist.
export async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email             TEXT UNIQUE NOT NULL,
      name              TEXT NOT NULL,
      password_hash     TEXT NOT NULL,
      has_paid          BOOLEAN NOT NULL DEFAULT FALSE,
      stripe_session_id TEXT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  // Case-insensitive uniqueness on email.
  await query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));`);
}
