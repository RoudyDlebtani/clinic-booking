import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Stethoscope, User } from "lucide-react";
import { api, setToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { CurrentUser, UserRole } from "@/lib/types";

interface AuthResponse {
  token: string;
  user: CurrentUser;
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("patient");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { token, user } = isLogin
        ? await api<AuthResponse>("/api/auth/login", {
            method: "POST",
            body: { email, password },
          })
        : await api<AuthResponse>("/api/auth/signup", {
            method: "POST",
            body: { fullName, email, password, role },
          });
      setToken(token);
      setUser(user);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-1 text-2xl font-bold">
        {isLogin ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {isLogin
          ? "Log in to manage your appointments."
          : role === "doctor"
            ? "Sign up to offer appointments to patients."
            : "Sign up to book appointments with our doctors."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <Label>I'm signing up as a…</Label>
            <div className="grid grid-cols-2 gap-2">
              <RoleOption
                active={role === "patient"}
                onClick={() => setRole("patient")}
                icon={<User className="h-4 w-4" />}
                label="Client"
              />
              <RoleOption
                active={role === "doctor"}
                onClick={() => setRole("doctor")}
                icon={<Stethoscope className="h-4 w-4" />}
                label="Doctor"
              />
            </div>
          </div>
        )}
        {!isLogin && (
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={role === "doctor" ? "Dr. Jane Doe" : "Jane Doe"}
            />
          </div>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <Link
          to={isLogin ? "/signup" : "/login"}
          className="font-medium text-primary hover:underline"
        >
          {isLogin ? "Sign up" : "Log in"}
        </Link>
      </p>
    </div>
  );
}

function RoleOption({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
