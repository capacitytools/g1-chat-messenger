"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { findOrCreateConversation } from "./actions";

export default function NewChat() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<Record<string, unknown> | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDebug(null);

    startTransition(async () => {
      const res: any = await findOrCreateConversation(username);
      if (res.error) {
        setError(res.error);
        if (res.debug) setDebug(res.debug);
        return;
      }
      setUsername("");
      router.push(`/chat/${res.conversationId}`);
    });
  }

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="@username"
          className="flex-1 rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
        />
        <button
          type="submit"
          disabled={pending || !username.trim()}
          className="rounded-lg bg-g1-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "…" : "Chat"}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-xs text-red-400">
          <strong>{error}</strong>
        </p>
      )}

      {debug && (
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-red-500/30 bg-red-500/5 p-2 text-[10px] leading-tight text-red-300">
          {JSON.stringify(debug, null, 2)}
        </pre>
      )}
    </div>
  );
}