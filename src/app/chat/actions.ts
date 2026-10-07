"use server";

import { createClient } from "@/lib/supabase/server";

export async function findOrCreateConversation(otherUsername: string) {
  const supabase = createClient();

  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();

  // Debug: return what the server sees
  if (!user) {
    return {
      error: "Not signed in (debug)",
      debug: { userErr: userErr?.message ?? null }
    };
  }

  const clean = otherUsername.trim().toLowerCase().replace(/^@/, "");

  const { data: other, error: otherErr } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", clean)
    .maybeSingle();

  if (otherErr) {
    return { error: `Profile lookup failed: ${otherErr.message}` };
  }
  if (!other) return { error: "User not found" };
  if (other.id === user.id) return { error: "That's you" };

  // Direct create, no reuse logic for now
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .insert({
      is_group: false,
      created_by: user.id
    })
    .select("id")
    .single();

  if (convErr || !conv) {
    return {
      error: `Create failed: ${convErr?.message ?? "unknown"}`,
      debug: {
        attemptedCreatedBy: user.id,
        code: (convErr as any)?.code,
        details: (convErr as any)?.details,
        hint: (convErr as any)?.hint
      }
    };
  }

  const { error: partErr } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: other.id }
    ]);

  if (partErr) {
    return { error: `Participant insert failed: ${partErr.message}` };
  }

  return { conversationId: conv.id };
}