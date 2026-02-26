import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./UseAuth";

// Route guard that redirects unauthenticated users to login.
// Gate protected routes until auth loading completes.
export function RequireAuth() {
  const { isAuthenticated, isHydrating } = useAuth();
  const location = useLocation();

  if (isHydrating) {
    return <div style={{ padding: 16 }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Remember where they tried to go so we can send them back after login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
