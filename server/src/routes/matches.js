import express from "express";
import { requireAuth, requirePaid } from "../middleware.js";
import { getMockMatches } from "../mock.js";

const router = express.Router();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "football-live-streaming-api.p.rapidapi.com";
const API_BASE = `https://${RAPIDAPI_HOST}`;

// All match data is behind auth AND payment.
router.get("/matches", requireAuth, requirePaid, async (req, res) => {
  const { status, page = "1", league, type, date } = req.query;
  const pageNum = parseInt(page, 10) || 1;

  // No key -> serve themed mock data.
  if (!RAPIDAPI_KEY) {
    return res.json(getMockMatches({ status, page: pageNum }));
  }

  const params = new URLSearchParams({ page: String(pageNum) });
  if (status) params.set("status", status);
  if (league) params.set("league", league);
  if (type) params.set("type", type);
  if (date) params.set("date", date);

  try {
    const upstream = await fetch(`${API_BASE}/matches?${params}`, {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    });
    if (!upstream.ok) {
      const text = await upstream.text();
      console.error("Upstream error", upstream.status, text.slice(0, 200));
      // Fall back to mock so the UI never breaks.
      return res.json({ ...getMockMatches({ status, page: pageNum }), upstreamError: upstream.status });
    }
    const data = await upstream.json();
    res.json({ source: "live", ...data });
  } catch (err) {
    console.error("Fetch failed:", err.message);
    res.json({ ...getMockMatches({ status, page: pageNum }), upstreamError: "fetch_failed" });
  }
});

export default router;
