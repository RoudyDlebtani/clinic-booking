import { api } from "@/lib/api";
import { getAvailableSlots } from "@/lib/data";
import type { ActionResult } from "@/lib/validation";

/** Returns the free slot start times (minutes from midnight) for a day. */
export async function fetchSlots(
  doctorId: string,
  date: string,
): Promise<number[]> {
  return getAvailableSlots(doctorId, date);
}

function toError(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

/**
 * Books an appointment. The backend validates the request, converts the
 * clinic-local time to UTC, and relies on a DB exclusion constraint so two
 * patients can't both grab the same slot.
 */
export async function bookAppointment(
  formData: FormData,
): Promise<ActionResult> {
  try {
    await api("/api/appointments", {
      method: "POST",
      body: {
        doctorId: formData.get("doctorId"),
        date: formData.get("date"),
        startTime: formData.get("startTime"),
        reason: formData.get("reason"),
      },
    });
    return { ok: true };
  } catch (err) {
    return toError(err, "Could not book the appointment.");
  }
}

/** Cancels one of the current user's appointments. */
export async function cancelAppointment(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const id = String(formData.get("appointmentId"));
    await api(`/api/appointments/${id}/cancel`, { method: "PATCH" });
    return { ok: true };
  } catch (err) {
    return toError(err, "Could not cancel the appointment.");
  }
}

// ---------- Doctor-side ----------

interface DoctorProfileInput {
  name: string;
  specialtyId: string | null;
  bio: string | null;
  consultationFee: number;
  slotDurationMinutes: number;
  isActive: boolean;
}

/** Updates the signed-in doctor's profile fields. */
export async function updateDoctorProfile(
  input: DoctorProfileInput,
): Promise<ActionResult> {
  try {
    await api("/api/doctor/profile", { method: "PATCH", body: input });
    return { ok: true };
  } catch (err) {
    return toError(err, "Could not save your profile.");
  }
}

/** Replaces the signed-in doctor's whole weekly availability. */
export async function saveDoctorAvailability(
  windows: { weekday: number; startTime: string; endTime: string }[],
): Promise<ActionResult> {
  try {
    await api("/api/doctor/availability", { method: "PUT", body: { windows } });
    return { ok: true };
  } catch (err) {
    return toError(err, "Could not save your availability.");
  }
}

/** Accept/decline a request, or mark an accepted visit completed. */
export async function setAppointmentStatus(
  id: string,
  status: "accepted" | "declined" | "completed",
): Promise<ActionResult> {
  try {
    await api(`/api/doctor/appointments/${id}`, {
      method: "PATCH",
      body: { status },
    });
    return { ok: true };
  } catch (err) {
    return toError(err, "Could not update the appointment.");
  }
}
