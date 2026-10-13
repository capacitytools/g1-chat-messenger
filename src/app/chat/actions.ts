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
    return { error: `RPC failed: ${rpcErr?.message ?? "no result"}` };
  }

  return { conversationId: convId as string };
}

export async function createGroupConversation(
  title: string,
  usernames: string[]
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();

  if (userErr) return { error: `getUser error: ${userErr.message}` };
  if (!user) return { error: "Not signed in" };

  const cleanTitle = title.trim();
  if (!cleanTitle) return { error: "Group name is required" };

  const cleaned = usernames
    .map((u) => u.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);

  if (cleaned.length < 1) {
    return { error: "Add at least one other member" };
  }

  // Look up all profiles
  const { data: profiles, error: lookupErr } = await supabase
    .from("profiles")
    .select("id, username")
    .in("username", cleaned);

  if (lookupErr) return { error: `Lookup failed: ${lookupErr.message}` };

  const found = profiles ?? [];
  const notFound = cleaned.filter(
    (u) => !found.some((p) => p.username === u)
  );

  if (notFound.length) {
    return { error: `Not found: @${notFound.join(", @")}` };
  }

  // Exclude self if user included their own username
  const otherIds = found
    .filter((p) => p.id !== user.id)
    .map((p) => p.id);

  if (otherIds.length === 0) {
    return { error: "Add at least one other member besides yourself" };
  }

  const { data: convId, error: rpcErr } = await supabase.rpc(
    "create_group_conversation",
    {
      group_title: cleanTitle,
      member_ids: [user.id, ...otherIds]
    }
  );

  if (rpcErr || !convId) {
    return { error: `RPC failed: ${rpcErr?.message ?? "no result"}` };
  }

  return { conversationId: convId as string };
}