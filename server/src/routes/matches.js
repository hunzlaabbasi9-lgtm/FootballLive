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

  if (bohoConfigured()) {
    try {
      const data = await getBohoMatches({ status: tabStatus, page: pageNum, date: date || null });
      return res.json({ source: "boho", ...data });
    } catch (err) {
      console.error("BOHO matches error:", err.message);
      return res.json({
        ...getMockMatches({ status: tabStatus, page: pageNum }),
        upstreamError: "boho_failed",
      });
    }
  }

  if (!RAPIDAPI_KEY) {
    return res.json(getMockMatches({ status: tabStatus, page: pageNum }));
  }

  try {
    const data = await fetch1xapiMatches({
      status: tabStatus,
      page: pageNum,
      league,
      type,
      date,
    });
    res.json({ source: "live", ...data });
  } catch (err) {
    console.error("1xapi matches error:", err.message);
    res.json({
      ...getMockMatches({ status: tabStatus, page: pageNum }),
      upstreamError: "fetch_failed",
    });
  }
});

// Fresh embed URLs for Watch (BOHO) or stream servers (1xapi).
router.get("/matches/refresh", requireAuth, requirePaid, async (req, res) => {
  const { home, away, status, boho_id: bohoId } = req.query;

  if (bohoConfigured()) {
    if (!bohoId && (!home || !away)) {
      return res.status(400).json({ error: "boho_id or home and away team names required" });
    }
    try {
      const match = await findBohoMatch({
        bohoId: bohoId || null,
        home,
        away,
        status: status || undefined,
      });
      return res.json({ source: "boho", match, probedAt: Date.now() });
    } catch (err) {
      console.error("BOHO refresh error:", err.message);
      return res.status(502).json({ error: "Could not refresh match stream" });
    }
  }

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
      const data = await fetch1xapiMatches({ status, page });
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
