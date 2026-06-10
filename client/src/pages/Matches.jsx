import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import MatchCard from "../components/MatchCard";
import TvBroadcastersTab from "../components/TvBroadcastersTab";

const TABS = [
  { key: "all", label: "All Matches" },
  { key: "live", label: "Live Events" },
  { key: "vs", label: "Upcoming" },
  { key: "tv", label: "TV Broadcasters" },
];

export default function Matches() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TABS.some((t) => t.key === searchParams.get("tab")) ? searchParams.get("tab") : "all";
  const [tab, setTab] = useState(initialTab);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ matches: [], pagination: null, source: null });
  const [loading, setLoading] = useState(tab !== "tv");
  const [error, setError] = useState("");

  const switchTab = (key) => {
    setTab(key);
    setPage(1);
    if (key === "tv") {
      setSearchParams({ tab: "tv" });
    } else {
      setSearchParams({});
    }
  };

  const load = useCallback(async (status, pageNum) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(pageNum) });
      if (status !== "all") params.set("status", status);
      const { data } = await api.get(`/matches?${params}`);
      setData(data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not load matches");
      setData({ matches: [], pagination: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "tv") return;
    load(tab, page);
  }, [tab, page, load]);

  const { matches, pagination, source } = data;
  const isTv = tab === "tv";

  return (
    <div className="w-full">
      {source === "mock" && !isTv && (
        <div className="text-center text-[12px] py-2 px-4 bg-primary text-on-primary font-semibold">
          ⚙️ Demo data — add a RapidAPI key on the server to stream real live matches.
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-5 sm:px-margin-edge pt-md pb-xl w-full">
        <section className="mb-lg">
          <span className="font-label-caps text-primary tracking-widest opacity-80">MATCH CENTER</span>
          <h1 className="bebas-headline text-4xl sm:text-display-sm text-on-surface uppercase leading-none mt-1">
            {isTv ? "World Cup TV" : "Live Global Stage"}
          </h1>

          <div className="flex items-center gap-sm overflow-x-auto no-scrollbar py-md">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`broadcast-toggle px-lg py-sm rounded-full font-label-caps text-label-caps whitespace-nowrap flex items-center gap-xs ${tab === t.key ? "active" : ""}`}
              >
                {t.key === "tv" && (
                  <span className="material-symbols-outlined text-[16px]">live_tv</span>
                )}
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {isTv ? (
          <TvBroadcastersTab />
        ) : (
          <>
            {error && (
              <div className="mb-md px-4 py-3 rounded-lg bg-error-container/20 border border-error/30 text-error text-sm">{error}</div>
            )}

            {loading ? (
              <div className="grid place-items-center py-32"><div className="spinner" /></div>
            ) : matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-on-surface-variant gap-2">
                <span className="material-symbols-outlined text-6xl opacity-40">stadium</span>
                <p>No matches in this category right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                {matches.map((m, i) => <MatchCard key={i} match={m} index={i} />)}
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-xl flex justify-center items-center gap-md">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev || loading}
                  className="w-12 h-12 flex items-center justify-center rounded-full glass-card text-on-surface-variant hover:text-primary transition-colors border border-white/10 disabled:opacity-40"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <span className="font-label-caps text-on-surface-variant text-[12px]">
                  PAGE {pagination.page} / {pagination.totalPages} · {pagination.total} MATCHES
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext || loading}
                  className="w-12 h-12 flex items-center justify-center rounded-full glass-card text-on-surface-variant hover:text-primary transition-colors border border-white/10 disabled:opacity-40"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
