import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, DollarSign, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DoctorAvatar } from "@/components/doctor-avatar";
import { BookingWidget } from "@/components/booking-widget";
import {
  getAvailableSlots,
  getDoctor,
  getDoctorAvailability,
} from "@/lib/data";
import { CLINIC_TIMEZONE, WEEKDAYS } from "@/lib/constants";
import { addDays, formatDateLabel, todayInTz } from "@/lib/time";
import { minutesToLabel, timeToMinutes } from "@/lib/slots";
import { formatCurrency } from "@/lib/utils";
import { useAsync } from "@/lib/use-async";

const VISIBLE_DAYS = 14;

export function DoctorDetailPage() {
  const { id = "" } = useParams();
  const today = todayInTz(CLINIC_TIMEZONE);

  const { data, loading } = useAsync(async () => {
    const doctor = await getDoctor(id);
    if (!doctor) return { doctor: null };
    const [initialSlots, availability] = await Promise.all([
      getAvailableSlots(id, today),
      getDoctorAvailability(id),
    ]);
    return { doctor, initialSlots, availability };
  }, [id]);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data.doctor) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <h1 className="text-xl font-semibold">Doctor not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This doctor doesn’t exist or is no longer available.
        </p>
        <Link to="/dashboard/doctors" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            All doctors
          </Button>
        </Link>
      </div>
    );
  }

  const { doctor, initialSlots, availability } = data;

  const days = Array.from({ length: VISIBLE_DAYS }, (_, i) => {
    const value = addDays(today, i);
    return { value, label: i === 0 ? "Today" : formatDateLabel(value) };
  });

  // Group working hours by weekday for the "schedule" summary.
  const byWeekday = new Map<number, string[]>();
  for (const a of availability) {
    const label = `${minutesToLabel(timeToMinutes(a.start_time))} – ${minutesToLabel(
      timeToMinutes(a.end_time),
    )}`;
    byWeekday.set(a.weekday, [...(byWeekday.get(a.weekday) ?? []), label]);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/dashboard/doctors"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All doctors
      </Link>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <DoctorAvatar
            name={doctor.name}
            photoUrl={doctor.photo_url}
            className="h-16 w-16 text-xl"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{doctor.name}</h1>
            {doctor.specialty && (
              <Badge tone="primary" className="mt-1">
                {doctor.specialty.name}
              </Badge>
            )}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" /> {doctor.slot_duration_minutes} min
                visit
              </span>
              <span className="inline-flex items-center gap-1">
                <DollarSign className="h-4 w-4" />{" "}
                {formatCurrency(doctor.consultation_fee)}
              </span>
            </div>
          </div>
        </div>
        {doctor.bio && (
          <p className="mt-4 text-sm text-muted-foreground">{doctor.bio}</p>
        )}
      </Card>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_220px]">
        <Card className="p-6">
          <BookingWidget
            doctorId={doctor.id}
            days={days}
            initialDate={today}
            initialSlots={initialSlots}
          />
        </Card>

        <Card className="h-fit p-6">
          <h2 className="mb-3 text-sm font-semibold">Weekly schedule</h2>
          <ul className="space-y-1.5 text-sm">
            {WEEKDAYS.map((name, dow) => (
              <li key={dow} className="flex justify-between gap-2">
                <span className="text-muted-foreground">{name.slice(0, 3)}</span>
                <span className="text-right">
                  {byWeekday.get(dow)?.join(", ") ?? (
                    <span className="text-muted-foreground">Closed</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Times shown in clinic time ({CLINIC_TIMEZONE.replace("_", " ")}).
          </p>
        </Card>
      </div>
    </div>
  );
}
