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
  currentUserId,
  showSenderNames = false
}: {
  conversationId: string;
  currentUserId: string;
  showSenderNames?: boolean;
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [senders, setSenders] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<PendingUpload | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCardComposer, setShowCardComposer] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function markRead() {
    const now = new Date().toISOString();
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: now })
      .eq("conversation_id", conversationId)
      .eq("user_id", currentUserId);
  }

  async function loadSenders(ids: string[]) {
    const unique = Array.from(new Set(ids));
    if (!unique.length) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", unique);
    const map: Record<string, string> = {};
    (data ?? []).forEach((p) => (map[p.id] = p.username));
    setSenders((prev) => ({ ...prev, ...map }));
  }

  useEffect(() => {
    markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, currentUserId]);

  useEffect(() => {
    let active = true;
    let channel: any = null;

    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        await new Promise((r) => setTimeout(r, 500));
        const retry = await supabase.auth.getSession();
        if (!retry.data.session) {
          if (active) {
            setLoadError("Not signed in");
            setLoading(false);
          }
          return;
        }
      }

      const { data, error } = await supabase
        .from("messages")
        .select(
          "id, sender_id, content, attachment_url, attachment_type, metadata, created_at"
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        if (active) {
          setLoadError(error.message);
          setLoading(false);
        }
        return;
      }

      const loaded = (data ?? []) as Message[];
      if (active) {
        setMessages(loaded);
        setLoading(false);
        loadSenders(loaded.map((m) => m.sender_id));
        markRead();
      }

      channel = supabase
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
            const next = payload.new as Message;
            setMessages((prev) => {
              if (prev.some((m) => m.id === next.id)) return prev;
              return [...prev, next];
            });
            loadSenders([next.sender_id]);
            if (next.sender_id !== currentUserId) markRead();
          }
        )
        .subscribe();
    }

    init();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        {loading && (
          <p className="text-center text-xs text-g1-muted">Loading…</p>
        )}
        {loadError && (
          <p className="text-center text-xs text-red-400">
            Could not load messages: {loadError}
          </p>
        )}
        {!loading && !loadError && messages.length === 0 && (
          <p className="text-center text-xs text-g1-muted">
            No messages yet. Say hi.
          </p>
        )}

        <ul className="space-y-3">
          {messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            const isCard = !!m.metadata?.kind;

            return (
              <li
                key={m.id}
                className={`flex flex-col ${
                  mine ? "items-end" : "items-start"
                }`}
              >
                {showSenderNames && !mine && (
                  <p className="mb-0.5 px-1 text-[10px] text-g1-muted">
                    @{senders[m.sender_id] ?? "unknown"}
                  </p>
                )}

                <div