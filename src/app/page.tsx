import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">G1-Chat Messenger</h1>
        <p className="mt-2 text-sm text-g1-muted">
          Communication engine of the G1 ecosystem.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/signup"
          className="rounded-lg bg-g1-accent px-5 py-2 text-sm font-medium text-white"
        >
          Create G1 ID
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-g1-border bg-g1-surface px-5 py-2 text-sm font-medium"
        >
          Sign in
        </Link>
      </div>

      <span className="text-xs text-g1-muted">v0.2 · identity live</span>
    </main>
  );
}