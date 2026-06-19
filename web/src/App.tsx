import { Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { SignupPage } from "@/pages/signup";
import { NotFoundPage } from "@/pages/not-found";
import { DashboardLayout } from "@/pages/dashboard/layout";
import { DashboardOverviewPage } from "@/pages/dashboard/overview";
import { DoctorsPage } from "@/pages/dashboard/doctors";
import { DoctorDetailPage } from "@/pages/dashboard/doctor-detail";
import { AppointmentsPage } from "@/pages/dashboard/appointments";
import { DoctorOverviewPage } from "@/pages/dashboard/doctor-overview";
import { DoctorRequestsPage } from "@/pages/dashboard/doctor-requests";
import { DoctorSchedulePage } from "@/pages/dashboard/doctor-schedule";
import { DoctorProfilePage } from "@/pages/dashboard/doctor-profile";
import type { UserRole } from "@/lib/types";

/** Full-screen spinner shown while the initial auth session resolves. */
function FullScreenLoader() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

/** Sends already-authenticated users away from the login/signup pages. */
function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/** Restricts a dashboard route to one role, bouncing others to /dashboard. */
function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (user && user.role !== role) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/** The dashboard landing page differs by account type. */
function DashboardHome() {
  const { user } = useAuth();
  return user?.role === "doctor" ? (
    <DoctorOverviewPage />
  ) : (
    <DashboardOverviewPage />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/signup"
        element={
          <RedirectIfAuthed>
            <SignupPage />
          </RedirectIfAuthed>
        }
      />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route
          path="doctors"
          element={
            <RequireRole role="patient">
              <DoctorsPage />
            </RequireRole>
          }
        />
        <Route
          path="doctors/:id"
          element={
            <RequireRole role="patient">
              <DoctorDetailPage />
            </RequireRole>
          }
        />
        <Route
          path="appointments"
          element={
            <RequireRole role="patient">
              <AppointmentsPage />
            </RequireRole>
          }
        />
        <Route
          path="requests"
          element={
            <RequireRole role="doctor">
              <DoctorRequestsPage />
            </RequireRole>
          }
        />
        <Route
          path="schedule"
          element={
            <RequireRole role="doctor">
              <DoctorSchedulePage />
            </RequireRole>
          }
        />
        <Route
          path="profile"
          element={
            <RequireRole role="doctor">
              <DoctorProfilePage />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
