export default function ChannelCard({ channel, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`glass-card rounded-2xl p-md flex flex-col gap-md text-left transition-all duration-300 hover:border-white/20 group ${active ? "border-primary/50 ring-1 ring-primary/30" : ""}`}
    >
      <div className="flex justify-between items-start gap-sm">
        <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
          {channel.logo ? (
            <img src={channel.logo} alt="" className="w-full h-full object-contain p-2" onError={(e) => (e.target.style.display = "none")} />
          ) : (
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">live_tv</span>
          )}
        </div>
        {active ? (
          <span className="flex items-center gap-1 bg-error-container/20 text-error px-sm py-1 rounded-full text-[9px] font-bold border border-error/30">
            <span className="w-1.5 h-1.5 rounded-full bg-error pulse-red" />
            ON AIR
          </span>
        ) : channel.reachable === false ? (
          <span className="text-[9px] font-bold text-on-surface-variant/50 px-sm py-1 rounded-full border border-white/10">
            SLOW
          </span>
        ) : (
          <span className="text-[9px] font-bold text-primary/80 px-sm py-1 rounded-full border border-primary/25 bg-primary/10">
            IN APP
          </span>
        )}
      </div>

      <div className="min-w-0">
        <h3 className={`font-title-md text-[15px] truncate ${active ? "text-primary font-bold" : "font-medium group-hover:text-primary transition-colors"}`}>
          {channel.name}
        </h3>
        <p className="text-[11px] text-on-surface-variant/60 mt-1 truncate">{channel.broadcaster}</p>
        {channel.quality && (
          <p className="font-label-caps text-[10px] text-secondary-fixed-dim mt-2 tracking-wider">{channel.quality}</p>
        )}
      </div>

      <div className="mt-auto pt-md border-t border-white/5 flex items-center justify-between">
        <span className="font-label-caps text-[10px] text-on-surface-variant/50">WORLD CUP 2026</span>
        <span className="material-symbols-outlined text-primary text-[20px] opacity-0 group-hover:opacity-100 transition-opacity">play_circle</span>
      </div>
    </button>
  );
}
