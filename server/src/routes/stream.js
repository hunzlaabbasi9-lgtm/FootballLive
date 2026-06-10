import express from "express";
import { requireAuth, requirePaid } from "../middleware.js";

const router = express.Router();

// Build the upstream request headers from query params.
function upstreamHeaders(req) {
  const headers = {
    "User-Agent": req.query.ua || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    Accept: "*/*",
  };
  if (req.query.referer) headers["Referer"] = req.query.referer;
  // Many CDNs reject when a Referer is present but Origin is missing. If an
  // explicit origin wasn't passed, derive it from the referer.
  let origin = req.query.origin;
  if (!origin && req.query.referer) {
    try {
      origin = new URL(req.query.referer).origin;
    } catch {
      /* ignore malformed referer */
    }
  }
  if (origin) headers["Origin"] = origin;
  // Forward Range so byte-range segment requests work.
  if (req.headers.range) headers["Range"] = req.headers.range;
  return headers;
}

// Re-sign a URL so it flows back through this proxy with the same headers.
function proxify(absUrl, req) {
  // Behind Railway/Vercel the app sees http internally; trust the forwarded
  // proto so rewritten URLs stay https (otherwise the HTTPS page blocks them
  // as mixed content).
  const proto = (req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0].trim();
  const host = req.headers["x-forwarded-host"] || req.get("host");
  const base = `${proto}://${host}/api/stream/proxy`;
  const p = new URLSearchParams({ url: absUrl });
  if (req.query.referer) p.set("referer", req.query.referer);
  if (req.query.ua) p.set("ua", req.query.ua);
  if (req.query.origin) p.set("origin", req.query.origin);
  // Carry the auth token so segment/sub-playlist requests stay authorized.
  if (req.query.token) p.set("token", req.query.token);
  return `${base}?${p.toString()}`;
}

// Rewrite an HLS manifest so every variant / segment / key URI is proxied.
function rewriteManifest(text, manifestUrl, req) {
  const lines = text.split(/\r?\n/);
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      // Tag lines may carry URIs (keys, maps, etc.)
      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri) => {
          const abs = new URL(uri, manifestUrl).href;
          return `URI="${proxify(abs, req)}"`;
        });
      }
      // Plain URI line (a segment or a sub-playlist)
      const abs = new URL(trimmed, manifestUrl).href;
      return proxify(abs, req);
    })
    .join("\n");
}

// Proxy any stream resource. Requires auth + payment.
router.get("/proxy", requireAuth, requirePaid, async (req, res) => {
  const target = req.query.url;
  if (!target || !/^https?:\/\//i.test(target)) {
    return res.status(400).json({ error: "Valid url query param required" });
  }

  try {
    const upstream = await fetch(target, { headers: upstreamHeaders(req), redirect: "follow" });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream responded ${upstream.status}` });
    }

    const ctype = (upstream.headers.get("content-type") || "").toLowerCase();
    const isManifest =
      ctype.includes("mpegurl") ||
      ctype.includes("vnd.apple") ||
      /\.m3u8(\?|$)/i.test(target);

    res.setHeader("Access-Control-Allow-Origin", "*");

    if (isManifest) {
      const text = await upstream.text();
      const rewritten = rewriteManifest(text, upstream.url || target, req);
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      return res.send(rewritten);
    }

    // Binary passthrough (segments, keys, dash chunks).
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
