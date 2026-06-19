import { useEffect, useRef, useState, useTransition } from "react";
import { Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Label, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { minutesToLabel, minutesToTime } from "@/lib/slots";
import { bookAppointment, fetchSlots } from "@/lib/actions";

interface DayOption {
  value: string; // yyyy-mm-dd
  label: string; // "Mon, Jun 16"
}

export function BookingWidget({
  doctorId,
  days,
  initialDate,
  initialSlots,
}: {
  doctorId: string;
  days: DayOption[];
  initialDate: string;
  initialSlots: number[];
}) {
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<number[]>(initialSlots);
  const [loading, startLoading] = useTransition();

  const [selected, setSelected] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [booking, startBooking] = useTransition();

  // Reload slots whenever the chosen day changes. The initial day's slots were
  // fetched on the server, so we track which date the current slots belong to
  // and skip the fetch until the user actually switches days.
  const loadedDate = useRef(initialDate);
  useEffect(() => {
    if (date === loadedDate.current) return;
    loadedDate.current = date;
    startLoading(async () => {
      setSlots(await fetchSlots(doctorId, date));
    });
  }, [date, doctorId]);

  function confirmBooking() {
    if (selected == null) return;
    setError(null);
    const form = new FormData();
    form.set("doctorId", doctorId);
    form.set("date", date);
    form.set("startTime", minutesToTime(selected));
    form.set("reason", reason);

    startBooking(async () => {
      const result = await bookAppointment(form);
      if (result.ok) {
        setSuccess(`Booked for ${minutesToLabel(selected)}.`);
        setSelected(null);
        setReason("");
        setSlots(await fetchSlots(doctorId, date));
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm font-medium">
        <Calendar className="h-4 w-4 text-primary" /> Pick a day
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
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

      <div className="mt-5">
        <div className="mb-2 text-sm font-medium">Available times</div>
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading slots…
          </div>
        ) : slots.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No available times on this day. Try another date.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((min) => (
              <Button
                key={min}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelected(min);
                  setError(null);
                }}
              >
                {minutesToLabel(min)}
              </Button>
            ))}
          </div>
        )}
      </div>

      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-positive/10 px-3 py-2 text-sm text-positive">
          <CheckCircle2 className="h-4 w-4" /> {success}
        </div>
      )}

      <Modal
        open={selected != null}
        onClose={() => !booking && setSelected(null)}
        title="Confirm appointment"
      >
        {selected != null && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Booking for{" "}
              <span className="font-medium text-foreground">
                {days.find((d) => d.value === date)?.label}
              </span>{" "}
              at{" "}
              <span className="font-medium text-foreground">
                {minutesToLabel(selected)}
              </span>
              .
            </p>
            <div>
              <Label htmlFor="reason">Reason for visit (optional)</Label>
              <Textarea
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Annual check-up"
              />
            </div>
            {error && <p className="text-sm text-negative">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setSelected(null)}
                disabled={booking}
              >
                Cancel
              </Button>
              <Button onClick={confirmBooking} disabled={booking}>
                {booking ? "Booking…" : "Confirm booking"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
