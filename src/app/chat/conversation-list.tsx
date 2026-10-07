"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Row = {
  conversation_id: string;
  other_username: string | null;
  last_message_at: string;
};

export default function ConversationList({
  currentUserId
}: {
  currentUserId: string;
}) {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: myConvs, error: convErr } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUserId);

      if (convErr) {
        console.error(convErr);
        if (active) setLoading(false);
        return;
      }

      const ids = (myConvs ?? []).map((c) => c.conversation_id);
      if (!ids.length) {
        if (active) {
          setRows([]);
          setLoading(false);
        }
        return;
      }

      const { data: convs } = await supabase
        .from("conversations")
        .select("id, last_message_at")
        .in("id", ids)
        .order("last_message_at", { ascending: false });

      const { data: others } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", ids)
        .neq("user_id", currentUserId);

      const otherUserIds = Array.from(
        new Set((others ?? []).map((o) => o.user_id))
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", otherUserIds.length ? otherUserIds : ["00000000-0000-0000-0000-000000000000"]);

      const idToUsername = new Map<string, string>();
      (profiles ?? []).forEach((p) => idToUsername.set(p.id, p.username));

      const convToOtherUsername = new Map<string, string>();
      (others ?? []).forEach((o) => {
        const uname = idToUsername.get(o.user_id);
        if (uname) convToOtherUsername.set(o.conversation_id, uname);
      });

      if (!active) return;
      setRows(
        (convs ?? []).map((c) => ({
          conversation_id: c.id,
          other_username: convToOtherUsername.get(c.id) ?? null,
          last_message_at: c.last_message_at
        }))
      );
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("conversations-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase]);

  if (loading) {
    return <p className="text-xs text-g1-muted">Loading conversations…</p>;
  }

  if (!rows.length) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-g1-border">
        <p className="text-sm text-g1-muted">
          No conversations yet. Start one above.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.conversation_id}>
          <Link
            href={`/chat/${r.conversation_id}`}
            className="flex items-center justify-between rounded-xl border border-g1-border bg-g1-surface px-4 py-3"
          >
            <span className="text-sm font-medium">
              @{r.other_username ?? "unknown"}
            </span>
            <span className="text-xs text-g1-muted">
              {new Date(r.last_message_at).toLocaleDateString()}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}