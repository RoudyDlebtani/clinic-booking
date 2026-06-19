import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/lib/auth-context";

/**
 * Guards the dashboard: redirects to /login when there is no session. Replaces
 * the Next.js middleware route guard and the server-side layout auth check.
 */
export function DashboardLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Sidebar email={user.email ?? ""} role={user.role} />
      <main className="flex-1 overflow-y-auto p-5 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
