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

  // Ask the database what auth.uid() returns for THIS request
  const { data: dbSaysUserIs, error: rpcErr } = await supabase.rpc("who_am_i");

  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .insert({ is_group: false, created_by: user.id })
    .select("id")
    .single();

  if (convErr || !conv) {
    return {
      error: "CREATE_FAILED",
      debug: {
        authUserIdFromJWT: user.id,
        dbSaysUserIs: dbSaysUserIs ?? null,
        rpcError: rpcErr?.message ?? null,
        match: dbSaysUserIs === user.id,
        pgMessage: convErr?.message ?? "unknown",
        pgCode: (convErr as any)?.code ?? "none"
      }
    };
  }

  const { error: selfErr } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: conv.id, user_id: user.id });

  if (selfErr) {
    return {
      error: `SELF PARTICIPANT FAILED: ${selfErr.message} | code=${
        (selfErr as any)?.code ?? "none"
      }`
    };
  }

  const { error: otherPartErr } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: conv.id, user_id: other.id });

  if (otherPartErr) {
    return {
      error: `OTHER PARTICIPANT FAILED: ${otherPartErr.message} | code=${
        (otherPartErr as any)?.code ?? "none"
      }`
    };
  }

  return { conversationId: conv.id };
}