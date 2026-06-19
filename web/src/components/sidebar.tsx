import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  UserCog,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { UserRole } from "@/lib/types";

const patientLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/doctors", label: "Find a Doctor", icon: Users },
  { href: "/dashboard/appointments", label: "My Appointments", icon: CalendarDays },
];

const doctorLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/requests", label: "Requests", icon: ClipboardList },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarCheck },
  { href: "/dashboard/profile", label: "My Profile", icon: UserCog },
];

export function Sidebar({ email, role }: { email: string; role: UserRole }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const links = role === "doctor" ? doctorLinks : patientLinks;

  function handleSignOut() {
    signOut();
    navigate("/login");
  }

  return (
    <aside className="flex w-full flex-row items-center justify-between gap-2 border-b border-border bg-card px-4 py-3 md:h-screen md:w-64 md:flex-col md:items-stretch md:justify-start md:border-b-0 md:border-r md:px-4 md:py-6">
      <Link
        to="/dashboard"
        className="flex items-center gap-2 text-lg font-bold md:mb-8 md:px-2"
      >
        <Stethoscope className="h-6 w-6 text-primary" />
        <span className="hidden sm:inline">MediBook</span>
      </Link>

      <nav className="flex flex-1 flex-row gap-1 md:flex-col">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 md:mt-auto md:flex-col md:items-stretch md:gap-3 md:border-t md:border-border md:pt-4">
        <p className="hidden truncate px-2 text-xs text-muted-foreground md:block">
          {email}
        </p>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            type="button"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
