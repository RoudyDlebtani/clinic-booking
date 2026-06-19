export type AppointmentStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "booked"
  | "completed"
  | "cancelled";

export type UserRole = "patient" | "doctor";

export interface Specialty {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty_id: string | null;
  bio: string | null;
  photo_url: string | null;
  consultation_fee: number;
  slot_duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

/** A doctor joined with its specialty, as returned by the listing queries. */
export interface DoctorWithSpecialty extends Doctor {
  specialty: Pick<Specialty, "id" | "name"> | null;
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  weekday: number; // 0 = Sunday … 6 = Saturday
  start_time: string; // "HH:MM:SS"
  end_time: string;
  created_at: string;
}

export interface DoctorTimeOff {
  id: string;
  doctor_id: string;
  date: string; // "yyyy-mm-dd"
  reason: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

/** The signed-in user returned by the API's /auth/me, /login and /signup. */
export interface CurrentUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  patient_name: string;
  reason: string | null;
  starts_at: string; // ISO UTC
  ends_at: string; // ISO UTC
  status: AppointmentStatus;
  created_at: string;
}

/** An appointment joined with its doctor, for the patient's list view. */
export interface AppointmentWithDoctor extends Appointment {
  doctor: Pick<Doctor, "id" | "name" | "photo_url"> & {
    specialty: Pick<Specialty, "name"> | null;
  };
}

/** Row shape returned by the get_booked_ranges SQL function. */
export interface BookedRange {
  start_min: number;
  end_min: number;
}

/** The signed-in doctor's own profile plus weekly hours (GET /api/doctor/profile). */
export interface DoctorProfile extends DoctorWithSpecialty {
  availability: DoctorAvailability[];
}

/** An appointment as the doctor sees it, with patient contact details. */
export interface DoctorAppointment {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_email: string | null;
  reason: string | null;
  starts_at: string; // ISO UTC
  ends_at: string; // ISO UTC
  status: AppointmentStatus;
  created_at: string;
}
