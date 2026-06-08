import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold">KOLSS CRM</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Увійдіть для роботи з лідами
        </p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
