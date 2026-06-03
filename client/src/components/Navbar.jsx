import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex justify-between items-center px-5 sm:px-margin-edge h-20 max-w-[1440px] mx-auto">
        <Link to={user ? "/matches" : "/"} className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-primary fill-1 text-2xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            sports_soccer
          </span>
          <span className="font-headline-lg-mobile text-xl sm:text-headline-lg-mobile text-primary tracking-wider sm:tracking-widest whitespace-nowrap">
            WORLDCUP LIVE
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-sm shrink-0">
          {user ? (
            <>
              <span className="hidden sm:inline font-label-caps text-[11px] text-on-surface-variant tracking-widest uppercase">
                {user.hasPaid && <span className="text-primary">★ </span>}
                {user.name}
              </span>
              {!user.hasPaid && (
                <Link
                  to="/paywall"
                  className="font-label-caps text-[10px] sm:text-label-caps bg-primary text-on-primary px-3 sm:px-md py-2 sm:py-xs rounded-full hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-primary/20 whitespace-nowrap"
                >
                  UNLOCK
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="font-label-caps text-[10px] sm:text-label-caps border border-white/10 text-on-surface-variant hover:text-on-surface px-3 sm:px-md py-2 sm:py-xs rounded-full hover:bg-white/5 transition-all active:scale-95 whitespace-nowrap"
              >
                LOG OUT
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-label-caps text-[10px] sm:text-label-caps border border-white/10 text-on-surface-variant hover:text-on-surface px-3 sm:px-md py-2 sm:py-xs rounded-full hover:bg-white/5 transition-all active:scale-95 whitespace-nowrap"
              >
                LOGIN
              </Link>
              <Link
                to="/signup"
                className="font-label-caps text-[10px] sm:text-label-caps bg-primary text-on-primary px-3 sm:px-md py-2 sm:py-xs rounded-full hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-primary/20 whitespace-nowrap"
              >
                GET STARTED
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
