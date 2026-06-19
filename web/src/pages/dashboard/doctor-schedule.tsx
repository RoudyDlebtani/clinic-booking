import { useState, useTransition } from "react";
import { CalendarX2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DoctorAppointmentCard } from "@/components/doctor-appointment-card";
import { getDoctorAppointments } from "@/lib/data";
import { setAppointmentStatus } from "@/lib/actions";
import { CLINIC_TIMEZONE } from "@/lib/constants";
import { addDays, formatDateLabel, todayInTz } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useAsync } from "@/lib/use-async";

const VISIBLE_DAYS = 14;

export function DoctorSchedulePage() {
  const today = todayInTz(CLINIC_TIMEZONE);
  const [date, setDate] = useState(today);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const { data, loading, refetch } = useAsync(
    () => getDoctorAppointments(date),
    [date],
  );

  // Active appointments only — declined/cancelled requests aren't on the schedule.
  const items = (data ?? []).filter(
    (a) => a.status !== "declined" && a.status !== "cancelled",
  );

  const days = Array.from({ length: VISIBLE_DAYS }, (_, i) => {
    const value = addDays(today, i);
    return { value, label: i === 0 ? "Today" : formatDateLabel(value) };
  });

  function act(id: string, status: "accepted" | "declined" | "completed") {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const result = await setAppointmentStatus(id, status);
      if (result.ok) refetch();
      else setError(result.error);
      setBusyId(null);
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">My schedule</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Your appointments for each day, in clinic time.
      </p>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
        {days.map((d) => (
          <button
            key={d.value}
            onClick={() => setDate(d.value)}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-2 text-sm transition-colors",
              d.value === date
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border hover:bg-muted",
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-negative">{error}</p>}

      {loading || !data ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
          <CalendarX2 className="h-4 w-4" /> No appointments on this day.
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <DoctorAppointmentCard
              key={a.id}
              appointment={a}
              actions={
                a.status === "pending" ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => act(a.id, "accepted")}
                      disabled={busyId === a.id}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => act(a.id, "declined")}
                      disabled={busyId === a.id}
                    >
                      Decline
                    </Button>
                  </>
                ) : a.status === "accepted" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => act(a.id, "completed")}
                    disabled={busyId === a.id}
                  >
                    Mark completed
                  </Button>
                ) : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
