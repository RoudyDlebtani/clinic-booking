import { api } from "@/lib/api";
import type {
  AppointmentWithDoctor,
  CurrentUser,
  DoctorAppointment,
  DoctorAvailability,
  DoctorProfile,
  DoctorWithSpecialty,
  Specialty,
} from "@/lib/types";

/** The current user's profile, or null if not signed in / request fails. */
export async function getProfile(): Promise<CurrentUser | null> {
  try {
    const { user } = await api<{ user: CurrentUser }>("/api/auth/me");
    return user;
  } catch {
    return null;
  }
}

export async function getSpecialties(): Promise<Specialty[]> {
  return api<Specialty[]>("/api/specialties");
}

export async function getDoctors(
  specialtyId?: string,
): Promise<DoctorWithSpecialty[]> {
  const query = specialtyId ? `?specialtyId=${encodeURIComponent(specialtyId)}` : "";
  return api<DoctorWithSpecialty[]>(`/api/doctors${query}`);
}

export async function getDoctor(
  id: string,
): Promise<DoctorWithSpecialty | null> {
  try {
    return await api<DoctorWithSpecialty>(`/api/doctors/${id}`);
  } catch {
    return null;
  }
}

export async function getDoctorAvailability(
  doctorId: string,
): Promise<DoctorAvailability[]> {
  return api<DoctorAvailability[]>(`/api/doctors/${doctorId}/availability`);
}

/** The free appointment start times (minutes from midnight) for a day. */
export async function getAvailableSlots(
  doctorId: string,
  date: string,
): Promise<number[]> {
  return api<number[]>(
    `/api/doctors/${doctorId}/slots?date=${encodeURIComponent(date)}`,
  );
}

export async function getMyAppointments(): Promise<AppointmentWithDoctor[]> {
  return api<AppointmentWithDoctor[]>("/api/appointments");
}

// ---------- Doctor-side ----------

/** The signed-in doctor's own profile and weekly hours. */
export async function getDoctorProfile(): Promise<DoctorProfile> {
  return api<DoctorProfile>("/api/doctor/profile");
}

/** The signed-in doctor's appointments, optionally limited to one day. */
export async function getDoctorAppointments(
  date?: string,
): Promise<DoctorAppointment[]> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return api<DoctorAppointment[]>(`/api/doctor/appointments${query}`);
}
