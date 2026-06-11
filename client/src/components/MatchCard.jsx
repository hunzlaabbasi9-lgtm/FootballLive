import { useNavigate } from "react-router-dom";

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(parseInt(ts, 10) * 1000);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MatchCard({ match, index }) {
  const navigate = useNavigate();
  const live = match.match_status === "live";
  const finished = match.match_status === "finished";
  const servers = match.servers || [];
  const hasStream = servers.some((s) => s && s.url);
  // Watchable only when the match is live OR a stream is already available
  // (embeds can appear shortly before kickoff). Future/finished matches stay locked.
  const watchable = (live || hasStream) && !finished;

  const open = () => {
    if (!watchable) return;
    sessionStorage.setItem("wc_match", JSON.stringify(match));
    navigate(`/watch/${index}`);
  };

  return (
    <div className="glass-card rounded-2xl p-md flex flex-col gap-md relative overflow-hidden group hover:border-white/20 transition-all duration-500">
      {/* Top row: league + status */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-xs min-w-0">
          {match.league_logo && (
            <img src={match.league_logo} alt="" className="w-6 h-4 object-contain rounded-sm shrink-0" onError={(e) => (e.target.style.display = "none")} />
          )}
          <span className="font-label-caps text-[10px] text-on-surface-variant opacity-80 uppercase tracking-tight truncate">
            {match.league_name}
          </span>
        </div>
        {live ? (
          <div className="flex items-center gap-xs bg-error-container/20 text-error px-sm py-1 rounded-full text-[10px] font-bold live-pulse border border-error/30 shrink-0">
            <span className="material-symbols-outlined text-[10px] fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>circle</span>
            LIVE
          </div>
        ) : finished ? (
          <div className="bg-white/5 text-on-surface-variant/70 px-sm py-1 rounded-full text-[10px] font-bold border border-white/10 uppercase shrink-0">
            Full Time
          </div>
        ) : (
          <div className="bg-surface-container-highest/50 text-on-surface-variant px-sm py-1 rounded-full text-[10px] font-bold border border-white/10 uppercase shrink-0">
            Upcoming
          </div>
        )}
      </div>

      {/* Teams + score */}
      <div className="flex justify-between items-center py-md">
        <Team name={match.home_team_name} logo={match.home_team_logo} dim={!live && !finished} />
        <div className="flex flex-col items-center shrink-0 px-2">
          {live || finished ? (
            <div className={`flex items-center gap-2 sm:gap-sm bebas-headline text-4xl sm:text-display-sm leading-none ${live ? "text-primary" : "text-on-surface/70"}`} style={live ? { filter: "drop-shadow(0 0 20px rgba(245,200,66,0.4))" } : undefined}>
              <span>{match.homeTeamScore || 0}</span>
              <span className="text-on-surface-variant opacity-20 text-2xl sm:text-headline-lg-mobile">:</span>
              <span>{match.awayTeamScore || 0}</span>
            </div>
          ) : (
            <span className="bebas-headline text-4xl sm:text-display-sm text-on-surface-variant opacity-10 leading-none">VS</span>
          )}
          <span className="font-label-caps text-primary/80 text-[12px] mt-xs">{finished ? "FULL TIME" : formatTime(match.match_time)}</span>
        </div>
        <Team name={match.away_team_name} logo={match.away_team_logo} dim={!live && !finished} />
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-auto pt-md border-t border-white/5">
        {watchable ? (
          <>
            <div className="flex items-center gap-xs text-on-surface-variant font-label-caps text-[10px]">
              <span className="material-symbols-outlined text-sm text-secondary">sensors</span>
              <span>{servers.length} BROADCAST{servers.length !== 1 ? "S" : ""}</span>
            </div>
            <button
              onClick={open}
              className="bg-secondary text-on-secondary px-lg py-sm rounded-full font-label-caps text-label-caps flex items-center gap-xs hover:brightness-110 active:scale-95 transition-all emerald-glow"
            >
              <span className="material-symbols-outlined fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              WATCH
            </button>
          </>
        ) : finished ? (
          <>
            <div className="flex items-center gap-xs text-on-surface-variant/70 font-label-caps text-[10px]">
              <span className="material-symbols-outlined text-sm">sports_score</span>
              <span>MATCH ENDED</span>
            </div>
            <span className="bg-white/5 text-on-surface-variant/50 px-lg py-sm rounded-full font-label-caps text-label-caps flex items-center gap-xs border border-white/10 select-none">
              <span className="material-symbols-outlined text-[18px]">flag</span>
              FULL TIME
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-xs text-on-surface-variant/70 font-label-caps text-[10px]">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>KICKOFF {formatTime(match.match_time)}</span>
            </div>
            <span className="bg-white/5 text-on-surface-variant/60 px-lg py-sm rounded-full font-label-caps text-label-caps flex items-center gap-xs border border-white/10 cursor-not-allowed select-none">
              <span className="material-symbols-outlined text-[18px]">lock_clock</span>
              UPCOMING
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function Team({ name, logo, dim }) {
  return (
    <div className="flex flex-col items-center gap-sm w-1/3 min-w-0">
      <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl team-shield flex items-center justify-center p-2 sm:p-3 shadow-2xl group-hover:scale-105 transition-transform ${dim ? "opacity-70" : ""}`}>
        {logo ? (
          <img src={logo} alt="" className="w-full h-full object-contain drop-shadow-lg" onError={(e) => (e.target.style.display = "none")} />
        ) : (
          <span className="material-symbols-outlined text-on-surface-variant/40">shield</span>
        )}
      </div>
      <span className="font-label-caps text-on-surface text-center tracking-wide text-[10px] sm:text-[11px] leading-tight break-words w-full">{name}</span>
    </div>
  );
}
