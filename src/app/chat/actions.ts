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

  // --- DEBUG BLOCK START ---
  const { data: sessionData } = await supabase.auth.getSession();
  const debug = {
    authUserId: user.id,
    hasSession: !!sessionData.session,
    sessionUserId: sessionData.session?.user?.id ?? null,
    sessionRole: sessionData.session?.user?.role ?? null,
    hasToken: !!sessionData.session?.access_token,
    tokenPreview: sessionData.session?.access_token
      ? sessionData.session.access_token.slice(0, 20) + "..."
      : null
  };
  // --- DEBUG BLOCK END ---

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
      error: "CREATE_FAILED",
      debug: {
        ...debug,
        pgMessage: convErr?.message ?? "no message",
        pgCode: (convErr as any)?.code ?? "none",
        pgDetails: (convErr as any)?.details ?? "none",
        pgHint: (convErr as any)?.hint ?? "none"
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
    return {
      error: "PARTICIPANT_FAILED",
      debug: {
        ...debug,
        pgMessage: partErr.message,
        pgCode: (partErr as any)?.code ?? "none"
      }
    };
  }

  return { conversationId: conv.id };
}