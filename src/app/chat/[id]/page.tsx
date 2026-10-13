import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MessageThread from "./message-thread";
import { ToastProvider } from "../toast";
import NotificationWatcher from "../notification-watcher";
import GroupHeader from "./group-header";

export default async function ConversationPage({
  params
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, is_group, title")
    .eq("id", params.id)
    .maybeSingle();

  if (!conv) notFound();

  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", params.id);

  const participantIds = (participants ?? []).map((p) => p.user_id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", participantIds);

  const others = (profiles ?? []).filter((p) => p.id !== user.id);
  const otherUsername = others[0]?.username ?? "unknown";

  let jobRoom: { company_name: string; is_verified: boolean } | null = null;
  if (conv.is_group) {
    const { data: jr } = await supabase
      .from("job_rooms")
      .select("company_name, is_verified")
      .eq("conversation_id", params.id)
      .maybeSingle();
    if (jr) jobRoom = jr;
  }

  return (
    <ToastProvider>
      <NotificationWatcher
        currentUserId={user.id}
        currentConversationId={params.id}
      />

      <main className="flex h-screen flex-col">
        {conv.is_group ? (
          <GroupHeader
            conversationId={params.id}
            title={conv.title ?? "Group"}
            memberCount={participantIds.length}
            members={profiles ?? []}
            currentUserId={user.id}
            jobRoom={jobRoom}
          />
        ) : (
          <header className="flex items-center gap-3 border-b border-g1-border px-4 py-3">
            <Link href="/chat" className="text-g1-muted">
              ←
            </Link>
            <div>
              <p className="text-sm font-medium">@{otherUsername}</p>
            </div>
          </header>
        )}

        <MessageThread
          conversationId={params.id}
          currentUserId={user.id}
          showSenderNames={conv.is_group ?? false}
        />
      </main>
    </ToastProvider>
  );
}