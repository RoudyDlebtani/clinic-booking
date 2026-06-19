import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DoctorAppointmentCard } from "@/components/doctor-appointment-card";
import { getDoctorAppointments } from "@/lib/data";
import { setAppointmentStatus } from "@/lib/actions";
import { useAsync } from "@/lib/use-async";

export function DoctorRequestsPage() {
  const { data, loading, refetch } = useAsync(() => getDoctorAppointments(), []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const pending = (data ?? []).filter((a) => a.status === "pending");

  function act(id: string, status: "accepted" | "declined") {
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
      <h1 className="mb-1 text-2xl font-bold">Appointment requests</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Review and respond to new booking requests from patients.
      </p>

      {error && <p className="mb-4 text-sm text-negative">{error}</p>}

      {loading || !data ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : pending.length === 0 ? (
        <Card className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4" /> No pending requests right now.
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((a) => (
            <DoctorAppointmentCard
              key={a.id}
              appointment={a}
              actions={
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
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
