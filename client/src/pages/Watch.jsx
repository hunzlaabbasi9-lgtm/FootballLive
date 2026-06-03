import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Hls from "hls.js";

function buildProxyUrl(server) {
  const token = localStorage.getItem("wc_token") || "";
  const raw = (server.url || "").split("|")[0];
  const p = new URLSearchParams({ url: raw, token });
  if (server.header?.referer) p.set("referer", server.header.referer);
  if (server.header?.["user-agent"]) p.set("ua", server.header["user-agent"]);
  return `/api/stream/proxy?${p.toString()}`;
}

const TYPE_META = {
  direct: { icon: "cloud", tag: "DIRECT", sub: "Low latency · Ultra HD" },
  referer: { icon: "cloud_queue", tag: "CDN", sub: "High-bandwidth mirror" },
  drm: { icon: "security", tag: "DRM", sub: "Encrypted premium feed" },
};

export default function Watch() {
  const { index } = useParams();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [match, setMatch] = useState(null);
  const [active, setActive] = useState(0);
  const [playerError, setPlayerError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("wc_match");
    if (stored) setMatch(JSON.parse(stored));
  }, [index]);

  const servers = useMemo(() => match?.servers || [], [match]);
  const current = servers[active];
  const isDrm = current?.type === "drm";
  const live = match?.match_status === "live";

  useEffect(() => {
    if (!current || isDrm) return;
    const video = videoRef.current;
    if (!video) return;

    setPlayerError("");
    const src = buildProxyUrl(current);
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) setPlayerError("This stream could not be loaded. Try another server.");
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", () => video.play().catch(() => {}));
      video.addEventListener("error", () => setPlayerError("This stream could not be loaded. Try another server."));
    } else {
      setPlayerError("Your browser cannot play HLS streams.");
    }

    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [current, isDrm]);

  if (!match) {
    return (
      <div className="flex-grow grid place-items-center px-5 sm:px-margin-edge py-32">
        <div className="glass-card rounded-2xl p-xl text-center">
          <p className="text-on-surface-variant">Match not found.</p>
          <Link to="/matches" className="inline-block mt-md bg-primary-container text-on-primary-container font-label-caps px-lg py-3 rounded-xl hover:brightness-110 transition-all">← Back to matches</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Back nav */}
      <div className="max-w-[1440px] mx-auto px-5 sm:px-margin-edge py-md">
        <Link to="/matches" className="inline-flex items-center gap-2 text-on-surface/40 hover:text-primary transition-colors font-label-caps text-[10px] tracking-widest uppercase group">
          <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Back to matches
        </Link>
      </div>

      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-gutter lg:px-margin-edge pb-xl">
        {/* Video + info */}
        <div className="flex-grow w-full min-w-0">
          <div className="relative aspect-video w-full bg-black overflow-hidden lg:rounded-2xl player-glow border border-white/5">
            {isDrm ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 px-6">
                <span className="material-symbols-outlined text-primary text-5xl">lock</span>
                <h3 className="bebas-headline text-3xl tracking-wide">DRM-Protected Stream</h3>
                <p className="text-on-surface-variant max-w-md text-sm">
                  This server uses Clearkey DRM (MPEG-DASH) which needs a native player. Pick a <b>direct</b> or <b>referer</b> server from the list.
                </p>
              </div>
            ) : (
              <video ref={videoRef} controls playsInline className="w-full h-full object-contain bg-black" />
            )}

            {/* Live badge */}
            {live && !isDrm && (
              <div className="absolute top-md right-md bg-black/40 backdrop-blur-md px-sm py-1.5 rounded-full flex items-center gap-2 border border-white/10 pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-error pulse-red" />
                <span className="font-label-caps text-[9px] tracking-[0.2em] text-on-surface">LIVE</span>
              </div>
            )}
          </div>

          {/* Match info */}
          <div className="px-5 sm:px-margin-edge lg:px-0 mt-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
              <div>
                <div className="text-secondary font-label-caps text-[11px] tracking-widest mb-xs uppercase opacity-90">{match.league_name}</div>
                <h1 className="bebas-headline text-headline-lg-mobile md:text-headline-lg flex items-center gap-sm uppercase">
                  {match.home_team_name} <span className="text-primary/40 text-sm font-sans font-bold">VS</span> {match.away_team_name}
                </h1>
              </div>
              <div className="flex items-center bg-surface-container-high/40 backdrop-blur rounded-2xl border border-white/5 overflow-hidden shrink-0">
                <ScoreCell value={live ? match.homeTeamScore || 0 : "–"} label={abbr(match.home_team_name)} primary />
                <ScoreCell value={live ? match.awayTeamScore || 0 : "–"} label={abbr(match.away_team_name)} />
              </div>
            </div>
            {playerError && (
              <div className="mt-md px-4 py-3 rounded-lg bg-error-container/20 border border-error/30 text-error text-sm">{playerError}</div>
            )}
          </div>
        </div>

        {/* Server sidebar */}
        <aside className="w-full lg:w-[400px] px-5 sm:px-margin-edge lg:px-0 shrink-0">
          <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-md bg-white/5 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-label-caps text-[11px] tracking-[0.15em] text-primary/60 uppercase">Streaming Servers</h2>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim shadow-[0_0_8px_#62de8e]" />
                <span className="text-[10px] text-secondary-fixed-dim font-medium">Optimal</span>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-white/5">
              {servers.map((s, i) => {
                const meta = TYPE_META[s.type] || { icon: "dns", tag: (s.type || "").toUpperCase(), sub: "Stream server" };
                const isActive = i === active;
                return (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`p-4 flex items-center justify-between text-left transition-all group ${isActive ? "bg-primary/5 border-l-[3px] border-primary" : "hover:bg-white/5 border-l-[3px] border-transparent"}`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-primary/10" : "bg-white/5 group-hover:bg-white/10"}`}>
                        <span className={`material-symbols-outlined text-[20px] ${isActive ? "text-primary fill-1" : "opacity-40"}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                          {meta.icon}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className={`font-title-md text-[14px] truncate ${isActive ? "text-primary font-bold" : "font-medium group-hover:text-primary transition-colors"}`}>
                          {s.name || `Server ${i + 1}`}
                        </div>
                        <div className="text-[11px] text-on-surface-variant/60 truncate">{meta.sub}</div>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded tracking-wider shrink-0 ${isActive ? "bg-primary/20 text-primary" : "text-on-surface/40 border border-white/10 group-hover:border-primary/40 group-hover:text-primary transition-colors"}`}>
                      {isActive ? "ACTIVE" : meta.tag}
                    </span>
                  </button>
                );
              })}
              {servers.length === 0 && (
                <p className="p-4 text-on-surface-variant/60 text-sm">No servers available for this match.</p>
              )}
            </div>

            <div className="p-md bg-black/20 flex items-start gap-sm text-on-surface-variant/40">
              <span className="material-symbols-outlined text-[16px] mt-0.5">info</span>
              <p className="text-[11px] leading-snug">Experiencing buffering? Try switching servers. DRM streams require a native player.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ScoreCell({ value, label, primary }) {
  return (
    <div className={`flex flex-col items-center px-lg py-sm ${primary ? "border-r border-white/5" : ""}`}>
      <div className={`bebas-headline text-display-sm leading-none ${primary ? "text-primary" : "text-on-surface"}`}>{value}</div>
      <div className="font-label-caps text-[9px] mt-2 opacity-40 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function abbr(name = "") {
  return name.slice(0, 3).toUpperCase();
}
