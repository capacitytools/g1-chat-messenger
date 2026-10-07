"use server";

import { createClient } from "@/lib/supabase/server";

export async function findOrCreateConversation(otherUsername: string) {
  const supabase = createClient();

  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();

  if (userErr) {
    return { error: `getUser error: ${userErr.message}` };
  }
  if (!user) {
    return { error: "Not signed in (getUser returned null)" };
  }

  const clean = otherUsername.trim().toLowerCase().replace(/^@/, "");

  const { data: other, error: otherErr } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", clean)
    .maybeSingle();

  if (otherErr) {
    return { error: `Profile lookup: ${otherErr.message}` };
  }
  if (!other) return { error: `User @${clean} not found` };
  if (other.id === user.id) return { error: "That's you" };

  // Try insert and return full error object
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
      error: `CREATE FAILED: ${convErr?.message ?? "no message"} | code=${
        (convErr as any)?.code ?? "none"
      } | details=${
        (convErr as any)?.details ?? "none"
      } | hint=${(convErr as any)?.hint ?? "none"} | authUser=${
        user.id
      }`
    };
  }

  const { error: partErr } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: other.id }
    ]);

  if (partErr) {
    return {
      error: `PARTICIPANT FAILED: ${partErr.message} | code=${
        (partErr as any)?.code ?? "none"
      }`
    };
  }

  return { conversationId: conv.id };
}
