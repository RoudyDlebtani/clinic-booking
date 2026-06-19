import { Link } from "react-router-dom";
import {
  CalendarClock,
  CalendarDays,
  Loader2,
  Plus,
  Stethoscope,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DoctorAvatar } from "@/components/doctor-avatar";
import { getMyAppointments, getProfile } from "@/lib/data";
import { splitAppointments } from "@/lib/appointments";
import { CLINIC_TIMEZONE } from "@/lib/constants";
import { formatAppointmentTime } from "@/lib/time";
import { useAsync } from "@/lib/use-async";

export function DashboardOverviewPage() {
  const { data, loading } = useAsync(
    async () => {
      const [profile, appointments] = await Promise.all([
        getProfile(),
        getMyAppointments(),
      ]);
      return { profile, appointments };
    },
    [],
  );

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { profile, appointments } = data;
  const { upcoming } = splitAppointments(appointments);
  const next = upcoming[0];
  const completed = appointments.filter((a) => a.status === "completed").length;

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">Hi {firstName} 👋</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Here’s a quick look at your appointments.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={<CalendarClock className="h-5 w-5" />}
          label="Upcoming"
          value={upcoming.length}
        />
        <Stat
          icon={<CalendarDays className="h-5 w-5" />}
          label="Completed visits"
          value={completed}
        />
        <Link to="/dashboard/doctors" className="sm:col-span-1">
          <Card className="flex h-full items-center gap-3 p-5 transition-colors hover:border-primary/50">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Plus className="h-5 w-5" />
            </span>
            <span className="font-medium">Book a new appointment</span>
          </Card>
        </Link>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-muted-foreground">
        Next appointment
      </h2>
      {next ? (
        <Card className="flex items-center gap-4 p-5">
          <DoctorAvatar
            name={next.doctor.name}
            photoUrl={next.doctor.photo_url}
            className="h-12 w-12"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{next.doctor.name}</span>
              {next.doctor.specialty?.name && (
                <Badge tone="primary">{next.doctor.specialty.name}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatAppointmentTime(next.starts_at, CLINIC_TIMEZONE)} · clinic
              time
            </p>
          </div>
          <Link to="/dashboard/appointments">
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Stethoscope className="h-6 w-6" />
          </span>
          <p className="text-sm text-muted-foreground">
            You have no upcoming appointments.
          </p>
          <Link to="/dashboard/doctors">
            <Button size="sm">Find a doctor</Button>
          </Link>
        </Card>
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
    <Card className="flex items-center gap-3 p-5">
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
