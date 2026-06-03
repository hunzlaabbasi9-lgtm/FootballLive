import "dotenv/config";
import express from "express";
import cors from "cors";

import { initDb } from "./db.js";
import authRoutes from "./routes/auth.js";
import paymentRoutes, { STRIPE_ENABLED } from "./routes/payment.js";
import matchesRoutes from "./routes/matches.js";
import streamRoutes from "./routes/stream.js";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Allow one or more comma-separated client origins (e.g. local + Vercel).
// Trailing slashes are tolerated. Requests with no Origin (curl, health
// checks, native players) are allowed through.
const allowedOrigins = CLIENT_URL.split(",").map((o) => o.trim().replace(/\/$/, "")).filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    stripe: STRIPE_ENABLED ? "live" : "mock",
    matches: process.env.RAPIDAPI_KEY ? "live" : "mock",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api", matchesRoutes); // exposes /api/matches
app.use("/api/stream", streamRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n  ⚽  World Cup Stream API running on http://localhost:${PORT}`);
      console.log(`      Database: Neon PostgreSQL (connected)`);
      console.log(`      Payments: ${STRIPE_ENABLED ? "Stripe (live keys)" : "MOCK mode"}`);
      console.log(`      Matches:  ${process.env.RAPIDAPI_KEY ? "RapidAPI (live)" : "MOCK data"}\n`);
    });
  })
  .catch((err) => {
    console.error("\n  ✗ Failed to connect to the database:", err.message, "\n");
    process.exit(1);
  });
