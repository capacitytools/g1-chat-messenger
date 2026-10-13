"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Row = {
  conversation_id: string;
  is_group: boolean;
  title: string | null;
  other_username: string | null;
  other_avatar: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count: number;
};

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

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
      const { data: myConvs, error: myErr } = await supabase
        .from("conversation_participants")
        .select("conversation_id, last_read_at")
        .eq("user_id", currentUserId);

      if (myErr) {
        console.error(myErr);
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
        .select("id, is_group, title, last_message_at")
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
        .select("id, username, avatar_url")
        .in(
          "id",
          otherUserIds.length
            ? otherUserIds
            : ["00000000-0000-0000-0000-000000000000"]
        );

      const idToProfile = new Map<
        string,
        { username: string; avatar_url: string | null }
      >();
      (profiles ?? []).forEach((p) =>
        idToProfile.set(p.id, {
          username: p.username,
          avatar_url: p.avatar_url
        })
      );

      const convToOther = new Map<
        string,
        { username: string; avatar_url: string | null }
      >();
      (others ?? []).forEach((o) => {
        const prof = idToProfile.get(o.user_id);
        if (prof) convToOther.set(o.conversation_id, prof);
      });

      const lastMessageByConv = new Map<string, string | null>();
      const lastMessageTimeByConv = new Map<string, string>();

      for (const cid of ids) {
        const { data: last } = await supabase
          .from("messages")
          .select("content, created_at, attachment_type")
          .eq("conversation_id", cid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (last) {
          lastMessageByConv.set(
            cid,
            last.content ?? (last.attachment_type ? "📎 Attachment" : "")
          );
          lastMessageTimeByConv.set(cid, last.created_at);
        }
      }

      const lastReadByConv = new Map<string, string>();
      (myConvs ?? []).forEach((c) =>
        lastReadByConv.set(c.conversation_id, c.last_read_at ?? "1970-01-01")
      );

      const unreadCounts = new Map<string, number>();
      for (const cid of ids) {
        const lastRead = lastReadByConv.get(cid)!;
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", cid)
          .neq("sender_id", currentUserId)
          .gt("created_at", lastRead);

        unreadCounts.set(cid, count ?? 0);
      }

      if (!active) return;

      const built: Row[] = (convs ?? []).map((c) => {
        const other = convToOther.get(c.id);
        const lastTime = lastMessageTimeByConv.get(c.id) ?? c.last_message_at;
        return {
          conversation_id: c.id,
          is_group: c.is_group ?? false,
          title: c.title,
          other_username: other?.username ?? null,
          other_avatar: other?.avatar_url ?? null,
          last_message_at: lastTime,
          last_message_preview: lastMessageByConv.get(c.id) ?? null,
          unread_count: unreadCounts.get(c.id) ?? 0
        };
      });

      setRows(built);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("conversation-list-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
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
    <ul className="space-y-1">
      {rows.map((r) => {
        const label = r.is_group
          ? r.title ?? "Group"
          : `@${r.other_username ?? "unknown"}`;

        const initial = r.is_group
          ? (r.title?.[0] ?? "#").toUpperCase()
          : (r.other_username?.[0] ?? "?").toUpperCase();

        return (
          <li key={r.conversation_id}>
            <Link
              href={`/chat/${r.conversation_id}`}
              className="flex items-center gap-3 rounded-xl border border-g1-border bg-g1-surface px-3 py-3 hover:border-g1-accent/40"
            >
              <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-g1-bg">
                {!r.is_group && r.other_avatar ? (
                  <Image
                    src={r.other_avatar}
                    alt={r.other_username ?? "avatar"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-medium text-g1-muted">
                    {initial}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">
                    {r.is_group ? `👥 ${label}` : label}
                  </p>
                  <span className="flex-shrink-0 text-[10px] text-g1-muted">
                    {formatRelative(r.last_message_at)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-g1-muted">
                    {r.last_message_preview ?? "No messages yet"}
                  </p>
                  {r.unread_count > 0 && (
                    <span className="flex-shrink-0 rounded-full bg-g1-accent px-2 py-0.5 text-[10px] font-medium text-white">
                      {r.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}