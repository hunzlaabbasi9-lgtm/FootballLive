import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth";

const PERKS = [
  "Every World Cup match in HD",
  "2–13 streaming servers per match",
  "50+ leagues & competitions",
  "No ads · No subscription · Pay once",
];

export default function Paywall() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cfg, setCfg] = useState({ priceAmount: 5, currency: "USDT", cryptoEnabled: false });

  useEffect(() => {
    if (user?.hasPaid) navigate("/matches", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    api.get("/payment/config").then((r) => setCfg(r.data)).catch(() => {});
  }, []);

  const price = Number(cfg.priceAmount || 5).toFixed(0);
  const canceled = params.get("canceled");

  const pay = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/payment/create-checkout-session");
      window.location.href = data.url;
    } catch (err) {
      setError(err.response?.data?.error || "Could not start checkout");
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-5 sm:px-margin-edge py-xl relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-container/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full max-w-md glass-card-gold rounded-2xl p-lg premium-glow relative overflow-hidden">
        <div className="absolute top-0 right-0 p-md">
          <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tight">Gold Pass</span>
        </div>

        <div className="flex justify-center mb-md">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-container/30 blur-2xl rounded-full" />
            <div className="relative bg-surface-container-high w-24 h-24 rounded-full flex items-center justify-center border border-primary-container/40">
              <span className="material-symbols-outlined text-[48px] gold-gradient-text fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-lg">
          <h1 className="bebas-headline text-headline-lg-mobile text-on-surface mb-xs tracking-tight uppercase">Unlock Stadium Access</h1>
          <p className="font-body-sm text-on-surface-variant mb-md opacity-70">Experience every moment of glory in real-time.</p>
          <div className="flex flex-col items-center">
            <span className="bebas-headline text-[64px] gold-gradient-text leading-tight">{price} USDT</span>
            <span className="font-label-caps text-[11px] text-primary/80 tracking-[0.2em] mt-2">VIP ONE-TIME ACCESS · PAID IN CRYPTO</span>
          </div>
        </div>

        {canceled && (
          <div className="mb-md px-4 py-3 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm text-center">
            Checkout canceled — you can try again anytime.
          </div>
        )}
        {error && (
          <div className="mb-md px-4 py-3 rounded-lg bg-error-container/20 border border-error/30 text-error text-sm text-center">{error}</div>
        )}

        <div className="space-y-md mb-xl">
          {PERKS.map((p) => (
            <div key={p} className="flex items-center gap-sm">
              <div className="bg-secondary/10 p-1.5 rounded-lg border border-secondary/20">
                <span className="material-symbols-outlined text-secondary text-[22px] check-icon fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <p className="font-body-sm text-on-surface leading-tight">{p}</p>
            </div>
          ))}
        </div>

        <button
          onClick={pay}
          disabled={loading}
          className="w-full cinematic-button button-shine text-on-primary h-16 rounded-xl font-title-md flex items-center justify-center gap-xs uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading ? "Redirecting…" : `Pay ${price} USDT & Watch Now`}
          {!loading && <span className="material-symbols-outlined fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>}
        </button>

        <div className="mt-lg pt-lg border-t border-white/5 text-center">
          <p className="font-label-caps text-[10px] tracking-widest text-on-surface-variant opacity-60 uppercase">
            {cfg.cryptoEnabled ? "🔒 Paid in USDT (TRC-20) · on-chain & irreversible" : "⚙️ Demo mode — no real charge"}
          </p>
        </div>
      </div>
    </div>
  );
}
