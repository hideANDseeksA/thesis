import { Navigate, Outlet } from "react-router-dom";
import { decodeToken, isTokenExpired } from "@/lib/jwt";
import { useAuth } from "@/auth/AuthContext";

export default function ProtectedRoute({ allowedRoles }) {
  const { accessToken, loading } = useAuth();

  if (loading) return null;

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const user = decodeToken(accessToken);

  if (!user || isTokenExpired(accessToken)) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}