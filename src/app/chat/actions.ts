"use server";

import { createClient } from "@/lib/supabase/server";

export async function findOrCreateConversation(otherUsername: string) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const clean = otherUsername.trim().toLowerCase().replace(/^@/, "");

  const { data: other } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", clean)
    .maybeSingle();

  if (!other) return { error: "User not found" };
  if (other.id === user.id) return { error: "That's you" };

  // Look for an existing 1:1 conversation
  const { data: mine } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  const myConvIds = (mine ?? []).map((r) => r.conversation_id);

  if (myConvIds.length) {
    const { data: existing } = await supabase
      .from("conversation_participants")
      .select("conversation_id, conversations!inner(is_group)")
      .eq("user_id", other.id)
      .in("conversation_id", myConvIds);

    const oneToOne = (existing ?? []).find(
      (r: any) => r.conversations?.is_group === false
    );

    if (oneToOne) {
      return { conversationId: oneToOne.conversation_id };
    }
  }

  // Create new
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .insert({ is_group: false, created_by: user.id })
    .select("id")
    .single();

  if (convErr || !conv) return { error: convErr?.message ?? "Failed" };

  await supabase.from("conversation_participants").insert([
    { conversation_id: conv.id, user_id: user.id },
    { conversation_id: conv.id, user_id: other.id }
  ]);

  return { conversationId: conv.id };
}