import jwt from "jsonwebtoken";
import { findUserById, publicUser } from "./store.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_insecure_secret";

export function signToken(user) {
  return jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: "7d" });
}

// Verifies the Bearer token and attaches req.user (the full record).
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  // Accept the token from the Authorization header OR a ?token= query param.
  // Media elements (hls.js segments, native <video>) can't always set headers,
  // so the stream proxy passes the token in the URL instead.
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.query.token || null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const { uid } = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(uid);
    if (!user) return res.status(401).json({ error: "User no longer exists" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

// Must run after requireAuth. Blocks users who have not paid for access.
export function requirePaid(req, res, next) {
  if (!req.user?.hasPaid) {
    return res.status(402).json({ error: "Payment required", code: "PAYMENT_REQUIRED" });
  }
  next();
}

export { publicUser };
