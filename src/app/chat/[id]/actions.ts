"use server";

import { createClient } from "@/lib/supabase/server";

export async function convertToJobRoom(
  conversationId: string,
  companyName: string,
  description?: string,
  location?: string,
  industry?: string
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();

  if (userErr) return { error: `getUser: ${userErr.message}` };
  if (!user) return { error: "Not signed in" };

  if (!companyName.trim()) return { error: "Company name required" };

  // Verify user is a participant of the conversation
  const { data: isPart } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!isPart) return { error: "You're not in this conversation" };

  // Verify the conversation is a group
  const { data: conv } = await supabase
    .from("conversations")
    .select("is_group")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conv?.is_group) {
    return { error: "Only groups can become job rooms" };
  }

  // Check if already a job room
  const { data: existing } = await supabase
    .from("job_rooms")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (existing) {
    return { error: "This group is already a job room" };
  }

  const { error: insertErr } = await supabase.from("job_rooms").insert({
    conversation_id: conversationId,
    company_name: companyName.trim(),
    description: description?.trim() || null,
    location: location?.trim() || null,
    industry: industry?.trim() || null,
    created_by: user.id
  });

  if (insertErr) return { error: insertErr.message };

  return { ok: true };
}