const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function embedReferer(embedUrl) {
  try {
    const origin = new URL(embedUrl).origin;
    if (/embed\.streamapi\.cc/i.test(origin)) return origin + "/";
    return origin + "/embed/";
  } catch {
    return "https://sport99.live/embed/";
  }
}

function parseIframeSrc(embedHtml, embedUrl) {
  const match = embedHtml.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (!match) return null;
  const raw = match[1].replace(/&amp;/g, "&");
  try {
    return new URL(raw, embedUrl).href;
  } catch {
    return null;
  }
}

function parseStreamData(html) {
  const match = html.match(/const\s+streamData\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

function mirrorsFromStreamData(streamData, referer) {
  return streamData
    .filter((s) => s?.proxy || s?.cdn)
    .map((s, i) => ({
      name: s.name || `Mirror ${i + 1}`,
      type: "direct",
      url: s.proxy || s.cdn,
      header: { referer },
    }));
}

/** TV VIP player (source=tv) — named broadcaster buttons + HLS playlists. */
function parseTvVipServers(html, referer) {
  const decoded = html.replace(/&amp;/g, "&");
  const named = [
    ...decoded.matchAll(/<button[^>]*onclick="switchServer\('([^']+)'\)"[^>]*>([^<]+)<\/button>/gi),
  ].map((m) => ({ name: m[2].trim(), url: m[1] }));

  if (named.length) {
    return named.map((s) => ({
      name: s.name,
      type: "direct",
      url: s.url,
      header: { referer },
    }));
  }

  const urls = [
    ...new Set(
      [...decoded.matchAll(/https:\/\/cdn2\.embedsport\.live\/vip\/playlist\.m3u8\?[^"'`\s]+/g)].map(
        (m) => m[0]
      )
    ),
  ];
  if (!urls.length) return [];

  return urls.map((url, i) => ({
    name: `Channel ${i + 1}`,
    type: "direct",
    url,
    header: { referer },
  }));
}

async function fetchText(url, referer) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Referer: referer,
      Origin: new URL(referer).origin,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(20_000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return res.text();
}

/**
 * SportSRC embed pages wrap players that open ad popups and block sandboxed
 * iframes. Resolve supported formats to direct HLS mirrors instead.
 */
export async function resolveSportSrcEmbed(embedUrl) {
  if (/embed\.streamapi\.cc/i.test(embedUrl)) {
    throw new Error("streamapi embed wrapper");
  }

  const referer = embedReferer(embedUrl);
  const embedHtml = await fetchText(embedUrl, referer);
  const innerUrl = parseIframeSrc(embedHtml, embedUrl);
  if (!innerUrl) throw new Error("no iframe");

  const streamHtml = await fetchText(innerUrl, referer);
  if (/LINK EXPIRED/i.test(streamHtml)) throw new Error("embed link expired");

  const streamData = parseStreamData(streamHtml);
  if (streamData?.length) return mirrorsFromStreamData(streamData, referer);

  const tvServers = parseTvVipServers(streamHtml, referer);
  if (tvServers.length) return tvServers;

  if (/<iframe[^>]+id=["']ppv-iframe["']/i.test(streamHtml)) {
    throw new Error("ppv iframe player");
  }

  throw new Error("no stream data");
}

function sourceLabel(src, fallbackNo) {
  const no = src.streamNo || fallbackNo;
  const hd = src.hd ? " HD" : "";
  const lang =
    src.language && !/^unknown$/i.test(src.language) ? ` · ${src.language}` : "";
  return `Stream ${no}${hd}${lang}`;
}

export async function resolveBohoSources(sources = []) {
  if (!sources.length) {
    return [{ name: "Live Match Feed", type: "embed", url: null }];
  }

  const servers = [];

  for (const src of sources) {
    const label = sourceLabel(src, servers.length + 1);

    if (!src.embedUrl) {
      servers.push({ name: label, type: "embed", url: null, language: src.language || null });
      continue;
    }

    try {
      const mirrors = await resolveSportSrcEmbed(src.embedUrl);
      if (!mirrors.length) throw new Error("empty mirrors");

      for (const mirror of mirrors) {
        servers.push({
          ...mirror,
          name: mirrors.length > 1 ? `${label} · ${mirror.name}` : label,
          language: src.language || null,
        });
      }
    } catch (err) {
      console.warn("Embed resolve failed, keeping iframe fallback:", src.embedUrl, err.message);
      servers.push({
        name: label,
        type: "embed",
        url: src.embedUrl,
        language: src.language || null,
      });
    }
  }

  return servers.length ? servers : [{ name: "Live Match Feed", type: "embed", url: null }];
}
