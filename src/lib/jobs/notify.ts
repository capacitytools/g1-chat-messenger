import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function notifyUser(
  toUsername: string,
  content: string | null,
  metadata?: Record<string, any>
) {
  const supabase = serviceClient();

  const { data: from } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", "g1jobs")
    .maybeSingle();

  const { data: to } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", toUsername.toLowerCase())
    .maybeSingle();

  if (!from || !to) return { error: "Bot or user not found" };

  // Find or create 1:1 conversation
  const { data: mine } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", from.id);

  const myConvIds = (mine ?? []).map((r) => r.conversation_id);

  let conversationId: string | null = null;

  if (myConvIds.length) {
    const { data: existing } = await supabase
      .from("conversation_participants")
      .select("conversation_id, conversations!inner(is_group)")
      .eq("user_id", to.id)
      .in("conversation_id", myConvIds);

    const oneToOne = (existing ?? []).find(
      (r: any) => r.conversations?.is_group === false
    );
    if (oneToOne) conversationId = oneToOne.conversation_id;
  }

  if (!conversationId) {
    const { data: newConv } = await supabase
      .from("conversations")
      .insert({ is_group: false, created_by: from.id })
      .select("id")
      .single();

    if (!newConv) return { error: "Failed to create conversation" };

    await supabase.from("conversation_participants").insert([
      { conversation_id: newConv.id, user_id: from.id },
      { conversation_id: newConv.id, user_id: to.id }
    ]);

    conversationId = newConv.id;
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: from.id,
    content,
    metadata: metadata ?? null
  });

  return { error: error?.message ?? null };
}