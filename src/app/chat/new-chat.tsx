"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { findOrCreateConversation } from "./actions";

export default function NewChat() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await findOrCreateConversation(username);
      if (res.error) {
        setError(res.error);
        return;
      }
      setUsername("");
      router.push(`/chat/${res.conversationId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
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
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}