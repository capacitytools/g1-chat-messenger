"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import G1Card from "./g1-card";
import CardComposer from "./card-composer";

type Message = {
  id: string;
  sender_id: string;
  content: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
};

type PendingUpload = { filename: string };

function pickCloudinaryEndpoint(file: File): {
  endpoint: string;
  attachmentType: "image" | "video" | "file";
} {
  if (file.type.startsWith("image/")) {
    return { endpoint: "image", attachmentType: "image" };
  }
  if (file.type.startsWith("video/")) {
    return { endpoint: "video", attachmentType: "video" };
  }
  return { endpoint: "raw", attachmentType: "file" };
}

export default function MessageThread({
  conversationId,
  currentUserId
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<PendingUpload | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCardComposer, setShowCardComposer] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("messages")
        .select(
          "id, sender_id, content, attachment_url, attachment_type, metadata, created_at"
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (active && data) setMessages(data as Message[]);
    }

    load();

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages((prev) => {
            const next = payload.new as Message;
            if (prev.some((m) => m.id === next.id)) return prev;
            return [...prev, next];
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSendText(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    const body = text.trim();
    setText("");

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: body
    });

    if (error) {
      setText(body);
      alert(error.message);
    }
    setSending(false);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) fileInputRef.current.value = "";

    setUploadError(null);
    setPending({ filename: file.name });

    try {
      const signRes = await fetch("/api/upload/sign", { method: "POST" });
      if (!signRes.ok) throw new Error("Could not get upload signature");
      const { timestamp, folder, signature, apiKey, cloudName } =
        await signRes.json();

      const { endpoint, attachmentType } = pickCloudinaryEndpoint(file);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("folder", folder);
      formData.append("signature", signature);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${endpoint}/upload`,
        { method: "POST", body: formData }
      );

      const data = await uploadRes.json();
      if (!uploadRes.ok || data.error) {
        throw new Error(data?.error?.message ?? "Upload failed");
      }

      const secureUrl: string = data.secure_url;

      const { error: insertErr } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: null,
        attachment_url: secureUrl,
        attachment_type: attachmentType
      });

      if (insertErr) throw insertErr;
    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-center text-xs text-g1-muted">
            No messages yet. Say hi.
          </p>
        )}

        <ul className="space-y-2">
          {messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            const isCard = !!m.metadata?.kind;

            return (
              <li
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] overflow-hidden rounded-2xl ${
                    isCard
                      ? "bg-transparent"
                      : mine
                        ? "bg-g1-accent text-white"
                        : "bg-g1-surface"
                  }`}
                >
                  {isCard ? (
                    <G1Card metadata={m.metadata as any} mine={mine} />
                  ) : (
                    <>
                      {m.attachment_url && m.attachment_type === "image" && (
                        <a
                          href={m.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={m.attachment_url}
                            alt="attachment"
                            className="block max-h-72 w-full object-cover"
                          />
                        </a>
                      )}

                      {m.attachment_url && m.attachment_type === "video" && (
                        <video
                          src={m.attachment_url}
                          controls
                          className="block max-h-72 w-full"
                        />
                      )}

                      {m.attachment_url && m.attachment_type === "file" && (
                        <a
                          href={m.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block px-4 py-3 text-sm underline"
                        >
                          📎 Download file
                        </a>
                      )}

                      {m.content && (
                        <p className="px-4 py-2 text-sm break-words">
                          {m.content}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <div ref={bottomRef} />
      </div>

      {pending && (
        <div className="border-t border-g1-border px-4 py-2 text-xs text-g1-muted">
          Uploading {pending.filename}…
        </div>
      )}

      {uploadError && (
        <div className="border-t border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-400">
          {uploadError}
        </div>
      )}

      <form
        onSubmit={handleSendText}
        className="flex items-center gap-2 border-t border-g1-border px-4 py-3"
      >
        <button
          type="button"
          onClick={() => setShowCardComposer(true)}
          className="rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm"
          aria-label="Send G1 card"
        >
          ✨
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!!pending}
          className="rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm disabled:opacity-50"
          aria-label="Attach"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFile}
          accept="image/*,video/*,application/pdf,.doc,.docx,.txt,.zip"
          className="hidden"
        />

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message"
          className="flex-1 rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-lg bg-g1-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>

      {showCardComposer && (
        <CardComposer
          conversationId={conversationId}
          currentUserId={currentUserId}
          onClose={() => setShowCardComposer(false)}
        />
      )}
    </>
  );
}