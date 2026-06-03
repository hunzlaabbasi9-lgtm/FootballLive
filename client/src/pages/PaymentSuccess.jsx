import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const { setPaid } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const sessionId = params.get("session_id");
    if (!sessionId) {
      setStatus("error");
      setError("Missing payment session.");
      return;
    }

    api
      .post("/payment/confirm", { sessionId })
      .then(({ data }) => {
        if (data.paid) {
          setPaid(data.user, data.token);
          setStatus("success");
          setTimeout(() => navigate("/matches"), 1800);
        } else {
          setStatus("error");
          setError("Payment was not completed.");
        }
      })
      .catch((err) => {
        setStatus("error");
        setError(err.response?.data?.error || "Could not verify payment.");
      });
  }, [params, setPaid, navigate]);

  return (
    <div className="flex-grow flex items-center justify-center px-5 sm:px-margin-edge py-xl">
      <div className="w-full max-w-md glass-card-gold rounded-2xl p-xl text-center premium-glow">
        {status === "verifying" && (
          <>
            <div className="spinner mx-auto mb-lg" />
            <h2 className="bebas-headline text-4xl text-on-surface tracking-wide">Confirming your payment…</h2>
            <p className="text-on-surface-variant mt-2">Hang tight, unlocking your access.</p>
          </>
        )}
        {status === "success" && (
          <>
            <span className="material-symbols-outlined text-secondary text-7xl fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <h2 className="bebas-headline text-5xl text-primary mt-md tracking-wide">You're In!</h2>
            <p className="text-on-surface-variant mt-2">Access unlocked. Taking you to the live matches…</p>
            <Link to="/matches" className="inline-block mt-lg bg-primary-container text-on-primary-container font-label-caps px-xl py-4 rounded-xl hover:brightness-110 transition-all gold-glow">
              WATCH NOW →
            </Link>
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
