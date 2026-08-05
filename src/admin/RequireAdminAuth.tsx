import { Navigate, Outlet } from "react-router-dom";

export function RequireAdminAuth() {
  const isAuthenticated =
    sessionStorage.getItem("isAdminAuthenticated") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
