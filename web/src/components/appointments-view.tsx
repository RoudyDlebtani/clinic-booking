import { useState, useTransition } from "react";
import { CalendarX2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Label, Textarea } from "@/components/ui/field";
import { DoctorAvatar } from "@/components/doctor-avatar";
import { CLINIC_TIMEZONE } from "@/lib/constants";
import { formatAppointmentTime } from "@/lib/time";
import { cancelAppointment } from "@/lib/actions";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/appointments";
import type { AppointmentWithDoctor } from "@/lib/types";

/** Statuses a patient can still cancel. */
const CANCELLABLE = new Set(["pending", "accepted", "booked"]);

export function AppointmentsView({
  upcoming,
  past,
  onChanged,
}: {
  upcoming: AppointmentWithDoctor[];
  past: AppointmentWithDoctor[];
  onChanged: () => void;
}) {
  const [toCancel, setToCancel] = useState<AppointmentWithDoctor | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openCancel(a: AppointmentWithDoctor) {
    setReason("");
    setError(null);
    setToCancel(a);
  }

  function closeCancel() {
    setToCancel(null);
    setReason("");
    setError(null);
  }

  function confirmCancel() {
    if (!toCancel || reason.trim() === "") return;
    setError(null);
    const form = new FormData();
    form.set("appointmentId", toCancel.id);
    form.set("reason", reason.trim());
    startTransition(async () => {
      const result = await cancelAppointment(form);
      if (result.ok) {
        closeCancel();
        onChanged();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      <Section
        title="Upcoming"
        empty="You have no upcoming appointments."
        items={upcoming}
        onCancel={openCancel}
      />
      <Section title="Past & cancelled" items={past} />

      <Modal
        open={toCancel != null}
        onClose={() => !pending && closeCancel()}
        title="Cancel appointment?"
      >
        {toCancel && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cancel your visit with{" "}
              <span className="font-medium text-foreground">
                {toCancel.doctor.name}
              </span>{" "}
              on{" "}
              <span className="font-medium text-foreground">
                {formatAppointmentTime(toCancel.starts_at, CLINIC_TIMEZONE)}
              </span>
              ?
            </p>
            <div>
              <Label htmlFor="cancel-reason">Reason for cancelling</Label>
              <Textarea
                id="cancel-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Let the doctor know why you're cancelling…"
                autoFocus
              />
              <p className="mt-1 text-xs text-muted-foreground">
                The doctor will see this reason.
              </p>
            </div>
            {error && <p className="text-sm text-negative">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeCancel} disabled={pending}>
                Keep it
              </Button>
              <Button
                variant="danger"
                onClick={confirmCancel}
                disabled={pending || reason.trim() === ""}
              >
                {pending ? "Cancelling…" : "Cancel appointment"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Section({
  title,
  items,
  empty,
  onCancel,
}: {
  title: string;
  items: AppointmentWithDoctor[];
  empty?: string;
  onCancel?: (a: AppointmentWithDoctor) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        {title}
      </h2>
      {items.length === 0 ? (
        empty ? (
          <Card className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
            <CalendarX2 className="h-4 w-4" /> {empty}
          </Card>
        ) : null
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} className="flex items-center gap-4 p-4">
              <DoctorAvatar
                name={a.doctor.name}
                photoUrl={a.doctor.photo_url}
                className="h-11 w-11"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{a.doctor.name}</span>
                  <Badge tone={STATUS_TONE[a.status]}>
                    {STATUS_LABEL[a.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {a.doctor.specialty?.name && `${a.doctor.specialty.name} · `}
                  {formatAppointmentTime(a.starts_at, CLINIC_TIMEZONE)}
                </p>
                {a.reason && (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    “{a.reason}”
                  </p>
                )}
              </div>
              {onCancel && CANCELLABLE.has(a.status) && (
                <Button variant="danger" size="sm" onClick={() => onCancel(a)}>
                  Cancel
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
