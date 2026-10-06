"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/chat");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded-2xl border border-g1-border bg-g1-surface p-6"
      >
        <h1 className="mb-1 text-2xl font-bold">Sign in to G1</h1>
        <p className="mb-6 text-sm text-g1-muted">
          Use the G1 ID tied to your email.
        </p>

        <label className="mb-1 block text-xs text-g1-muted">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="mb-4 w-full rounded-lg border border-g1-border bg-g1-bg px-3 py-2 outline-none focus:border-g1-accent"
          placeholder="you@example.com"
        />

        <label className="mb-1 block text-xs text-g1-muted">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="mb-4 w-full rounded-lg border border-g1-border bg-g1-bg px-3 py-2 outline-none focus:border-g1-accent"
          placeholder="Your password"
        />

        {error && (
          <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-g1-accent py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-4 text-center text-xs text-g1-muted">
          New to G1?{" "}
          <Link href="/signup" className="text-g1-accent">
            Create a G1 ID
          </Link>
        </p>
      </form>
    </main>
  );
}