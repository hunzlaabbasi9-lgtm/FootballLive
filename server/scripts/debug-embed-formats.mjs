const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function inspectEmbed(embedUrl) {
  const referer = new URL(embedUrl).origin + "/embed/";
  const embedRes = await fetch(embedUrl, { headers: { "User-Agent": UA, Referer: referer } });
  const embedHtml = await embedRes.text();
  const m = embedHtml.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (!m) {
    console.log(embedUrl, "no iframe");
    return;
  }
  const streamUrl = new URL(m[1].replace(/&amp;/g, "&"), embedUrl).href;
  const streamRes = await fetch(streamUrl, {
    headers: { "User-Agent": UA, Referer: referer, Origin: new URL(embedUrl).origin },
  });
  const html = await streamRes.text();
  console.log("\n===", embedUrl.split("source=")[1] || embedUrl, "===");
  console.log("stream status", streamRes.status, "len", html.length);
  const dataMatch = html.match(/const\s+streamData\s*=\s*(\[[\s\S]*?\]);/);
  if (dataMatch) {
    try {
      const data = JSON.parse(dataMatch[1]);
      console.log("streamData count", data.length, data.slice(0, 2));
    } catch (e) {
      console.log("parse err", e.message, dataMatch[1].slice(0, 200));
    }
  } else {
    console.log("no streamData");
    if (/LINK EXPIRED|STREAM FAILED|OFFLINE|NOT AVAILABLE/i.test(html)) {
      console.log("message", html.replace(/\s+/g, " ").match(/(LINK EXPIRED|STREAM FAILED|OFFLINE|NOT AVAILABLE[^<]{0,80})/i)?.[0]);
    }
    console.log("snippet", html.replace(/\s+/g, " ").slice(0, 500));
  }
}

const matchId = "canada-bosnia-and-herzegovina-15186836";
for (const source of ["rapid", "tv", "ppv"]) {
  await inspectEmbed(`https://sport99.live/embed/?id=${matchId}&source=${source}`);
}
