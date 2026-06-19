import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { getDoctorProfile, getSpecialties } from "@/lib/data";
import { saveDoctorAvailability, updateDoctorProfile } from "@/lib/actions";
import { WEEKDAYS } from "@/lib/constants";
import { useAsync } from "@/lib/use-async";
import type { DoctorProfile, Specialty } from "@/lib/types";

interface Window {
  weekday: number;
  startTime: string; // "HH:MM"
  endTime: string;
}

export function DoctorProfilePage() {
  const { data, loading } = useAsync(async () => {
    const [profile, specialties] = await Promise.all([
      getDoctorProfile(),
      getSpecialties(),
    ]);
    return { profile, specialties };
  }, []);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <ProfileEditor profile={data.profile} specialties={data.specialties} />;
}

function ProfileEditor({
  profile,
  specialties,
}: {
  profile: DoctorProfile;
  specialties: Specialty[];
}) {
  const [name, setName] = useState(profile.name);
  const [specialtyId, setSpecialtyId] = useState(profile.specialty_id ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [fee, setFee] = useState(String(profile.consultation_fee));
  const [slot, setSlot] = useState(String(profile.slot_duration_minutes));
  const [isActive, setIsActive] = useState(profile.is_active);
  const [windows, setWindows] = useState<Window[]>(
    profile.availability.map((a) => ({
      weekday: a.weekday,
      startTime: a.start_time.slice(0, 5),
      endTime: a.end_time.slice(0, 5),
    })),
  );

  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [hoursMsg, setHoursMsg] = useState<string | null>(null);
  const [hoursErr, setHoursErr] = useState<string | null>(null);
  const [savingProfile, startProfile] = useTransition();
  const [savingHours, startHours] = useTransition();

  function saveProfile() {
    setProfileMsg(null);
    setProfileErr(null);
    startProfile(async () => {
      const result = await updateDoctorProfile({
        name,
        specialtyId: specialtyId || null,
        bio: bio.trim() || null,
        consultationFee: Number(fee),
        slotDurationMinutes: Number(slot),
        isActive,
      });
      if (result.ok) setProfileMsg("Profile saved.");
      else setProfileErr(result.error);
    });
  }

  function saveHours() {
    setHoursMsg(null);
    setHoursErr(null);
    for (const w of windows) {
      if (w.startTime >= w.endTime) {
        setHoursErr("Each window's start time must be before its end time.");
        return;
      }
    }
    startHours(async () => {
      const result = await saveDoctorAvailability(windows);
      if (result.ok) setHoursMsg("Availability saved.");
      else setHoursErr(result.error);
    });
  }

  function updateWindow(i: number, patch: Partial<Window>) {
    setWindows((ws) => ws.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My profile</h1>
        <p className="text-sm text-muted-foreground">
          This is what patients see when they browse for a doctor.
        </p>
      </div>

      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-semibold">Details</h2>
        <div>
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dr. Jane Doe"
          />
        </div>
        <div>
          <Label htmlFor="specialty">Specialty</Label>
          <Select
            id="specialty"
            value={specialtyId}
            onChange={(e) => setSpecialtyId(e.target.value)}
          >
            <option value="">No specialty</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell patients about your experience…"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fee">Consultation fee ($)</Label>
            <Input
              id="fee"
              type="number"
              min={0}
              value={fee}
              onChange={(e) => setFee(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="slot">Visit length (minutes)</Label>
            <Input
              id="slot"
              type="number"
              min={5}
              max={240}
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4"
          />
          Accept new bookings (visible to patients)
        </label>

        {profileMsg && (
          <p className="flex items-center gap-2 text-sm text-positive">
            <CheckCircle2 className="h-4 w-4" /> {profileMsg}
          </p>
        )}
        {profileErr && <p className="text-sm text-negative">{profileErr}</p>}
        <div className="flex justify-end">
          <Button onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save details"}
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Weekly hours</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setWindows((ws) => [
                ...ws,
                { weekday: 1, startTime: "09:00", endTime: "17:00" },
              ])
            }
          >
            <Plus className="h-4 w-4" /> Add window
          </Button>
        </div>

        {windows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No working hours yet — add a window so patients can book you.
          </p>
        ) : (
          <div className="space-y-2">
            {windows.map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={w.weekday}
                  onChange={(e) =>
                    updateWindow(i, { weekday: Number(e.target.value) })
                  }
                  className="flex-1"
                >
                  {WEEKDAYS.map((name, dow) => (
                    <option key={dow} value={dow}>
                      {name}
                    </option>
                  ))}
                </Select>
                <Input
                  type="time"
                  value={w.startTime}
                  onChange={(e) => updateWindow(i, { startTime: e.target.value })}
                  className="w-32"
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="time"
                  value={w.endTime}
                  onChange={(e) => updateWindow(i, { endTime: e.target.value })}
                  className="w-32"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setWindows((ws) => ws.filter((_, idx) => idx !== i))
                  }
                  aria-label="Remove window"
                >
                  <Trash2 className="h-4 w-4 text-negative" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {hoursMsg && (
          <p className="flex items-center gap-2 text-sm text-positive">
            <CheckCircle2 className="h-4 w-4" /> {hoursMsg}
          </p>
        )}
        {hoursErr && <p className="text-sm text-negative">{hoursErr}</p>}
        <div className="flex justify-end">
          <Button onClick={saveHours} disabled={savingHours}>
            {savingHours ? "Saving…" : "Save hours"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
