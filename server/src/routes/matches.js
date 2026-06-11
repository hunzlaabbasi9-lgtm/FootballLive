import express from "express";
import { requireAuth, requirePaid } from "../middleware.js";
import { getMockMatches } from "../mock.js";
import { bohoConfigured, findBohoMatch, getBohoMatches } from "../bohoStream.js";
import { rankServers } from "../streamProbe.js";

const router = express.Router();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "football-live-streaming-api.p.rapidapi.com";
const API_BASE = `https://${RAPIDAPI_HOST}`;

async function fetch1xapiMatches({ status, page, league, type, date }) {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set("status", status);
  if (league) params.set("league", league);
  if (type) params.set("type", type);
  if (date) params.set("date", date);

  const upstream = await fetch(`${API_BASE}/matches?${params}`, {
    headers: {
      "X-RapidAPI-Key": RAPIDAPI_KEY,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
    },
  });
  if (!upstream.ok) {
    const text = await upstream.text();
    throw new Error(`1xapi ${upstream.status}: ${text.slice(0, 200)}`);
  }
  return upstream.json();
}

// All match data is behind auth AND payment.
router.get("/matches", requireAuth, requirePaid, async (req, res) => {
  const { status, page = "1", league, type, date } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const tabStatus = status === "all" ? undefined : status;

  // 1) BOHO (primary).
  if (bohoConfigured()) {
    try {
      const data = await getBohoMatches({ status: tabStatus, page: pageNum, date: date || null });
      return res.json({ source: "boho", ...data });
    } catch (err) {
      console.error("BOHO matches error (falling back):", err.message);
      // fall through to 1xapi / mock
    }
  }

  // 2) 1xapi (fallback when BOHO is unset or failed).
  if (RAPIDAPI_KEY) {
    try {
      const data = await fetch1xapiMatches({ status: tabStatus, page: pageNum, league, type, date });
      return res.json({ source: "live", ...data });
    } catch (err) {
      console.error("1xapi matches error (falling back):", err.message);
      // fall through to mock
    }
  }

  // 3) Mock (last resort, or when no keys are configured).
  const anyConfigured = bohoConfigured() || Boolean(RAPIDAPI_KEY);
  return res.json({
    ...getMockMatches({ status: tabStatus, page: pageNum }),
    ...(anyConfigured ? { upstreamError: "all_sources_failed" } : {}),
  });
});

// Fresh embed URLs for Watch (BOHO) or stream servers (1xapi).
router.get("/matches/refresh", requireAuth, requirePaid, async (req, res) => {
  const { home, away, status, boho_id: bohoId } = req.query;

  const find = (list) =>
    (list || []).find((m) => m.home_team_name === home && m.away_team_name === away);

  // 1) BOHO (primary).
  if (bohoConfigured() && (bohoId || (home && away))) {
    try {
      const match = await findBohoMatch({
        bohoId: bohoId || null,
        home,
        away,
        status: status || undefined,
      });
      return res.json({ source: "boho", match, probedAt: Date.now() });
    } catch (err) {
      console.error("BOHO refresh error (falling back):", err.message);
      // fall through to 1xapi / mock
    }
  }

  // 2) 1xapi (fallback) — needs team names.
  if (RAPIDAPI_KEY && home && away) {
    try {
      for (let page = 1; page <= 3; page++) {
        const data = await fetch1xapiMatches({ status, page });
        const hit = find(data.matches);
        if (hit) {
          const servers = await rankServers(hit.servers || []);
          return res.json({ source: "live", match: { ...hit, servers }, probedAt: Date.now() });
        }
        if (!data.pagination?.hasNext) break;
      }
      return res.json({ source: "live", match: null });
    } catch (err) {
      console.error("1xapi refresh error (falling back):", err.message);
      // fall through to mock / error
    }
  }

  // 3) Mock (no keys configured).
  if (!bohoConfigured() && !RAPIDAPI_KEY) {
    if (!home || !away) {
      return res.status(400).json({ error: "home and away team names required" });
    }
    const mock = getMockMatches({ status: status || "live", page: 1 });
    return res.json({ source: "mock", match: find(mock.matches) || null });
  }

  // A source is configured but every attempt failed.
  if (!bohoId && (!home || !away)) {
    return res.status(400).json({ error: "boho_id or home and away team names required" });
  }
  return res.status(502).json({ error: "Could not refresh match stream" });
});

export default router;
