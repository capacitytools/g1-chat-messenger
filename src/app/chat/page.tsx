import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./sign-out-button";

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
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">G1-Chat</h1>
          <p className="text-xs text-g1-muted">
            Signed in as{" "}
            <span className="text-g1-accent">
              @{profile?.username ?? "user"}
            </span>
          </p>
        </div>
        <SignOutButton />
      </header>

      <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-g1-border">
        <p className="text-sm text-g1-muted">
          Your conversations will appear here.
        </p>
      </div>
    </main>
  );
}