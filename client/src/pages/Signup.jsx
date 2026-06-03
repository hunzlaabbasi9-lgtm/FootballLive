import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(form.email, form.password, form.name);
      navigate("/paywall");
    } catch (err) {
      setError(err.response?.data?.error || "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-5 sm:px-margin-edge py-lg">
      <div className="glass-card-gold w-full max-w-[460px] p-lg rounded-xl relative overflow-hidden flex flex-col items-center">
        <div className="text-center mb-lg w-full">
          <h1 className="bebas-headline text-4xl sm:text-display-sm text-primary mb-base leading-none">CREATE ACCOUNT</h1>
          <p className="font-body-sm text-on-surface-variant/80 tracking-wide uppercase">
            Join the gold standard of football broadcasting
          </p>
        </div>

        {error && (
          <div className="w-full mb-md px-4 py-3 rounded-lg bg-error-container/20 border border-error/30 text-error text-sm">
            {error}
          </div>
        )}

        <form className="space-y-md w-full" onSubmit={submit}>
          <Field label="Full Name" icon="person">
            <input className="input-premium w-full rounded-lg py-sm pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/30" placeholder="Lionel Messi" type="text" value={form.name} onChange={set("name")} />
          </Field>
          <Field label="Email Address" icon="mail">
            <input className="input-premium w-full rounded-lg py-sm pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/30" placeholder="you@example.com" type="email" required value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Security Key" icon="lock">
            <input className="input-premium w-full rounded-lg py-sm pl-12 pr-12 text-on-surface placeholder:text-on-surface-variant/30" placeholder="At least 6 characters" type={showPw ? "text" : "password"} required value={form.password} onChange={set("password")} />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">{showPw ? "visibility_off" : "visibility"}</span>
            </button>
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-title-md py-sm rounded-lg shadow-[0_8px_30px_rgba(245,200,66,0.2)] hover:shadow-[0_8px_40px_rgba(245,200,66,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase tracking-[0.15em] mt-md disabled:opacity-50"
          >
            {loading ? "Creating…" : "Complete Registration"}
          </button>
        </form>

        <div className="mt-lg pt-md border-t border-white/5 w-full text-center">
          <p className="font-body-sm text-on-surface-variant/60">
            Member already?{" "}
            <Link to="/login" className="text-primary font-semibold hover:text-primary-fixed transition-all tracking-wider">
              SIGN IN HERE
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-xs group">
      <label className="font-label-caps text-[11px] text-on-surface-variant/60 group-focus-within:text-primary transition-colors block px-xs uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary/70 text-[20px] transition-colors">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}
