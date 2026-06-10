import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const { setPaid } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | success | pending | error
  const [error, setError] = useState("");
  const ran = useRef(false);
  const stop = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const unlock = (data) => {
      setPaid(data.user, data.token);
      setStatus("success");
      setTimeout(() => navigate("/matches"), 1600);
    };

    // Mock mode (local dev, ?mock=1) — confirm instantly.
    if (params.get("mock")) {
      api
        .post("/payment/confirm", {})
        .then(({ data }) => (data.paid ? unlock(data) : setStatus("error")))
        .catch((err) => {
          setStatus("error");
          setError(err.response?.data?.error || "Could not confirm payment.");
        });
      return;
    }

    // Real USDT: poll until the IPN webhook marks the user paid.
    let tries = 0;
    const poll = async () => {
      if (stop.current) return;
      try {
        const { data } = await api.get("/payment/status");
        if (data.hasPaid) return unlock(data);
      } catch {
        /* keep polling */
      }
      if (++tries >= 60) return setStatus("pending"); // ~4 minutes
      setTimeout(poll, 4000);
    };
    poll();

    return () => { stop.current = true; };
  }, [params, setPaid, navigate]);

  const resume = () => {
    setStatus("verifying");
    stop.current = false;
    let tries = 0;
    const poll = async () => {
      if (stop.current) return;
      try {
        const { data } = await api.get("/payment/status");
        if (data.hasPaid) {
          setPaid(data.user, data.token);
          setStatus("success");
          setTimeout(() => navigate("/matches"), 1600);
          return;
        }
      } catch {
        /* keep polling */
      }
      if (++tries >= 60) return setStatus("pending");
      setTimeout(poll, 4000);
    };
    poll();
  };

  return (
    <div className="flex-grow flex items-center justify-center px-5 sm:px-margin-edge py-xl">
      <div className="w-full max-w-md glass-card-gold rounded-2xl p-xl text-center premium-glow">
        {status === "verifying" && (
          <>
            <div className="spinner mx-auto mb-lg" />
            <h2 className="bebas-headline text-4xl text-on-surface tracking-wide">Confirming your USDT payment…</h2>
            <p className="text-on-surface-variant mt-2">Waiting for the transaction to confirm on-chain. This usually takes a minute or two — keep this page open.</p>
          </>
        )}
        {status === "success" && (
          <>
            <span className="material-symbols-outlined text-secondary text-7xl fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <h2 className="bebas-headline text-5xl text-primary mt-md tracking-wide">You're In!</h2>
            <p className="text-on-surface-variant mt-2">Payment confirmed. Taking you to the live matches…</p>
            <Link to="/matches" className="inline-block mt-lg bg-primary-container text-on-primary-container font-label-caps px-xl py-4 rounded-xl hover:brightness-110 transition-all gold-glow">
              WATCH NOW →
            </Link>
          </>
        )}
        {status === "pending" && (
          <>
            <span className="material-symbols-outlined text-primary text-7xl">hourglass_top</span>
            <h2 className="bebas-headline text-4xl text-on-surface mt-md tracking-wide">Still confirming…</h2>
            <p className="text-on-surface-variant mt-2">
              We haven't seen your payment settle yet. On-chain transfers can take a few minutes. If you've paid, your access unlocks automatically — you can keep checking or come back shortly.
            </p>
            <button onClick={resume} className="inline-block mt-lg bg-primary-container text-on-primary-container font-label-caps px-xl py-4 rounded-xl hover:brightness-110 transition-all gold-glow">
              CHECK AGAIN
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <span className="material-symbols-outlined text-error text-7xl">error</span>
            <h2 className="bebas-headline text-4xl text-on-surface mt-md tracking-wide">Something went wrong</h2>
            <div className="mt-md px-4 py-3 rounded-lg bg-error-container/20 border border-error/30 text-error text-sm">{error}</div>
            <Link to="/paywall" className="inline-block mt-lg bg-primary-container text-on-primary-container font-label-caps px-xl py-4 rounded-xl hover:brightness-110 transition-all">
              BACK TO CHECKOUT
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
