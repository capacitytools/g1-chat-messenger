import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./sign-out-button";
import NewChat from "./new-chat";
import ConversationList from "./conversation-list";

export default async function ChatPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex min-h-screen flex-col px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">G1-Chat</h1>
          <p className="text-xs text-g1-muted">
            @{profile?.username ?? "user"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/profile"
            className="rounded-lg border border-g1-border bg-g1-surface px-3 py-1.5 text-xs text-g1-muted"
          >
            Profile
          </Link>
          <SignOutButton />
        </div>
      </header>

      <NewChat />

      <ConversationList currentUserId={user.id} />
    </main>
  );
}