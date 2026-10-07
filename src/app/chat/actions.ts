"use server";

import { createClient } from "@/lib/supabase/server";

export async function findOrCreateConversation(otherUsername: string) {
  const supabase = createClient();

  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();

  if (userErr) return { error: `getUser error: ${userErr.message}` };
  if (!user) return { error: "Not signed in" };

  const clean = otherUsername.trim().toLowerCase().replace(/^@/, "");

  const { data: other, error: otherErr } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", clean)
    .maybeSingle();

  if (otherErr) return { error: `Profile lookup: ${otherErr.message}` };
  if (!other) return { error: `User @${clean} not found` };
  if (other.id === user.id) return { error: "That's you" };

  const { data: convId, error: rpcErr } = await supabase.rpc(
    "create_conversation_with",
    { other_user: other.id }
  );

  if (rpcErr || !convId) {
    return {
      error: `RPC failed: ${rpcErr?.message ?? "no result"}`,
      debug: {
        code: (rpcErr as any)?.code ?? "none",
        hint: (rpcErr as any)?.hint ?? "none",
        details: (rpcErr as any)?.details ?? "none"
      }
    };
  }

  return { conversationId: convId as string };
}