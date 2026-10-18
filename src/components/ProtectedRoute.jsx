import { Navigate, Outlet } from "react-router-dom";
import { hasSession } from "../auth";

// UX-only gate: hides the dashboard from people who are not signed in.
// All real authorization is enforced by the Django API (IsPlatformAdmin),
// so a user who forges a token still gets 403s from every endpoint.
export default function ProtectedRoute({ children }) {
  if (!hasSession()) return <Navigate to="/login" replace />;
  return children || <Outlet />;
}
