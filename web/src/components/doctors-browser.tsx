import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { DoctorAvatar } from "@/components/doctor-avatar";
import { formatCurrency } from "@/lib/utils";
import type { DoctorWithSpecialty, Specialty } from "@/lib/types";

export function DoctorsBrowser({
  doctors,
  specialties,
}: {
  doctors: DoctorWithSpecialty[];
  specialties: Specialty[];
}) {
  const [query, setQuery] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors.filter((d) => {
      const matchesSpecialty = !specialtyId || d.specialty_id === specialtyId;
      const matchesQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.specialty?.name.toLowerCase().includes(q);
      return matchesSpecialty && matchesQuery;
    });
  }, [doctors, query, specialtyId]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doctors or specialties…"
            className="pl-9"
          />
        </div>
        <Select
          value={specialtyId}
          onChange={(e) => setSpecialtyId(e.target.value)}
          className="sm:w-56"
        >
          <option value="">All specialties</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No doctors match your search.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doctor) => (
            <Link key={doctor.id} to={`/dashboard/doctors/${doctor.id}`}>
              <Card className="h-full p-5 transition-colors hover:border-primary/50">
                <div className="flex items-center gap-3">
                  <DoctorAvatar
                    name={doctor.name}
                    photoUrl={doctor.photo_url}
                    className="h-12 w-12 text-base"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{doctor.name}</h3>
                    {doctor.specialty && (
                      <Badge tone="primary" className="mt-0.5">
                        {doctor.specialty.name}
                      </Badge>
                    )}
                  </div>
                </div>
                {doctor.bio && (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {doctor.bio}
                  </p>
                )}
                <p className="mt-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {formatCurrency(doctor.consultation_fee)}
                  </span>{" "}
                  · {doctor.slot_duration_minutes} min visit
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
