import { buildUpstreamHeaders } from "./streamHeaders.js";
import { isIpLockedCdn } from "./streamUtils.js";

const PROBE_MS = 5000;

function manifestUrl(server) {
  return (server?.url || "").split("|")[0];
}

export async function probeServer(server) {
  if (isIpLockedCdn(server)) return false;

  const url = manifestUrl(server);
  if (!url) return false;

  const header = server?.header || {};
  const attempts = [
    buildUpstreamHeaders(url, {
      ua: header["user-agent"],
      referer: header.referer,
    }),
    buildUpstreamHeaders(url, { ua: header["user-agent"] }),
    { Accept: "*/*", "User-Agent": header["user-agent"] || undefined },
  ].filter(Boolean);

  for (const headers of attempts) {
    Object.keys(headers).forEach((k) => headers[k] === undefined && delete headers[k]);
    try {
      const res = await fetch(url, {
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(PROBE_MS),
      });
      if (res.ok) return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

/** Reachable servers first; each tagged with `reachable` boolean. */
export async function rankServers(servers = []) {
  const ranked = await Promise.all(
    servers.map(async (s) => ({ server: s, ok: await probeServer(s) }))
  );
  const up = ranked.filter((r) => r.ok).map((r) => ({ ...r.server, reachable: true }));
  const down = ranked.filter((r) => !r.ok).map((r) => ({
    ...r.server,
    reachable: false,
    offlineReason: isIpLockedCdn(r.server) ? "ip_locked" : "unreachable",
  }));
  return [...up, ...down];
}
