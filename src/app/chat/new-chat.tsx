"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  findOrCreateConversation,
  createGroupConversation
} from "./actions";

export default function NewChat() {
  const router = useRouter();
  const [tab, setTab] = useState<"direct" | "group">("direct");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Direct
  const [directUsername, setDirectUsername] = useState("");

  // Group
  const [groupTitle, setGroupTitle] = useState("");
  const [groupUsernames, setGroupUsernames] = useState<string[]>([""]);

  function handleDirect(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await findOrCreateConversation(directUsername);
      if (res.error) {
        setError(res.error);
        return;
      }
      setDirectUsername("");
      router.push(`/chat/${res.conversationId}`);
    });
  }

  function handleGroup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanUsernames = groupUsernames
      .map((u) => u.trim())
      .filter(Boolean);

    if (!groupTitle.trim()) {
      setError("Group name required");
      return;
    }
    if (cleanUsernames.length < 1) {
      setError("Add at least one other member");
      return;
    }

    startTransition(async () => {
      const res = await createGroupConversation(groupTitle, cleanUsernames);
      if (res.error) {
        setError(res.error);
        return;
      }
      setGroupTitle("");
      setGroupUsernames([""]);
      router.push(`/chat/${res.conversationId}`);
    });
  }

  function addUsernameField() {
    setGroupUsernames((prev) => [...prev, ""]);
  }

  function removeUsernameField(i: number) {
    setGroupUsernames((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateUsernameField(i: number, value: string) {
    setGroupUsernames((prev) =>
      prev.map((u, idx) => (idx === i ? value : u))
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-g1-border bg-g1-surface p-3">
      <div className="mb-3 flex gap-1 rounded-lg bg-g1-bg p-1">
        <button
          type="button"
          onClick={() => {
            setTab("direct");
            setError(null);
          }}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium ${
            tab === "direct" ? "bg-g1-accent text-white" : "text-g1-muted"
          }`}
        >
          Direct
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("group");
            setError(null);
          }}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium ${
            tab === "group" ? "bg-g1-accent text-white" : "text-g1-muted"
          }`}
        >
          Group
        </button>
      </div>

      {tab === "direct" && (
        <form onSubmit={handleDirect} className="flex gap-2">
          <input
            value={directUsername}
            onChange={(e) => setDirectUsername(e.target.value)}
            placeholder="@username"
            className="flex-1 rounded-lg border border-g1-border bg-g1-bg px-3 py-2 text-sm outline-none focus:border-g1-accent"
          />
          <button
            type="submit"
            disabled={pending || !directUsername.trim()}
            className="rounded-lg bg-g1-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "…" : "Chat"}
          </button>
        </form>
      )}

      {tab === "group" && (
        <form onSubmit={handleGroup} className="space-y-2">
          <input
            value={groupTitle}
            onChange={(e) => setGroupTitle(e.target.value)}
            placeholder="Group name"
            className="w-full rounded-lg border border-g1-border bg-g1-bg px-3 py-2 text-sm outline-none focus:border-g1-accent"
          />

          {groupUsernames.map((u, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={u}
                onChange={(e) => updateUsernameField(i, e.target.value)}
                placeholder={`@username ${i + 1}`}
                className="flex-1 rounded-lg border border-g1-border bg-g1-bg px-3 py-2 text-sm outline-none focus:border-g1-accent"
              />
              {groupUsernames.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeUsernameField(i)}
                  className="rounded-lg border border-g1-border bg-g1-bg px-3 text-xs text-g1-muted"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addUsernameField}
            className="text-xs text-g1-accent"
          >
            + Add another member
          </button>

          <button
            type="submit"
            disabled={pending || !groupTitle.trim()}
            className="w-full rounded-lg bg-g1-accent py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "Creating…" : "Create group"}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}