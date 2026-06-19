import { Loader2 } from "lucide-react";
import { DoctorsBrowser } from "@/components/doctors-browser";
import { getDoctors, getSpecialties } from "@/lib/data";
import { useAsync } from "@/lib/use-async";

export function DoctorsPage() {
  const { data, loading } = useAsync(
    async () => {
      const [doctors, specialties] = await Promise.all([
        getDoctors(),
        getSpecialties(),
      ]);
      return { doctors, specialties };
    },
    [],
  );

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-1 text-2xl font-bold">Find a Doctor</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Choose a specialist to see live availability and book a visit.
      </p>
      {loading || !data ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DoctorsBrowser doctors={data.doctors} specialties={data.specialties} />
      )}
    </div>
  );
}
