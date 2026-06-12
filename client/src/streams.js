/** Split manifest URL from optional `|drmScheme=...&drmLicense=...` suffix. */
export function parseStreamUrl(server) {
  const full = server?.url || "";
  const pipeIdx = full.indexOf("|");
  const base = pipeIdx >= 0 ? full.slice(0, pipeIdx) : full;
  const extras = {};
  if (pipeIdx >= 0) {
    const params = new URLSearchParams(full.slice(pipeIdx + 1));
    for (const [k, v] of params.entries()) extras[k] = v;
  }
  return {
    manifestUrl: base.split("|")[0],
    drmScheme: extras.drmScheme || null,
    drmLicense: extras.drmLicense || null,
  };
}

export function matchServers(servers = []) {
  return (servers || []).filter((s) => s?.url || s?.type === "embed");
}

function proxyParams(server, token) {
  const { manifestUrl, drmScheme, drmLicense } = parseStreamUrl(server);
  const header = server?.header || {};
  const p = new URLSearchParams({ url: manifestUrl, token: token || "" });
  if (header.referer) {
    p.set("referer", header.referer);
    try {
      p.set("origin", new URL(header.referer).origin);
    } catch {
      /* ignore */
    }
  }
  if (header["user-agent"]) p.set("ua", header["user-agent"]);
  if (drmScheme) p.set("drmScheme", drmScheme);
  if (drmLicense) p.set("drmLicense", drmLicense);
  return p;
}

const SIGNED_CDN = /[?&](sign|expire|auth_key)=/i;
const MATCH_TYPES = new Set(["direct", "referer", "drm"]);

function needsProxy(server, manifestUrl) {
  const header = server?.header || {};
  // RapidAPI match feeds (incl. signed cdnfaster direct URLs) must not hit the CDN from the browser.
  if (MATCH_TYPES.has(server?.type)) return true;
  if (SIGNED_CDN.test(manifestUrl)) return true;
  if (/cdnfaster|niues\.live|camel4|sla\.homes|rapid\.streamapi\.cc|embedsport\.live/i.test(manifestUrl)) return true;
  if (header.referer || header["user-agent"]) return true;
  // BBC Akamai HLS blocks browser XHR (no CORS) — must proxy server-side.
  if (/akamaized\.net/i.test(manifestUrl) && /bbc|pips/i.test(manifestUrl)) return true;
  if (/bbci\.co\.uk/i.test(manifestUrl)) return true;
  // iptv-org TV channels without headers can play direct (e.g. Fox Sports 1).
  return false;
}

export function buildPlayUrl(server, apiBase, token) {
  const { manifestUrl } = parseStreamUrl(server);

  if (!needsProxy(server, manifestUrl) && /\.m3u8/i.test(manifestUrl)) {
    return manifestUrl;
  }

  return `${apiBase}/stream/proxy?${proxyParams(server, token).toString()}`;
}

/** Proxied license URL for dash.js Clearkey (same referer/UA as the stream). */
export function buildLicenseProxyUrl(licenseUrl, server, apiBase, token) {
  const header = server?.header || {};
  const p = new URLSearchParams({ url: licenseUrl, token: token || "" });
  if (header.referer) {
    p.set("referer", header.referer);
    try {
      p.set("origin", new URL(header.referer).origin);
    } catch {
      /* ignore */
    }
  }
  if (header["user-agent"]) p.set("ua", header["user-agent"]);
  return `${apiBase}/stream/proxy?${p.toString()}`;
}

export function isDrmServer(server) {
  return server?.type === "drm" || /\.mpd/i.test(server?.url || "") || Boolean(parseStreamUrl(server).drmScheme);
}

const IP_LOCKED_HOSTS = /sla\.homes|camel4\.live|liveplay\d*\.camel4/i;

/** auth_key referer mirrors are bound to 1xapi's IP — cannot play through our proxy. */
export function isIpLockedCdn(server) {
  const url = (server?.url || "").split("|")[0];
  if (!url) return false;
  if (server?.type === "referer" && /[?&]auth_key=/i.test(url)) return true;
  if (IP_LOCKED_HOSTS.test(url)) return true;
  return false;
}

export function isPlayBlocked(server) {
  // TV channels stay playable even if a slow probe timed out — let hls.js try.
  if (server?.type === "iptv") return false;
  return server?.offlineReason === "ip_locked" || isIpLockedCdn(server);
}
