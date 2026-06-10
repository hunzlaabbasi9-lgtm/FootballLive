import { WC_REGIONS } from "./wcBroadcasters.js";

const IPTV_BASE = "https://iptv-org.github.io/api";
const CACHE_MS = 60 * 60 * 1000; // 1 hour
const PROBE_MS = 12000;

let cache = { at: 0, channels: [], streams: [], logos: [] };
const reachCache = new Map();

async function loadJson(path) {
  const res = await fetch(`${IPTV_BASE}/${path}`, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`iptv-org ${path} returned ${res.status}`);
  return res.json();
}

async function ensureCatalog() {
  if (Date.now() - cache.at < CACHE_MS && cache.channels.length) return cache;
  const [channels, streams, logos] = await Promise.all([
    loadJson("channels.json"),
    loadJson("streams.json"),
    loadJson("logos.json"),
  ]);
  cache = { at: Date.now(), channels, streams, logos };
  return cache;
}

function streamCandidates(channelId, streams) {
  const candidates = streams.filter(
    (s) => s.channel === channelId && /\.m3u8/i.test(s.url) && s.label !== "Geo-blocked"
  );
  // Prefer official BBC Akamai / stable CDNs, then unlabeled, then fewer headers.
  candidates.sort((a, b) => {
    const score = (s) => {
      const url = s.url || "";
      let n = (s.label ? 4 : 0) + (s.referrer || s.user_agent ? 2 : 0);
      if (/akamaized\.net.*bbc|bbci\.co\.uk/i.test(url)) n -= 3;
      if (/queazified|bozztv|canlitvapp|nexyl/i.test(url)) n += 5;
      return n;
    };
    return score(a) - score(b);
  });
  return candidates;
}

function pickStream(channelId, streams, reachOk) {
  const candidates = streamCandidates(channelId, streams);
  if (!candidates.length) return null;
  if (reachOk) {
    return candidates.find((s) => reachOk.get(s.url.split("|")[0])) || null;
  }
  return candidates[0];
}

function logoFor(channelId, logos) {
  const hit = logos.find((l) => l.channel === channelId && l.in_use);
  return hit?.url || null;
}

function toServer(stream, channel, broadcaster, regionCode, streamNote) {
  const header = {};
  if (stream.referrer) header.referer = stream.referrer;
  if (stream.user_agent) header["user-agent"] = stream.user_agent;
  return {
    name: channel.name,
    broadcaster,
    region: regionCode,
    url: stream.url.split("|")[0],
    header,
    type: "iptv",
    quality: stream.quality || null,
    logo: null,
    streamNote: streamNote || null,
  };
}

async function isReachable(server) {
  const url = server.url;
  const cached = reachCache.get(url);
  if (cached && Date.now() - cached.at < 60_000) return cached.ok;

  const headers = { Accept: "*/*" };
  if (server.header?.referer) headers.Referer = server.header.referer;
  if (server.header?.["user-agent"]) headers["User-Agent"] = server.header["user-agent"];

  let ok = false;
  try {
    const res = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(PROBE_MS) });
    ok = res.ok;
  } catch {
    ok = false;
  }
  reachCache.set(url, { ok, at: Date.now() });
  return ok;
}

export async function getWcChannels({ region, probe = true } = {}) {
  const { channels, streams, logos } = await ensureCatalog();
  const byId = new Map(channels.map((c) => [c.id, c]));
  const regions = region ? WC_REGIONS.filter((r) => r.code === region) : WC_REGIONS;

  // Resolve all candidate servers first, then probe unique URLs in parallel.
  const buckets = regions.map((reg) => ({ reg, playable: [], external: [] }));

  // Collect every candidate URL per channel, then probe and keep the first working mirror.
  const pending = [];

  for (const bucket of buckets) {
    for (const bc of bucket.reg.broadcasters) {
      if (bc.externalUrl) {
        bucket.external.push({ name: bc.name, url: bc.externalUrl, note: bc.note || null });
      }
      for (const channelId of bc.channelIds || []) {
        const channel = byId.get(channelId);
        const candidates = streamCandidates(channelId, streams);
        if (!channel || !candidates.length) continue;
        pending.push({ bucket, bc, channel, channelId, candidates });
      }
    }
  }

  const probeTargets = [
    ...new Map(
      pending.flatMap((p) =>
        p.candidates.map((stream) => {
          const server = toServer(stream, p.channel, p.bc.name, p.bucket.reg.code, p.bc.streamNote);
          return [server.url, server];
        })
      )
    ).values(),
  ];

  let reachOk = new Map();
  if (probe) {
    const results = await Promise.all(probeTargets.map(async (s) => [s.url, await isReachable(s)]));
    reachOk = new Map(results);
  }

  for (const { bucket, bc, channel, channelId, candidates } of pending) {
    const stream = probe
      ? candidates.find((s) => reachOk.get(s.url.split("|")[0]))
      : candidates[0];
    if (!stream) continue;
    const server = toServer(stream, channel, bc.name, bucket.reg.code, bc.streamNote);
    server.logo = logoFor(channelId, logos);
    server.reachable = probe ? Boolean(reachOk.get(server.url)) : true;
    bucket.playable.push(server);
  }

  for (const bucket of buckets) {
    bucket.playable.sort((a, b) => Number(b.reachable) - Number(a.reachable));
  }

  return buckets.map(({ reg, playable, external }) => ({
    code: reg.code,
    name: reg.name,
    flag: reg.flag,
    channels: playable,
    external,
    coverage: reg.coverage || null,
    rightsNote: reg.rightsNote || null,
  }));
}
