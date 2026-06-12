const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function embedReferer(embedUrl) {
  try {
    return new URL(embedUrl).origin + "/embed/";
  } catch {
    return "https://sport99.live/embed/";
  }
}

function parseStreamPhpUrl(embedHtml, embedUrl) {
  const match = embedHtml.match(/<iframe[^>]+src=["']([^"']*stream\.php[^"']*)["']/i);
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

/**
 * SportSRC embed pages wrap a player that opens ad popups and blocks sandboxed
 * iframes. Resolve the embed to direct HLS mirrors instead.
 */
export async function resolveSportSrcEmbed(embedUrl) {
  const referer = embedReferer(embedUrl);

  const embedRes = await fetch(embedUrl, {
    headers: { "User-Agent": UA, Referer: referer },
    signal: AbortSignal.timeout(20_000),
    redirect: "follow",
  });
  if (!embedRes.ok) throw new Error(`embed ${embedRes.status}`);

  const embedHtml = await embedRes.text();
  const streamPhpUrl = parseStreamPhpUrl(embedHtml, embedUrl);
  if (!streamPhpUrl) throw new Error("no stream.php iframe");

  const streamRes = await fetch(streamPhpUrl, {
    headers: { "User-Agent": UA, Referer: referer },
    signal: AbortSignal.timeout(20_000),
    redirect: "follow",
  });
  if (!streamRes.ok) throw new Error(`stream ${streamRes.status}`);

  const streamHtml = await streamRes.text();
  if (/LINK EXPIRED/i.test(streamHtml)) throw new Error("embed link expired");

  const streamData = parseStreamData(streamHtml);
  if (!streamData?.length) throw new Error("no stream data");

  return streamData
    .filter((s) => s?.proxy || s?.cdn)
    .map((s, i) => ({
      name: s.name || `Mirror ${i + 1}`,
      type: "direct",
      url: s.proxy || s.cdn,
      header: { referer },
    }));
}

export async function resolveBohoSources(sources = []) {
  if (!sources.length) {
    return [{ name: "Live Match Feed", type: "embed", url: null }];
  }

  const servers = [];

  for (const src of sources) {
    const label = `Stream ${src.streamNo || servers.length + 1}${src.hd ? " HD" : ""}`;

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
