export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-3xl font-bold tracking-tight">G1-Chat Messenger</h1>
      <p className="text-g1-muted text-sm">Communication engine of the G1 ecosystem</p>
      <span className="mt-4 rounded-full border border-g1-border bg-g1-surface px-4 py-1 text-xs text-g1-muted">
        v0.1 · scaffolding live
      </span>
    </main>
  );
}