import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // 1. Wait for auth check to finish (prevents kicking user out while loading)
  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  // 2. Not logged in? Go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Logged in, but wrong role? Redirect to their own home page
  if (!allowedRoles.includes(user.role)) {
    // Send them to their safe zone based on their actual role
    if (user.role === 'admin') return <Navigate to="/dashboard" replace />;
    if (user.role === 'organizer') return <Navigate to="/organizer/projects" replace />;
    return <Navigate to="/member/tasks" replace />;
  }

  // 4. Allowed? Render the page (Outlet)
  return <Outlet />;
}