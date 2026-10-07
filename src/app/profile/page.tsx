import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AvatarUploader from "./avatar-uploader";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex min-h-screen flex-col px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-bold">Profile</h1>
        <Link
          href="/chat"
          className="rounded-lg border border-g1-border bg-g1-surface px-3 py-1.5 text-xs text-g1-muted"
        >
          Back to chat
        </Link>
      </header>

      <div className="mx-auto w-full max-w-sm rounded-2xl border border-g1-border bg-g1-surface p-6">
        <AvatarUploader initialUrl={profile?.avatar_url ?? null} />

        <div className="mt-6 space-y-1 text-center">
          <p className="text-sm font-medium">@{profile?.username}</p>
          <p className="text-xs text-g1-muted">{user.email}</p>
        </div>
      </div>
    </main>
  );
}