"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function UnreadHeader({
  currentUserId,
  username
}: {
  currentUserId: string;
  username: string;
}) {
  const supabase = createClient();
  const [total, setTotal] = useState(0);
  const [firstUnreadConvId, setFirstUnreadConvId] = useState<string | null>(
    null
  );

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: myConvs } = await supabase
        .from("conversation_participants")
        .select("conversation_id, last_read_at")
        .eq("user_id", currentUserId);

      if (!myConvs) return;

      let sum = 0;
      let firstUnread: string | null = null;
      let newestUnreadAt = 0;

      for (const c of myConvs) {
        const lastRead = c.last_read_at ?? "1970-01-01";
        const { data: unread } = await supabase
          .from("messages")
          .select("id, created_at")
          .eq("conversation_id", c.conversation_id)
          .neq("sender_id", currentUserId)
          .gt("created_at", lastRead)
          .order("created_at", { ascending: false })
          .limit(20);

        const cnt = unread?.length ?? 0;
        sum += cnt;

        if (cnt > 0 && unread && unread[0]) {
          const t = new Date(unread[0].created_at).getTime();
          if (t > newestUnreadAt) {
            newestUnreadAt = t;
            firstUnread = c.conversation_id;
          }
        }
      }

      if (active) {
        setTotal(sum);
        setFirstUnreadConvId(firstUnread);
      }
    }

    load();

    const channel = supabase
      .channel("unread-header-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_participants" },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase]);

  return (
    <div className="flex items-center gap-2">
      <div>
        <h1 className="text-xl font-bold">G1-Chat</h1>
        <p className="text-xs text-g1-muted">@{username}</p>
      </div>

      {total > 0 &&
        (firstUnreadConvId ? (
          <Link
            href={`/chat/${firstUnreadConvId}`}
            className="rounded-full bg-g1-accent px-2 py-0.5 text-[10px] font-medium text-white hover:opacity-90"
          >
            {total} new
          </Link>
        ) : (
          <span className="rounded-full bg-g1-accent px-2 py-0.5 text-[10px] font-medium text-white">
            {total} new
          </span>
        ))}
    </div>
  );
}