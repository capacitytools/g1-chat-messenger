"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanUsername = username.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      setError("Username must be 3–20 chars: a–z, 0–9, underscore.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: cleanUsername,
          display_name: cleanUsername
        }
      }
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
        onSubmit={handleSignup}
        className="w-full max-w-sm rounded-2xl border border-g1-border bg-g1-surface p-6"
      >
        <h1 className="mb-1 text-2xl font-bold">Create your G1 ID</h1>
        <p className="mb-6 text-sm text-g1-muted">
          One identity for the entire G1 ecosystem.
        </p>

        <label className="mb-1 block text-xs text-g1-muted">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          className="mb-4 w-full rounded-lg border border-g1-border bg-g1-bg px-3 py-2 outline-none focus:border-g1-accent"
          placeholder="yourname"
        />

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
          minLength={8}
          autoComplete="new-password"
          className="mb-4 w-full rounded-lg border border-g1-border bg-g1-bg px-3 py-2 outline-none focus:border-g1-accent"
          placeholder="At least 8 characters"
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
          {loading ? "Creating…" : "Create G1 ID"}
        </button>

        <p className="mt-4 text-center text-xs text-g1-muted">
          Already have a G1 ID?{" "}
          <Link href="/login" className="text-g1-accent">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}