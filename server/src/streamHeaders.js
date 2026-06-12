const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export function buildUpstreamHeaders(targetUrl, { ua, referer, origin } = {}) {
  const isManifest = /\.m3u8(\?|$)/i.test(targetUrl) || /\.mpd(\?|$)/i.test(targetUrl);
  const headers = {
    "User-Agent": ua || DEFAULT_UA,
    Accept: isManifest
      ? "application/vnd.apple.mpegurl,application/x-mpegURL,application/dash+xml,*/*;q=0.8"
      : "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Connection: "keep-alive",
  };

  let effectiveReferer = referer;
  if (!effectiveReferer && /cdnfaster|niues\.live|embedsport\.live/i.test(targetUrl)) {
    try {
      effectiveReferer = new URL(targetUrl).origin + "/";
    } catch {
      /* ignore */
    }
  }

  if (effectiveReferer) {
    headers.Referer = effectiveReferer;
    let refOrigin = origin;
    if (!refOrigin) {
      try {
        refOrigin = new URL(effectiveReferer).origin;
      } catch {
        /* ignore */
      }
    }
    if (refOrigin) headers.Origin = refOrigin;

    try {
      const target = new URL(targetUrl);
      const refHost = new URL(effectiveReferer).origin;
      headers["Sec-Fetch-Site"] = target.origin === refHost ? "same-origin" : "cross-site";
      headers["Sec-Fetch-Mode"] = isManifest ? "cors" : "no-cors";
      headers["Sec-Fetch-Dest"] = isManifest ? "empty" : "video";
    } catch {
      headers["Sec-Fetch-Site"] = "cross-site";
      headers["Sec-Fetch-Mode"] = "cors";
      headers["Sec-Fetch-Dest"] = "empty";
    }
  }

  return headers;
}
