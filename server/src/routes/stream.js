import express from "express";
import { requireAuth, requirePaid } from "../middleware.js";
import { buildUpstreamHeaders } from "../streamHeaders.js";

const router = express.Router();

function upstreamHeaders(req, targetUrl) {
  const headers = buildUpstreamHeaders(targetUrl, {
    ua: req.query.ua,
    referer: req.query.referer,
    origin: req.query.origin,
  });
  if (req.headers.range) headers.Range = req.headers.range;
  return headers;
}

async function fetchUpstream(target, req) {
  const headerSets = [
    upstreamHeaders(req, target),
    buildUpstreamHeaders(target, { ua: req.query.ua, referer: req.query.referer }),
    buildUpstreamHeaders(target, { ua: req.query.ua }),
  ];

  let last;
  for (const headers of headerSets) {
    last = await fetch(target, { headers, redirect: "follow" });
    if (last.ok) return last;
    if (last.status !== 403) break;
  }
  return last;
}

function proxify(absUrl, req) {
  const proto = (req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0].trim();
  const host = req.headers["x-forwarded-host"] || req.get("host");
  const base = `${proto}://${host}/api/stream/proxy`;
  const p = new URLSearchParams({ url: absUrl });
  if (req.query.referer) p.set("referer", req.query.referer);
  if (req.query.ua) p.set("ua", req.query.ua);
  if (req.query.origin) p.set("origin", req.query.origin);
  if (req.query.token) p.set("token", req.query.token);
  if (req.query.drmScheme) p.set("drmScheme", req.query.drmScheme);
  if (req.query.drmLicense) p.set("drmLicense", req.query.drmLicense);
  return `${base}?${p.toString()}`;
}

function rewriteManifest(text, manifestUrl, req) {
  const lines = text.split(/\r?\n/);
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri) => {
          const abs = new URL(uri, manifestUrl).href;
          return `URI="${proxify(abs, req)}"`;
        });
      }
      const abs = new URL(trimmed, manifestUrl).href;
      return proxify(abs, req);
    })
    .join("\n");
}

// Rewrite DASH MPD so segments and sub-manifests flow through the proxy.
function rewriteMpd(text, mpdUrl, req) {
  const base = new URL(mpdUrl);
  let out = text.replace(/https?:\/\/[^\s"'<>]+/g, (match) => {
    if (match.includes("/api/stream/proxy")) return match;
    return proxify(match, req);
  });
  // Relative segment paths (common in MPD).
  out = out.replace(/>([^<]*\.(?:m4s|mp4|m4v|m4a|mpd)(\?[^<]*)?)</g, (full, rel) => {
    if (/^https?:\/\//i.test(rel)) return full;
    try {
      return `>${proxify(new URL(rel, base).href, req)}<`;
    } catch {
      return full;
    }
  });
  return out;
}

router.get("/proxy", requireAuth, requirePaid, async (req, res) => {
  const target = req.query.url;
  if (!target || !/^https?:\/\//i.test(target)) {
    return res.status(400).json({ error: "Valid url query param required" });
  }

  try {
    const upstream = await fetchUpstream(target, req);

    if (!upstream.ok) {
      console.warn(`Stream upstream ${upstream.status} for ${new URL(target).hostname}`);
      return res.status(upstream.status).json({ error: `Upstream responded ${upstream.status}` });
    }

    const ctype = (upstream.headers.get("content-type") || "").toLowerCase();
    const isHls =
      ctype.includes("mpegurl") ||
      ctype.includes("vnd.apple") ||
      /\.m3u8(\?|$)/i.test(target);
    const isMpd = ctype.includes("dash+xml") || /\.mpd(\?|$)/i.test(target);

    res.setHeader("Access-Control-Allow-Origin", "*");

    if (isHls) {
      const text = await upstream.text();
      const rewritten = rewriteManifest(text, upstream.url || target, req);
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      return res.send(rewritten);
    }

    if (isMpd) {
      const text = await upstream.text();
      const rewritten = rewriteMpd(text, upstream.url || target, req);
      res.setHeader("Content-Type", "application/dash+xml");
      return res.send(rewritten);
    }

    if (ctype) res.setHeader("Content-Type", ctype);
    const len = upstream.headers.get("content-length");
    if (len) res.setHeader("Content-Length", len);
    const range = upstream.headers.get("content-range");
    if (range) res.setHeader("Content-Range", range);
    res.setHeader("Accept-Ranges", "bytes");
    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.status(upstream.status).send(buf);
  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(502).json({ error: "Stream proxy failed" });
  }
});

export default router;
