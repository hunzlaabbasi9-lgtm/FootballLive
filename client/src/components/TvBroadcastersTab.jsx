import { useCallback, useEffect, useState } from "react";
import api from "../api";
import ChannelCard from "./ChannelCard";
import StreamPlayer from "./StreamPlayer";

const DEFAULT_REGION = "US";

export default function TvBroadcastersTab() {
  const [regions, setRegions] = useState([]);
  const [regionCode, setRegionCode] = useState(
    () => localStorage.getItem("wc_region") || DEFAULT_REGION
  );
  const [activeChannel, setActiveChannel] = useState(null);
  const [playerError, setPlayerError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/channels");
      const list = data.regions || [];
      setRegions(list);

      const saved = localStorage.getItem("wc_region") || DEFAULT_REGION;
      const reg = list.find((r) => r.code === saved) || list[0];
      const first = reg?.channels?.find((c) => c.reachable !== false) || reg?.channels?.[0];
      if (first) setActiveChannel(first);
    } catch (err) {
      setError(err.response?.data?.error || "Could not load TV channels");
      setRegions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = regions.find((r) => r.code === regionCode) || regions[0];

  const pickRegion = (code) => {
    setRegionCode(code);
    localStorage.setItem("wc_region", code);
    const reg = regions.find((r) => r.code === code);
    setActiveChannel(reg?.channels?.find((c) => c.reachable !== false) || reg?.channels?.[0] || null);
    setPlayerError("");
  };

  const selectChannel = (ch) => {
    setActiveChannel(ch);
    setPlayerError("");
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-32">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 rounded-lg bg-error-container/20 border border-error/30 text-error text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      {/* Region + intro */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-md">
        <div>
          <p className="text-on-surface-variant text-sm max-w-xl">
            Official FIFA World Cup 2026 broadcasters by region.
          </p>
          <p className="text-on-surface-variant/70 text-xs max-w-xl mt-1">
            <span className="text-primary font-medium">Watch here</span> = free community stream plays in the player below.
            <span className="text-on-surface-variant/50"> · </span>
            <span className="text-on-surface font-medium">Official link</span> = opens the broadcaster&apos;s site (iPlayer, TSN, ViX, etc.) — no embeddable feed available.
          </p>
        </div>
        <div className="shrink-0 w-full sm:w-72">
          <label className="font-label-caps text-[10px] text-on-surface-variant/60 tracking-widest mb-xs block uppercase">
            Your region
          </label>
          <select
            value={regionCode}
            onChange={(e) => pickRegion(e.target.value)}
            className="w-full bg-surface-container-high border border-white/10 rounded-xl px-md py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50"
          >
            {regions.map((r) => (
              <option key={r.code} value={r.code}>
                {r.flag} {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(current?.coverage || []).length > 0 && (
        <section className="glass-card rounded-2xl p-md border border-primary/20">
          <h2 className="font-label-caps text-[11px] tracking-[0.15em] text-primary/60 uppercase mb-sm">
            World Cup 2026 on {current.flag} {current.name}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-sm text-sm">
            {current.coverage.map((row) => (
              <li key={row.channel} className="flex items-start gap-2 text-on-surface-variant">
                <span className="text-primary shrink-0 mt-0.5">✓</span>
                <span>
                  <span className="text-on-surface font-medium">{row.channel}</span>
                  <span className="text-on-surface-variant/70"> — {row.role}</span>
                </span>
              </li>
            ))}
          </ul>
          {current.rightsNote && (
            <p className="text-[11px] text-amber-200/80 mt-md border-t border-white/10 pt-md">
              {current.rightsNote}
            </p>
          )}
        </section>
      )}

      {/* Player */}
      <div className="relative aspect-video w-full bg-black overflow-hidden rounded-2xl player-glow border border-white/5">
        {activeChannel?.url ? (
          <StreamPlayer
            key={activeChannel.url}
            source={activeChannel}
            onFatalError={() => setPlayerError("This channel is unavailable. Try another below.")}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 px-6">
            <span className="material-symbols-outlined text-primary text-5xl">
              {(current?.external || []).length > 0 ? "open_in_new" : "live_tv"}
            </span>
            <p className="text-on-surface-variant max-w-md text-sm">
              {(current?.external || []).length > 0
                ? `No free community stream for ${current?.name || "this region"} right now. Use the official platforms below — they carry World Cup rights in this region.`
                : `No embeddable channel for ${current?.name || "this region"} right now. Try another region or check back later.`}
            </p>
          </div>
        )}
        {activeChannel && (
          <div className="absolute top-md left-md bg-black/50 backdrop-blur-md px-md py-2 rounded-xl border border-white/10 pointer-events-none">
            <p className="font-label-caps text-[9px] text-on-surface-variant/60 tracking-widest uppercase">Now playing</p>
            <p className="font-title-md text-sm text-primary font-bold">{activeChannel.name}</p>
            <p className="text-[11px] text-on-surface-variant/70">{activeChannel.broadcaster}</p>
            {activeChannel.streamNote && (
              <p className="text-[10px] text-amber-200/80 mt-1 max-w-xs">{activeChannel.streamNote}</p>
            )}
          </div>
        )}
      </div>

      {playerError && (
        <div className="px-4 py-3 rounded-lg bg-error-container/20 border border-error/30 text-error text-sm">
          {playerError}
        </div>
      )}

      {/* Channel grid */}
      {(current?.channels || []).length > 0 && (
        <section>
          <h2 className="font-label-caps text-[11px] tracking-[0.15em] text-primary/60 uppercase mb-md">
            Watch here · {current.flag} {current.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            {current.channels.map((ch, i) => (
              <ChannelCard
                key={`${ch.url}-${i}`}
                channel={ch}
                active={activeChannel?.url === ch.url}
                onClick={() => selectChannel(ch)}
              />
            ))}
          </div>
        </section>
      )}

      {(current?.channels || []).length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant gap-2 glass-card rounded-2xl">
          <span className="material-symbols-outlined text-5xl opacity-40">tv_off</span>
          <p className="text-sm">No in-site stream for this region. Use an official platform below.</p>
        </div>
      )}

      {/* External official platforms */}
      {(current?.external || []).length > 0 && (
        <section>
          <h2 className="font-label-caps text-[11px] tracking-[0.15em] text-primary/60 uppercase mb-md">
            Official links · opens broadcaster website
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            {current.external.map((ex) => (
              <a
                key={ex.url}
                href={ex.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card rounded-2xl p-md flex items-center justify-between gap-md hover:border-primary/40 transition-all group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-title-md text-[15px] font-medium group-hover:text-primary transition-colors">{ex.name}</h3>
                    <span className="text-[9px] font-bold text-on-surface-variant/70 px-sm py-0.5 rounded-full border border-white/15 shrink-0">
                      OFFICIAL LINK
                    </span>
                  </div>
                  {ex.note && <p className="text-[11px] text-on-surface-variant/60 mt-1">{ex.note}</p>}
                </div>
                <span className="material-symbols-outlined text-primary shrink-0">open_in_new</span>
              </a>
            ))}
          </div>
          <p className="text-[11px] text-on-surface-variant/40 mt-md">
            Opens the rights holder&apos;s website. Some require a local subscription.
          </p>
        </section>
      )}
    </div>
  );
}
