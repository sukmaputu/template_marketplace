import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/components/auth/UseAuth";

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
