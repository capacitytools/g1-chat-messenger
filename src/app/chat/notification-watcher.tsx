"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "./toast";

export default function NotificationWatcher({
  currentUserId,
  currentConversationId
}: {
  currentUserId: string;
  currentConversationId?: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const { showToast } = useToast();
  const originalTitle = useRef<string>("");

  useEffect(() => {
    originalTitle.current = document.title;
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("global-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as any;

          // Skip own messages
          if (msg.sender_id === currentUserId) return;

          // Skip if currently viewing this conversation
          if (currentConversationId === msg.conversation_id) return;

          // Get sender info + conversation info
          const { data: sender } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", msg.sender_id)
            .maybeSingle();

          const senderName = sender?.username ?? "Someone";
          const preview = msg.content ?? "📎 Attachment";

          showToast({
            title: `@${senderName}`,
            body: preview,
            href: `/chat/${msg.conversation_id}`
          });

          // Flash the tab title
          document.title = `💬 New from @${senderName}`;
          setTimeout(() => {
            document.title = originalTitle.current;
          }, 4000);

          // Optional: subtle vibration on mobile
          if ("vibrate" in navigator) {
            try {
              (navigator as any).vibrate(80);
            } catch {}
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      document.title = originalTitle.current;
    };
  }, [currentUserId, currentConversationId, showToast, supabase]);

  return null;
}