// User store backed by PostgreSQL (Neon).
// Functions are async; callers must await them.
import { query } from "./db.js";

// Map a DB row (snake_case) to the shape the app uses (camelCase).
function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    hasPaid: row.has_paid,
    stripeSessionId: row.stripe_session_id,
    createdAt: row.created_at,
  };
}

export async function findUserByEmail(email) {
  const { rows } = await query("SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [email]);
  return rowToUser(rows[0]);
}

export async function findUserById(id) {
  const { rows } = await query("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
  return rowToUser(rows[0]);
}

export async function createUser({ email, name, passwordHash }) {
  const { rows } = await query(
    `INSERT INTO users (email, name, password_hash)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email, name, passwordHash]
  );
  return rowToUser(rows[0]);
}

// patch may contain: hasPaid, stripeSessionId, name.
export async function updateUser(id, patch) {
  const map = {
    hasPaid: "has_paid",
    stripeSessionId: "stripe_session_id",
    name: "name",
  };
  const sets = [];
  const values = [];
  let i = 1;
  for (const [key, col] of Object.entries(map)) {
    if (key in patch) {
      sets.push(`${col} = $${i++}`);
      values.push(patch[key]);
    }
  }
  if (sets.length === 0) return findUserById(id);

  values.push(id);
  const { rows } = await query(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return rowToUser(rows[0]);
}

// Strip sensitive fields before returning to the client.
export function publicUser(u) {
  if (!u) return null;
  const { passwordHash, ...safe } = u;
  return safe;
}
