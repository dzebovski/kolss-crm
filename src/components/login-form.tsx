"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const deactivated = searchParams.get("error") === "deactivated";
  const [error, setError] = useState<string | null>(
    deactivated ? "Обліковий запис деактивовано. Зверніться до адміністратора." : null
  );
  const [loading, setLoading] = useState(false);

  function submitOnEnter(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: signInData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    if (signInData.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", signInData.user.id)
        .single();

      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        setLoading(false);
        setError("Обліковий запис деактивовано. Зверніться до адміністратора.");
        return;
      }
    }

    setLoading(false);
    const next = searchParams.get("next") ?? "/app/leads";
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Email</label>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={submitOnEnter}
          className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Пароль</label>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={submitOnEnter}
          className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Вхід…" : "Увійти"}
      </Button>
    </form>
  );
}
