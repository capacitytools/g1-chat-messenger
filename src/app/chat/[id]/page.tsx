import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MessageThread from "./message-thread";

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
    .select("id")
    .eq("id", params.id)
    .maybeSingle();

  if (!conv) notFound();

  const { data: others } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", params.id)
    .neq("user_id", user.id);

  let otherUsername = "unknown";
  if (others && others.length) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", others[0].user_id)
      .maybeSingle();
    if (profile?.username) otherUsername = profile.username;
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-g1-border px-4 py-3">
        <Link href="/chat" className="text-g1-muted">
          ←
        </Link>
        <div>
          <p className="text-sm font-medium">@{otherUsername}</p>
        </div>
      </header>

      <MessageThread
        conversationId={params.id}
        currentUserId={user.id}
      />
    </main>
  );
}