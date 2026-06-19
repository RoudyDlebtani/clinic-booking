import { Link } from "react-router-dom";
import { Stethoscope } from "lucide-react";
import { AuthForm } from "@/components/auth-form";

export function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8 flex items-center gap-2 text-lg font-bold">
        <Stethoscope className="h-6 w-6 text-primary" /> MediBook
      </Link>
      <AuthForm mode="login" />
    </main>
  );
}
