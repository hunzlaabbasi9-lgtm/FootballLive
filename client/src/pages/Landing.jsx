import { Link } from "react-router-dom";
import { useAuth } from "../auth";

export default function Landing() {
  const { user } = useAuth();
  const goWatch = user ? (user.hasPaid ? "/matches" : "/paywall") : "/signup";

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center atmospheric-bg pb-xl pt-12">
        <div className="absolute inset-0 hero-gradient" />
        <div className="relative z-10 px-5 sm:px-margin-edge text-center max-w-5xl">
          <div className="inline-flex items-center gap-xs px-md py-1.5 rounded-full border border-primary-container/30 bg-primary-container/10 mb-md backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="pulse-live absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error" />
            </span>
            <span className="font-label-caps text-[11px] text-primary-container tracking-[0.2em] font-bold">
              LIVE COVERAGE ENABLED
            </span>
          </div>
          <h1 className="bebas-headline text-5xl sm:text-display-sm md:text-display-lg text-on-surface mb-md tracking-tight leading-[0.95] uppercase">
            Every Match. <br /> <span className="text-primary-container">Every Goal.</span> <br /> Streamed Live.
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto mb-lg opacity-90 leading-relaxed">
            Experience the pinnacle of football with ultra-low latency streaming, multiple servers per match,
            and the ultimate FIFA World Cup experience. One payment. Unlimited access.
          </p>
          <div className="flex flex-col sm:flex-row gap-md justify-center items-center">
            <Link
              to={goWatch}
              className="w-full sm:w-auto font-label-caps text-label-caps bg-primary-container text-on-primary-container px-xl py-4 rounded-xl hover:brightness-110 active:scale-95 transition-all gold-glow text-base"
            >
              START WATCHING
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto font-label-caps text-label-caps border border-outline/40 text-on-surface px-xl py-4 rounded-xl hover:bg-white/5 active:scale-95 transition-all backdrop-blur-sm text-base"
            >
              I HAVE AN ACCOUNT
            </Link>
          </div>
        </div>

        {/* Stat chips */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-lg mt-xl w-full max-w-5xl px-5 sm:px-margin-edge">
          {[
            { ico: "sports_soccer", n: "50+ LEAGUES", l: "GLOBAL COVERAGE" },
            { ico: "hd", n: "ULTRA HD", l: "CRYSTAL CLEAR QUALITY" },
            { ico: "bolt", n: "99.9% UPTIME", l: "ZERO BUFFERING" },
          ].map((s) => (
            <div key={s.n} className="glass-card p-lg rounded-2xl flex items-center gap-md group hover:border-primary-container/40 transition-all">
              <div className="w-14 h-14 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary-container group-hover:scale-110 transition-transform shrink-0">
                <span className="material-symbols-outlined text-4xl">{s.ico}</span>
              </div>
              <div>
                <div className="bebas-headline text-3xl text-on-surface">{s.n}</div>
                <div className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">{s.l}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature bento grid */}
      <section className="py-xl px-5 sm:px-margin-edge max-w-[1440px] mx-auto w-full">
        <div className="text-center mb-xl">
          <h2 className="bebas-headline text-5xl text-on-surface tracking-widest">THE GOLD STANDARD OF STREAMING</h2>
          <div className="h-1.5 w-24 bg-primary-container mx-auto rounded-full mt-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-md">
          <div className="md:col-span-3 glass-card rounded-2xl p-lg relative overflow-hidden group">
            <span className="material-symbols-outlined text-primary-container text-5xl mb-md">layers</span>
            <h3 className="bebas-headline text-4xl mb-sm uppercase tracking-wide">2–13 Streams Per Match</h3>
            <p className="text-on-surface-variant max-w-xs leading-relaxed">Multiple HD servers per fixture with automatic fallback so you never miss a goal.</p>
          </div>
          <div className="md:col-span-3 glass-card rounded-2xl p-lg relative overflow-hidden group">
            <span className="material-symbols-outlined text-primary-container text-5xl mb-md">public</span>
            <h3 className="bebas-headline text-4xl mb-sm uppercase tracking-wide">50+ Global Leagues</h3>
            <p className="text-on-surface-variant max-w-xs leading-relaxed">From the World Cup to the Premier League, the world's finest competitions in one hub.</p>
          </div>
          <div className="md:col-span-2 glass-card rounded-2xl p-lg flex flex-col justify-center items-center text-center group hover:border-primary-container/30">
            <span className="material-symbols-outlined text-primary-container text-5xl mb-md group-hover:scale-110 transition-transform">speed</span>
            <h3 className="bebas-headline text-2xl mb-sm uppercase">Ultra-Low Latency</h3>
            <p className="font-body-sm text-on-surface-variant leading-relaxed">Edge-delivered streams keep you ahead of the spoilers.</p>
          </div>
          <div className="md:col-span-2 bg-primary-container rounded-2xl p-lg flex flex-col justify-center items-center text-center text-on-primary-container group shadow-2xl">
            <span className="material-symbols-outlined text-5xl mb-md fill-1 group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            <h3 className="bebas-headline text-3xl mb-sm uppercase">World Cup Coverage</h3>
            <p className="font-body-sm font-semibold opacity-90">Every minute of the world's biggest stage.</p>
          </div>
          <div className="md:col-span-1 glass-card rounded-2xl p-md flex flex-col justify-center items-center text-center group hover:border-primary-container/30">
            <span className="material-symbols-outlined text-primary-container text-5xl mb-md group-hover:scale-110 transition-transform">devices</span>
            <h4 className="font-label-caps uppercase font-bold tracking-widest text-[10px]">Watch Anywhere</h4>
          </div>
          <div className="md:col-span-1 glass-card rounded-2xl p-md flex flex-col justify-center items-center text-center group hover:border-primary-container/30">
            <span className="material-symbols-outlined text-primary-container text-5xl mb-md group-hover:scale-110 transition-transform">lock</span>
            <h4 className="font-label-caps uppercase font-bold tracking-widest text-[10px]">Secure Stripe</h4>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-xl px-5 sm:px-margin-edge relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-container/5 rounded-full blur-[140px]" />
        <div className="relative z-10 max-w-2xl mx-auto glass-card-gold rounded-3xl p-xl text-center gold-glow">
          <span className="material-symbols-outlined text-primary-container text-7xl mb-lg fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
          <h2 className="bebas-headline text-6xl text-on-surface mb-md tracking-wider">All-Access Pass</h2>
          <div className="flex items-center justify-center gap-xs mb-lg">
            <span className="text-2xl text-on-surface-variant font-light">$</span>
            <span className="bebas-headline text-8xl text-primary-container leading-none">5</span>
            <span className="bebas-headline text-2xl text-on-surface-variant self-end mb-4">ONE-TIME</span>
          </div>
          <p className="text-on-surface-variant mb-xl leading-relaxed max-w-md mx-auto">
            Unlock every World Cup match and live stream. No monthly fees. No hidden costs. Just pure football.
          </p>
          <Link
            to={goWatch}
            className="block w-full bebas-headline text-3xl bg-primary-container text-on-primary-container py-5 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-2xl tracking-widest"
          >
            UNLOCK ALL MATCHES
          </Link>
        </div>
      </section>
    </>
  );
}
