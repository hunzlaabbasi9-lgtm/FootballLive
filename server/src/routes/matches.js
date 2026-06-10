import express from "express";
import { requireAuth, requirePaid } from "../middleware.js";
import { getMockMatches } from "../mock.js";
import { rankServers } from "../streamProbe.js";

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

// Fresh stream URLs for a match (signed links expire quickly — call when opening Watch).
router.get("/matches/refresh", requireAuth, requirePaid, async (req, res) => {
  const { home, away, status } = req.query;
  if (!home || !away) {
    return res.status(400).json({ error: "home and away team names required" });
  }

  if (!RAPIDAPI_KEY) {
    const mock = getMockMatches({ status: status || "live", page: 1 });
    const match = mock.matches.find(
      (m) => m.home_team_name === home && m.away_team_name === away
    );
    return res.json({ source: "mock", match: match || null });
  }

  const find = (list) =>
    list.find((m) => m.home_team_name === home && m.away_team_name === away);

  try {
    for (let page = 1; page <= 3; page++) {
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.set("status", status);

      const upstream = await fetch(`${API_BASE}/matches?${params}`, {
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": RAPIDAPI_HOST,
        },
      });
      if (!upstream.ok) break;

      const data = await upstream.json();
      const hit = find(data.matches || []);
      if (hit) {
        const servers = await rankServers(hit.servers || []);
        return res.json({
          source: "live",
          match: { ...hit, servers },
          probedAt: Date.now(),
        });
      }
      if (!data.pagination?.hasNext) break;
    }
    res.json({ source: "live", match: null });
  } catch (err) {
    console.error("Refresh failed:", err.message);
    res.status(502).json({ error: "Could not refresh match streams" });
  }
});

export default router;
