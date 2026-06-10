import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import EmbedPlayer from "../components/EmbedPlayer";
import StreamPlayer from "../components/StreamPlayer";
import { isIpLockedCdn, matchServers } from "../streams";

const TYPE_META = {
  embed: { icon: "smart_display", tag: "EMBED", sub: "SportSRC live player" },
  direct: { icon: "cloud", tag: "DIRECT", sub: "Low latency · Ultra HD" },
  referer: { icon: "cloud_queue", tag: "CDN", sub: "High-bandwidth mirror" },
  drm: { icon: "security", tag: "DRM", sub: "Encrypted premium feed" },
};

function isEmbedServer(s) {
  return s?.type === "embed";
}

export default function Watch() {
  const { index } = useParams();
  const [match, setMatch] = useState(null);
  const [active, setActive] = useState(0);
  const [playerError, setPlayerError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const stored = sessionStorage.getItem("wc_match");
      if (!stored) return;
      const cached = JSON.parse(stored);
      setMatch(cached);

      setRefreshing(true);
      try {
        const { data } = await api.get("/matches/refresh", {
          params: {
            boho_id: cached.boho_id,
            home: cached.home_team_name,
            away: cached.away_team_name,
            status: cached.match_status,
          },
        });
        if (!cancelled && data.match) {
          setMatch(data.match);
          sessionStorage.setItem("wc_match", JSON.stringify(data.match));
        }
      } catch {
        /* keep cached match */
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [index]);

  const servers = useMemo(() => matchServers(match?.servers), [match]);
  const embedMode = servers.length > 0 && servers.every(isEmbedServer);
  const current = servers[active];
  const live = match?.match_status === "live";

  useEffect(() => {
    if (!servers.length) return;
    const firstWithUrl = servers.findIndex((s) => s.url);
    setActive(firstWithUrl >= 0 ? firstWithUrl : 0);
    setPlayerError("");
  }, [servers]);

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

  const matchTitle = `${match.home_team_name} vs ${match.away_team_name}`;

  return (
    <div className="w-full">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-margin-edge py-md">
        <Link to="/matches" className="inline-flex items-center gap-2 text-on-surface/40 hover:text-primary transition-colors font-label-caps text-[10px] tracking-widest uppercase group">
          <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Back to matches
        </Link>
      </div>

      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-gutter lg:px-margin-edge pb-xl">
        <div className="flex-grow w-full min-w-0">
          <div className="relative aspect-video w-full bg-black overflow-hidden lg:rounded-2xl player-glow border border-white/5">
            {!servers.length ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 px-6">
                <span className="material-symbols-outlined text-primary text-5xl">tv_off</span>
                <h3 className="bebas-headline text-3xl tracking-wide">No Match Stream</h3>
                <p className="text-on-surface-variant max-w-md text-sm">
                  No stream for this match yet. Try TV Broadcasters or another fixture.
                </p>
                <Link
                  to="/matches?tab=tv"
                  className="bg-secondary text-on-secondary px-lg py-sm rounded-full font-label-caps text-label-caps flex items-center gap-xs hover:brightness-110 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">live_tv</span>
                  TV Broadcasters
                </Link>
              </div>
            ) : refreshing ? (
              <div className="absolute inset-0 grid place-items-center">
                <div className="spinner" />
              </div>
            ) : embedMode ? (
              <EmbedPlayer
                key={current?.url || active}
                url={current?.url}
                title={matchTitle}
              />
            ) : (
              <StreamPlayer
                key={`${current?.url}-${active}`}
                source={current}
                onFatalError={() => setPlayerError("This server failed. Try another stream below.")}
              />
            )}

            {live && current?.url && (
              <div className="absolute top-md right-md bg-black/40 backdrop-blur-md px-sm py-1.5 rounded-full flex items-center gap-2 border border-white/10 pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-error pulse-red" />
                <span className="font-label-caps text-[9px] tracking-[0.2em] text-on-surface">LIVE</span>
              </div>
            )}
          </div>

          <div className="px-5 sm:px-margin-edge lg:px-0 mt-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
              <div>
                <div className="text-secondary font-label-caps text-[11px] tracking-widest mb-xs uppercase opacity-90">{match.league_name}</div>
                <h1 className="bebas-headline text-headline-lg-mobile md:text-headline-lg flex items-center gap-sm uppercase">
                  {match.home_team_name} <span className="text-primary/40 text-sm font-sans font-bold">VS</span> {match.away_team_name}
                </h1>
                {match.status_detail && (
                  <p className="text-on-surface-variant/70 text-sm mt-1">{match.status_detail}</p>
                )}
              </div>
              <div className="flex items-center bg-surface-container-high/40 backdrop-blur rounded-2xl border border-white/5 overflow-hidden shrink-0">
                <ScoreCell value={live ? match.homeTeamScore || 0 : "–"} label={abbr(match.home_team_name)} primary />
                <ScoreCell value={live ? match.awayTeamScore || 0 : "–"} label={abbr(match.away_team_name)} />
              </div>
            </div>
            {playerError && (
              <div className="mt-md px-4 py-3 rounded-lg bg-error-container/20 border border-error/30 text-error text-sm flex flex-col sm:flex-row sm:items-center gap-2">
                <span>{playerError}</span>
                <Link to="/matches?tab=tv" className="text-primary underline shrink-0">TV Broadcasters →</Link>
              </div>
            )}
          </div>
        </div>

        <aside className="w-full lg:w-[400px] px-5 sm:px-margin-edge lg:px-0 shrink-0">
          <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-md bg-white/5 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-label-caps text-[11px] tracking-[0.15em] text-primary/60 uppercase">
                {embedMode ? "Stream Sources" : "Streaming Servers"}
              </h2>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim shadow-[0_0_8px_#62de8e]" />
                <span className="text-[10px] text-secondary-fixed-dim font-medium">{servers.length} total</span>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-white/5">
              {servers.map((s, i) => {
                const meta = TYPE_META[s.type] || { icon: "dns", tag: (s.type || "").toUpperCase(), sub: "Stream" };
                const isActive = i === active;
                const offline = !s.url;
                return (
                  <button
                    key={i}
                    onClick={() => { setActive(i); setPlayerError(""); }}
                    className={`p-4 flex items-center justify-between text-left transition-all group ${isActive ? "bg-primary/5 border-l-[3px] border-primary" : "hover:bg-white/5 border-l-[3px] border-transparent"}`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-primary/10" : "bg-white/5"}`}>
                        <span className={`material-symbols-outlined text-[20px] ${isActive ? "text-primary fill-1" : "opacity-40"}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                          {meta.icon}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className={`font-title-md text-[14px] truncate ${isActive ? "text-primary font-bold" : "font-medium"}`}>
                          {s.name || `Source ${i + 1}`}
                        </div>
                        <div className="text-[11px] text-on-surface-variant/60 truncate">{meta.sub}</div>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded tracking-wider shrink-0 ${
                      isActive ? "bg-primary/20 text-primary"
                      : offline ? "text-on-surface-variant/50 border border-white/10"
                      : isIpLockedCdn(s) ? "text-error/70 border border-error/20"
                      : "text-on-surface/40 border border-white/10"
                    }`}>
                      {isActive ? "ACTIVE" : offline ? "PENDING" : isIpLockedCdn(s) ? "IP-LOCKED" : meta.tag}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-md bg-black/20 border-t border-white/5 flex items-start gap-sm text-on-surface-variant/40">
              <span className="material-symbols-outlined text-[16px] mt-0.5">info</span>
              <p className="text-[11px] leading-snug">
                {embedMode
                  ? "Live streams via SportSRC embed. Links may appear shortly before kickoff."
                  : "Direct, CDN, and DRM servers. CDN/DRM use the proxy with full browser headers."}
              </p>
            </div>

            <div className="p-md bg-black/20 border-t border-white/5">
              <Link
                to="/matches?tab=tv"
                className="flex items-center gap-2 text-[11px] text-on-surface-variant/60 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">live_tv</span>
                World Cup on FOX, Telemundo, SBS & more
              </Link>
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
