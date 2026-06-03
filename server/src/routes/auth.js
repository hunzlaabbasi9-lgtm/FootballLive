import express from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { createUser, findUserByEmail, publicUser, setSessionToken } from "../store.js";
import { signToken, requireAuth } from "../middleware.js";

const router = express.Router();

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !emailRe.test(email)) return res.status(400).json({ error: "Valid email required" });
  if (!password || password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (await findUserByEmail(email)) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await createUser({ email, name: name?.trim() || email.split("@")[0], passwordHash });
  const user = await setSessionToken(created.id, randomUUID());
  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const found = await findUserByEmail(email);
  if (!found) return res.status(401).json({ error: "Invalid email or password" });
  const ok = await bcrypt.compare(password, found.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  // Rotate session token — invalidates any other active sessions immediately.
  const user = await setSessionToken(found.id, randomUUID());
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

// Returns the current user (used by the client to restore session on refresh).
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// Clears the session token so no device can use the old JWT after logout.
router.post("/logout", requireAuth, async (req, res) => {
  await setSessionToken(req.user.id, null);
  res.json({ ok: true });
});

export default router;
