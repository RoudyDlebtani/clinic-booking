import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarCheck,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DoctorAppointmentCard } from "@/components/doctor-appointment-card";
import { getDoctorAppointments, getDoctorProfile } from "@/lib/data";
import { CLINIC_TIMEZONE } from "@/lib/constants";
import { todayInTz } from "@/lib/time";
import { useAsync } from "@/lib/use-async";

export function DoctorOverviewPage() {
  const today = todayInTz(CLINIC_TIMEZONE);
  const { data, loading } = useAsync(async () => {
    const [profile, all, todays] = await Promise.all([
      getDoctorProfile(),
      getDoctorAppointments(),
      getDoctorAppointments(today),
    ]);
    return { profile, all, todays };
  }, [today]);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { profile, all, todays } = data;
  const pendingCount = all.filter((a) => a.status === "pending").length;
  const todayActive = todays.filter(
    (a) => a.status !== "declined" && a.status !== "cancelled",
  );
  const needsSetup = profile.availability.length === 0 || !profile.specialty;
  const firstName = profile.name.replace(/^Dr\.?\s*/i, "").split(" ")[0];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">Hi {firstName || "Doctor"} 👋</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Here’s what your day looks like.
      </p>

      {needsSetup && (
        <Card className="mb-6 flex items-center gap-3 border-primary/40 p-5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-medium">Finish setting up your profile</p>
            <p className="text-sm text-muted-foreground">
              Add your specialty and weekly hours so patients can book you.
            </p>
          </div>
          <Link to="/dashboard/profile">
            <Button size="sm">Set up</Button>
          </Link>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/dashboard/requests">
          <Stat
            icon={<ClipboardList className="h-5 w-5" />}
            label="Pending requests"
            value={pendingCount}
          />
        </Link>
        <Link to="/dashboard/schedule">
          <Stat
            icon={<CalendarCheck className="h-5 w-5" />}
            label="Today’s appointments"
            value={todayActive.length}
          />
        </Link>
        <Card className="flex items-center gap-3 p-5">
          <span
            className={
              "inline-flex h-10 w-10 items-center justify-center rounded-lg " +
              (profile.is_active
                ? "bg-positive/10 text-positive"
                : "bg-muted text-muted-foreground")
            }
          >
            <CalendarCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-bold">
              {profile.is_active ? "Active" : "Hidden"}
            </p>
            <p className="text-sm text-muted-foreground">Booking status</p>
          </div>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-muted-foreground">
        Today’s schedule
      </h2>
      {todayActive.length === 0 ? (
        <Card className="p-5 text-sm text-muted-foreground">
          Nothing booked for today.
        </Card>
      ) : (
        <div className="space-y-3">
          {todayActive.map((a) => (
            <DoctorAppointmentCard key={a.id} appointment={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card className="flex h-full items-center gap-3 p-5 transition-colors hover:border-primary/50">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}
