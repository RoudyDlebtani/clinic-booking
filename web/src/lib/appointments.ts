import type { AppointmentStatus, AppointmentWithDoctor } from "@/lib/types";

type Tone = "primary" | "positive" | "neutral" | "negative";

/** Human-friendly label shown to both patients and doctors for each status. */
export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Awaiting confirmation",
  accepted: "Confirmed",
  declined: "Declined",
  booked: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Badge tone for each status. */
export const STATUS_TONE: Record<AppointmentStatus, Tone> = {
  pending: "neutral",
  accepted: "positive",
  declined: "negative",
  booked: "primary",
  completed: "positive",
  cancelled: "negative",
};

/**
 * Splits a patient's appointments into upcoming (still-booked, in the future,
 * soonest first) and everything else (past or cancelled, most recent first).
 * Kept out of component render bodies so the `Date.now()` read stays pure there.
 */
export function splitAppointments(appointments: AppointmentWithDoctor[]): {
  upcoming: AppointmentWithDoctor[];
  past: AppointmentWithDoctor[];
} {
  const now = Date.now();
  const isUpcoming = (a: AppointmentWithDoctor) =>
    (a.status === "pending" ||
      a.status === "accepted" ||
      a.status === "booked") &&
    new Date(a.starts_at).getTime() > now;

  const upcoming = appointments
    .filter(isUpcoming)
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
  const past = appointments.filter((a) => !isUpcoming(a));

  return { upcoming, past };
}
