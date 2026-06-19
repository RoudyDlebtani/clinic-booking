import { Link } from "react-router-dom";
import {
  Activity,
  Baby,
  Brain,
  CalendarCheck,
  Clock,
  Eye,
  Heart,
  Search,
  ShieldCheck,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function HomePage() {
  const { user } = useAuth();

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="flex items-center gap-2 text-lg font-bold">
          <Stethoscope className="h-6 w-6 text-primary" /> MediBook
        </span>
        <nav className="flex items-center gap-2">
          {user ? (
            <Link to="/dashboard">
              <Button size="sm">Go to dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <CalendarCheck className="h-4 w-4" /> Real-time appointment booking
        </span>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Book a doctor’s appointment in seconds
        </h1>
        <p className="mt-4 max-w-xl text-balance text-lg text-muted-foreground">
          Browse specialists, see live availability, and lock in a time slot —
          with guaranteed no double-booking.
        </p>
        <div className="mt-8 flex gap-3">
          <Link to={user ? "/dashboard/doctors" : "/signup"}>
            <Button size="md">Find a doctor</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="md">
              I have an account
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <Feature
            icon={<Clock className="h-5 w-5" />}
            title="Live availability"
            body="Slots are generated from each doctor’s real working hours and existing bookings."
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="No double-booking"
            body="Enforced at the database level, so two patients can never grab the same slot."
          />
          <Feature
            icon={<CalendarCheck className="h-5 w-5" />}
            title="Manage with ease"
            body="View upcoming visits and cancel in a tap from your dashboard."
          />
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4">
          <Stat value="120+" label="Verified doctors" />
          <Stat value="25" label="Specialties" />
          <Stat value="8k+" label="Appointments booked" />
          <Stat value="<30s" label="Average booking time" />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-4xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <p className="mt-3 text-muted-foreground">
            From search to confirmed visit in three simple steps.
          </p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          <Step
            number="1"
            icon={<Search className="h-5 w-5" />}
            title="Find your specialist"
            body="Search by specialty or name and compare doctors at a glance."
          />
          <Step
            number="2"
            icon={<CalendarCheck className="h-5 w-5" />}
            title="Pick a live slot"
            body="See real-time openings pulled from each doctor’s working hours."
          />
          <Step
            number="3"
            icon={<UserCheck className="h-5 w-5" />}
            title="Confirm instantly"
            body="Your slot is locked the moment you book — no waiting, no overlap."
          />
        </div>
      </section>

      {/* Specialties */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto w-full max-w-4xl px-6 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Care for every need
            </h2>
            <p className="mt-3 text-muted-foreground">
              Connect with specialists across a wide range of fields.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Specialty
              icon={<Heart className="h-5 w-5" />}
              title="Cardiology"
              body="Heart health, screenings, and ongoing care."
            />
            <Specialty
              icon={<Brain className="h-5 w-5" />}
              title="Neurology"
              body="Headaches, nerve, and brain-related concerns."
            />
            <Specialty
              icon={<Baby className="h-5 w-5" />}
              title="Pediatrics"
              body="Trusted care for infants, children, and teens."
            />
            <Specialty
              icon={<Eye className="h-5 w-5" />}
              title="Ophthalmology"
              body="Eye exams, vision care, and treatment."
            />
            <Specialty
              icon={<Activity className="h-5 w-5" />}
              title="General medicine"
              body="Checkups, prescriptions, and everyday health."
            />
            <Specialty
              icon={<Stethoscope className="h-5 w-5" />}
              title="And many more"
              body="Browse the full directory of available doctors."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto w-full max-w-4xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Loved by patients
          </h2>
          <p className="mt-3 text-muted-foreground">
            A faster, calmer way to see a doctor.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <Testimonial
            quote="I booked a cardiologist on my lunch break. The whole thing took less than a minute."
            name="Sarah K."
            role="Patient"
          />
          <Testimonial
            quote="No more phone tag with the front desk. I can see open slots and just pick one."
            name="Daniel M."
            role="Patient"
          />
          <Testimonial
            quote="Rescheduling used to be a pain. Now I manage everything from one dashboard."
            name="Aisha R."
            role="Patient"
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto w-full max-w-3xl px-6 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
          </div>
          <div className="mt-12 grid gap-6">
            <Faq
              question="How much does it cost?"
              answer="Booking through MediBook is free. You only pay for the appointment itself, directly with the clinic."
            />
            <Faq
              question="Can two people book the same slot?"
              answer="No. Availability is enforced at the database level, so once a slot is taken it disappears for everyone else instantly."
            />
            <Faq
              question="Can I cancel or reschedule?"
              answer="Yes. Manage all of your upcoming visits — including cancellations — from your dashboard in a couple of taps."
            />
            <Faq
              question="Do I need an account?"
              answer="A free account lets you book, track, and manage appointments. Signing up takes under a minute."
            />
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto w-full max-w-3xl px-6 py-20 text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to see a doctor?
        </h2>
        <p className="mt-4 text-balance text-lg text-muted-foreground">
          Join thousands of patients booking smarter. It only takes a minute to
          get started.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to={user ? "/dashboard/doctors" : "/signup"}>
            <Button size="md">Find a doctor</Button>
          </Link>
          {!user && (
            <Link to="/login">
              <Button variant="outline" size="md">
                Log in
              </Button>
            </Link>
          )}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
        MediBook — a portfolio demo. Not a real clinic.
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-left">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-primary sm:text-4xl">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function Step({
  number,
  icon,
  title,
  body,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="text-center">
      <div className="relative mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {number}
        </span>
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Specialty({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-5 text-left">
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function Testimonial({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <figure className="flex h-full flex-col rounded-xl border border-border bg-card p-5 text-left">
      <blockquote className="flex-1 text-sm text-muted-foreground">
        “{quote}”
      </blockquote>
      <figcaption className="mt-4 text-sm font-semibold">
        {name}{" "}
        <span className="font-normal text-muted-foreground">· {role}</span>
      </figcaption>
    </figure>
  );
}

function Faq({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-left">
      <h3 className="font-semibold">{question}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{answer}</p>
    </div>
  );
}
