import { resolveBohoSources } from "./embedResolve.js";

const BOHO_HOST = process.env.BOHO_RAPIDAPI_HOST || "football-streaming-api-match-data.p.rapidapi.com";
const BOHO_KEY = process.env.BOHO_RAPIDAPI_KEY || "";
const BOHO_BASE = `https://${BOHO_HOST}`;

export function bohoConfigured() {
  return Boolean(BOHO_KEY);
}

async function bohoFetch(params) {
  const url = new URL(`${BOHO_BASE}/v2/`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": BOHO_KEY,
      "X-RapidAPI-Host": BOHO_HOST,
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BOHO ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function flattenMatches(payload) {
  const groups = payload?.data || [];
  const out = [];
  for (const group of groups) {
    const league = group.league || {};
    for (const m of group.matches || []) {
      out.push({ m, league });
    }
  }
  return out;
}

function normTeam(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function teamsMatch(a, b) {
  const x = normTeam(a);
  const y = normTeam(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
}

export function normalizeBohoMatch(m, league = {}, servers = []) {
  const live = m.status === "inprogress";
  const finished = m.status === "finished" || m.status === "ended" || m.status === "ft";
  const matchServers =
    servers.length > 0
      ? servers
      : [{ name: "Live Match Feed", type: "embed", url: null }];

  return {
    boho_id: m.id,
    home_team_name: m.teams?.home?.name || "",
    away_team_name: m.teams?.away?.name || "",
    home_team_logo: m.teams?.home?.badge || "",
    away_team_logo: m.teams?.away?.badge || "",
    league_name: league.name || m.league?.name || "",
    league_logo: league.logo || m.league?.logo || "",
    match_status: live ? "live" : finished ? "finished" : "vs",
    homeTeamScore: m.score?.current?.home ?? 0,
    awayTeamScore: m.score?.current?.away ?? 0,
    match_time: Math.floor((m.timestamp || 0) / 1000),
    status_detail: m.status_detail || null,
    servers: matchServers,
  };
}

function bohoStatusFilter(status) {
  if (status === "live") return "inprogress";
  if (status === "vs") return "notstarted";
  return null;
}

export async function getBohoMatches({ status, page = 1, perPage = 20, date } = {}) {
  const params = { type: "matches" };
  const bohoStatus = bohoStatusFilter(status);
  if (bohoStatus) params.status = bohoStatus;
  if (date) params.date = date;

  const payload = await bohoFetch(params);
  const flat = flattenMatches(payload).map(({ m, league }) => normalizeBohoMatch(m, league));

  const total = flat.length;
  const start = (page - 1) * perPage;
  const matches = flat.slice(start, start + perPage);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return {
    matches,
    pagination: {
      page,
      perPage,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function getBohoDetail(matchId) {
  const payload = await bohoFetch({ type: "detail", id: matchId });
  const info = payload?.data?.match_info;
  const sources = payload?.data?.sources || [];
  if (!info) return null;

  const league = info.league || {};
  const servers = await resolveBohoSources(sources);
  return {
    ...normalizeBohoMatch(info, league, servers),
    venue: payload?.data?.info?.venue || null,
    referee: payload?.data?.info?.referee || null,
  };
}

export async function findBohoMatch({ bohoId, home, away, status } = {}) {
  if (bohoId) {
    return getBohoDetail(bohoId);
  }

  const params = { type: "matches" };
  const bohoStatus = bohoStatusFilter(status);
  if (bohoStatus) params.status = bohoStatus;

  const payload = await bohoFetch(params);
  const flat = flattenMatches(payload);

  const hit = flat.find(
    ({ m }) => teamsMatch(m.teams?.home?.name, home) && teamsMatch(m.teams?.away?.name, away)
  );
  if (!hit) return null;

  return getBohoDetail(hit.m.id);
}
