import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

type BotPayload = {
  conversation_id?: string;
  from_username?: string;
  to_username?: string;
  content?: string;
  metadata?: Record<string, any>;
  attachment_url?: string;
  attachment_type?: "image" | "video" | "file";
};

export async function POST(req: Request) {
  const secret = req.headers.get("x-g1-bots-secret");
  if (!secret || secret !== process.env.G1_BOTS_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: BotPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.content && !body.metadata && !body.attachment_url) {
    return NextResponse.json(
      { error: "Nothing to send (content, metadata, or attachment required)" },
      { status: 400 }
    );
  }

  const supabase = serviceClient();

  let conversationId = body.conversation_id;
  let senderId: string | null = null;

  // Resolve sender
  if (body.from_username) {
    const { data: fromProfile } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("username", body.from_username.replace(/^@/, "").toLowerCase())
      .maybeSingle();

    if (!fromProfile) {
      return NextResponse.json(
        { error: `Sender @${body.from_username} not found` },
        { status: 404 }
      );
    }
    senderId = fromProfile.id;
  }

  // Resolve conversation
  if (!conversationId) {
    if (!body.from_username || !body.to_username) {
      return NextResponse.json(
        {
          error:
            "Provide conversation_id, OR from_username + to_username to find/create a 1:1"
        },
        { status: 400 }
      );
    }

    const to = body.to_username.replace(/^@/, "").toLowerCase();
    const { data: toProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", to)
      .maybeSingle();

    if (!toProfile) {
      return NextResponse.json(
        { error: `Recipient @${to} not found` },
        { status: 404 }
      );
    }

    if (!senderId) {
      return NextResponse.json(
        { error: "Could not resolve sender" },
        { status: 400 }
      );
    }

    // Look for existing 1:1
    const { data: mine } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", senderId);

    const myConvIds = (mine ?? []).map((r) => r.conversation_id);

    if (myConvIds.length) {
      const { data: existing } = await supabase
        .from("conversation_participants")
        .select("conversation_id, conversations!inner(is_group)")
        .eq("user_id", toProfile.id)
        .in("conversation_id", myConvIds);

      const oneToOne = (existing ?? []).find(
        (r: any) => r.conversations?.is_group === false
      );

      if (oneToOne) {
        conversationId = oneToOne.conversation_id;
      }
    }

    if (!conversationId) {
      const { data: newConv, error: convErr } = await supabase
        .from("conversations")
        .insert({ is_group: false, created_by: senderId })
        .select("id")
        .single();

      if (convErr || !newConv) {
        return NextResponse.json(
          { error: convErr?.message ?? "Failed to create conversation" },
          { status: 500 }
        );
      }

      const { error: partErr } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: newConv.id, user_id: senderId },
          { conversation_id: newConv.id, user_id: toProfile.id }
        ]);

      if (partErr) {
        return NextResponse.json({ error: partErr.message }, { status: 500 });
      }

      conversationId = newConv.id;
    }
  } else {
    if (!senderId) {
      return NextResponse.json(
        {
          error:
            "from_username is required when using conversation_id (to identify the sender)"
        },
        { status: 400 }
      );
    }
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: body.content ?? null,
      metadata: body.metadata ?? null,
      attachment_url: body.attachment_url ?? null,
      attachment_type: body.attachment_type ?? null
    })
    .select("id")
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message_id: inserted.id,
    conversation_id: conversationId
  });
}