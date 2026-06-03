import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const from = location.state?.from;
      if (from) navigate(from);
      else navigate(user.hasPaid ? "/matches" : "/paywall");
    } catch (err) {
      setError(err.response?.data?.error || "Could not log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-5 sm:px-margin-edge py-lg">
      <div className="w-full max-w-[440px] glass-card-gold rounded-xl overflow-hidden">
        {/* Header */}
        <div className="pt-lg px-md pb-md text-center border-b border-white/5 bg-white/[0.02]">
          <div className="mb-md inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-primary-container/20 to-secondary-container/10 border border-primary-container/30">
            <span className="material-symbols-outlined text-primary-container !text-5xl fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>
              sports_soccer
            </span>
          </div>
          <h1 className="bebas-headline text-headline-lg text-primary tracking-[0.2em] mb-1 uppercase">WORLDCUP LIVE</h1>
          <p className="font-title-md text-on-surface-variant font-light tracking-wide opacity-80">Welcome back</p>
        </div>

        {/* Form */}
        <form className="p-md space-y-md" onSubmit={submit}>
          {error && (
            <div className="px-4 py-3 rounded-lg bg-error-container/20 border border-error/30 text-error text-sm">{error}</div>
          )}

          <div className="space-y-xs">
            <label className="font-label-caps text-[10px] tracking-[0.2em] text-on-surface-variant/70 px-xs uppercase">Email Address</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 group-focus-within:text-primary transition-colors !text-xl">mail</span>
              <input className="input-premium w-full h-14 pl-12 pr-4 rounded-lg text-on-surface placeholder:text-on-surface-variant/30" placeholder="name@example.com" type="email" required value={form.email} onChange={set("email")} />
            </div>
          </div>

          <div className="space-y-xs">
            <label className="font-label-caps text-[10px] tracking-[0.2em] text-on-surface-variant/70 px-xs uppercase">Password</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 group-focus-within:text-primary transition-colors !text-xl">lock</span>
              <input className="input-premium w-full h-14 pl-12 pr-12 rounded-lg text-on-surface placeholder:text-on-surface-variant/30" placeholder="••••••••" type={showPw ? "text" : "password"} required value={form.password} onChange={set("password")} />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined !text-xl">{showPw ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary-container gold-glow text-on-primary-fixed rounded-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-base mt-lg uppercase tracking-widest text-sm font-bold disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log In"}
            <span className="material-symbols-outlined !text-xl">chevron_right</span>
          </button>
        </form>

        <div className="p-md text-center border-t border-white/5 bg-black/20">
          <p className="font-body-sm text-on-surface-variant/70">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary-container font-bold hover:text-primary transition-all ml-1">Join the Elite</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
