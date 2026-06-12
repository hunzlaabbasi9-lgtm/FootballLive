const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const embedUrl =
  "https://sport99.live/embed/?id=canada-bosnia-and-herzegovina-15186836&source=tv";
const referer = new URL(embedUrl).origin + "/embed/";

const embedHtml = await fetch(embedUrl, { headers: { "User-Agent": UA, Referer: referer } }).then((r) =>
  r.text()
);
const streamUrl = new URL(
  embedHtml.match(/<iframe[^>]+src=["']([^"']+)["']/i)[1].replace(/&amp;/g, "&"),
  embedUrl
).href;
const html = await fetch(streamUrl, {
  headers: { "User-Agent": UA, Referer: referer, Origin: "https://sport99.live" },
}).then((r) => r.text());

const decoded = html.replace(/&amp;/g, "&");
const servers = [
  ...decoded.matchAll(
    /<button[^>]*onclick="switchServer\('([^']+)'\)"[^>]*>([^<]+)<\/button>/gi
  ),
].map((m) => ({ name: m[2].trim(), url: m[1] }));

console.log("servers", servers.length);
servers.slice(0, 15).forEach((s) => console.log(s.name));
