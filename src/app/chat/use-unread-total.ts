"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUnreadTotal(currentUserId: string) {
  const supabase = createClient();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: myConvs } = await supabase
        .from("conversation_participants")
        .select("conversation_id, last_read_at")
        .eq("user_id", currentUserId);

      if (!myConvs) return;

      let sum = 0;
      for (const c of myConvs) {
        const lastRead = c.last_read_at ?? "1970-01-01";
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.conversation_id)
          .neq("sender_id", currentUserId)
          .gt("created_at", lastRead);
        sum += count ?? 0;
      }

      if (active) setTotal(sum);
    }

    load();

    const channel = supabase
      .channel("unread-total")
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

  return total;
}