import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth";

// requirePaid: when true, also redirects authenticated-but-unpaid users to the paywall.
export default function ProtectedRoute({ children, requirePaid = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex-grow grid place-items-center py-32">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requirePaid && !user.hasPaid) {
    return <Navigate to="/paywall" replace />;
  }

  return children;
}
