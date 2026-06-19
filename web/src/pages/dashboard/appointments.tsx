import { Loader2 } from "lucide-react";
import { AppointmentsView } from "@/components/appointments-view";
import { getMyAppointments } from "@/lib/data";
import { splitAppointments } from "@/lib/appointments";
import { useAsync } from "@/lib/use-async";

export function AppointmentsPage() {
  const { data, loading, refetch } = useAsync(
    () => getMyAppointments(),
    [],
  );
  const { upcoming, past } = splitAppointments(data ?? []);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">My Appointments</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Your upcoming visits and booking history.
      </p>
      {loading || !data ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AppointmentsView upcoming={upcoming} past={past} onChanged={refetch} />
      )}
    </div>
  );
}
