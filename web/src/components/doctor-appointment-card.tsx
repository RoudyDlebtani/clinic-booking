import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/appointments";
import { CLINIC_TIMEZONE } from "@/lib/constants";
import { formatAppointmentTime, formatTimeOfDay } from "@/lib/time";
import type { DoctorAppointment } from "@/lib/types";

/**
 * One appointment as the doctor sees it: patient, time range, status, and an
 * optional slot for action buttons (Accept / Decline / Complete).
 */
export function DoctorAppointmentCard({
  appointment,
  actions,
}: {
  appointment: DoctorAppointment;
  actions?: ReactNode;
}) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">
            {appointment.patient_name}
          </span>
          <Badge tone={STATUS_TONE[appointment.status]}>
            {STATUS_LABEL[appointment.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatAppointmentTime(appointment.starts_at, CLINIC_TIMEZONE)} –{" "}
          {formatTimeOfDay(appointment.ends_at, CLINIC_TIMEZONE)}
        </p>
        {appointment.patient_email && (
          <p className="truncate text-sm text-muted-foreground">
            {appointment.patient_email}
          </p>
        )}
        {appointment.reason && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            “{appointment.reason}”
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </Card>
  );
}
