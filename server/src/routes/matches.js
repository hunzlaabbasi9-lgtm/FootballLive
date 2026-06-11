import express from "express";
import { requireAuth, requirePaid } from "../middleware.js";
import { getMockMatches } from "../mock.js";
import { bohoConfigured, findBohoMatch, getBohoMatches } from "../bohoStream.js";
import { rankServers } from "../streamProbe.js";

const router = express.Router();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "football-live-streaming-api.p.rapidapi.com";
const API_BASE = `https://${RAPIDAPI_HOST}`;

const has1xapi = () => Boolean(RAPIDAPI_KEY);

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

// Which match sources are configured — lets the client show source tabs.
router.get("/match-sources", requireAuth, (req, res) => {
  res.json({ boho: bohoConfigured(), oneXapi: has1xapi() });
});

// All match data is behind auth AND payment.
// Optional ?source=boho|1xapi forces a specific provider; otherwise it falls
// back BOHO -> 1xapi -> mock.
router.get("/matches", requireAuth, requirePaid, async (req, res) => {
  const { status, page = "1", league, type, date, source } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const tabStatus = status === "all" ? undefined : status;
  const mock = () => getMockMatches({ status: tabStatus, page: pageNum });

  const tryBoho = async () => ({
    source: "boho",
    ...(await getBohoMatches({ status: tabStatus, page: pageNum, date: date || null })),
  });
  const try1xapi = async () => ({
    source: "1xapi",
    ...(await fetch1xapiMatches({ status: tabStatus, page: pageNum, league, type, date })),
  });

  // Explicit source requested.
  if (source === "boho") {
    if (!bohoConfigured()) return res.json({ ...mock(), source: "mock", note: "boho_not_configured" });
    try { return res.json(await tryBoho()); }
    catch (err) { console.error("BOHO error:", err.message); return res.json({ ...mock(), upstreamError: "boho_failed" }); }
  }
  if (source === "1xapi") {
    if (!has1xapi()) return res.json({ ...mock(), source: "mock", note: "1xapi_not_configured" });
    try { return res.json(await try1xapi()); }
    catch (err) { console.error("1xapi error:", err.message); return res.json({ ...mock(), upstreamError: "1xapi_failed" }); }
  }

  // Default fallback chain: BOHO -> 1xapi -> mock.
  if (bohoConfigured()) {
    try { return res.json(await tryBoho()); }
    catch (err) { console.error("BOHO error (falling back):", err.message); }
  }
  if (has1xapi()) {
    try { return res.json(await try1xapi()); }
    catch (err) { console.error("1xapi error (falling back):", err.message); }
  }
  return res.json({
    ...mock(),
    ...(bohoConfigured() || has1xapi() ? { upstreamError: "all_sources_failed" } : {}),
  });
});

// Fresh embed URLs for Watch (BOHO) or stream servers (1xapi).
// Honours ?source= so the Watch page refreshes from the same provider.
router.get("/matches/refresh", requireAuth, requirePaid, async (req, res) => {
  const { home, away, status, boho_id: bohoId, source } = req.query;

  const find = (list) =>
    (list || []).find((m) => m.home_team_name === home && m.away_team_name === away);

  const refreshBoho = async () => {
    const match = await findBohoMatch({ bohoId: bohoId || null, home, away, status: status || undefined });
    return { source: "boho", match, probedAt: Date.now() };
  };
  const refresh1xapi = async () => {
    for (let page = 1; page <= 3; page++) {
      const data = await fetch1xapiMatches({ status, page });
      const hit = find(data.matches);
      if (hit) {
        const servers = await rankServers(hit.servers || []);
        return { source: "1xapi", match: { ...hit, servers }, probedAt: Date.now() };
      }
      if (!data.pagination?.hasNext) break;
    }
    return { source: "1xapi", match: null };
  };

  const canBoho = bohoConfigured() && (bohoId || (home && away));
  const can1xapi = has1xapi() && home && away;

  // Explicit source.
  if (source === "1xapi" && can1xapi) {
    try { return res.json(await refresh1xapi()); }
    catch (err) { console.error("1xapi refresh error:", err.message); return res.status(502).json({ error: "Could not refresh match stream" }); }
  }
  if (source === "boho" && canBoho) {
    try { return res.json(await refreshBoho()); }
    catch (err) { console.error("BOHO refresh error:", err.message); return res.status(502).json({ error: "Could not refresh match stream" }); }
  }

  // Default chain.
  if (canBoho) {
    try { return res.json(await refreshBoho()); }
    catch (err) { console.error("BOHO refresh error (falling back):", err.message); }
  }
  if (can1xapi) {
    try { return res.json(await refresh1xapi()); }
    catch (err) { console.error("1xapi refresh error (falling back):", err.message); }
  }

  if (!bohoConfigured() && !has1xapi()) {
    if (!home || !away) return res.status(400).json({ error: "home and away team names required" });
    const mock = getMockMatches({ status: status || "live", page: 1 });
    return res.json({ source: "mock", match: find(mock.matches) || null });
  }
  if (!bohoId && (!home || !away)) {
    return res.status(400).json({ error: "boho_id or home and away team names required" });
  }
  return res.status(502).json({ error: "Could not refresh match stream" });
});

export default router;
