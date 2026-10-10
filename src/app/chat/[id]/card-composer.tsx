"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CardKind = "wallet" | "market" | null;

export default function CardComposer({
  conversationId,
  currentUserId,
  onClose
}: {
  conversationId: string;
  currentUserId: string;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [kind, setKind] = useState<CardKind>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wallet form
  const [wAction, setWAction] = useState<"payment_request" | "payment_sent">(
    "payment_request"
  );
  const [wAmount, setWAmount] = useState("");
  const [wCurrency, setWCurrency] = useState("NGN");
  const [wNote, setWNote] = useState("");

  // Market form
  const [mTitle, setMTitle] = useState("");
  const [mPrice, setMPrice] = useState("");
  const [mCurrency, setMCurrency] = useState("NGN");
  const [mImage, setMImage] = useState("");
  const [mUrl, setMUrl] = useState("");

  async function send(metadata: Record<string, any>) {
    setSending(true);
    setError(null);

    const { error: insertErr } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: null,
      metadata
    });

    if (insertErr) {
      setError(insertErr.message);
      setSending(false);
      return;
    }

    onClose();
  }

  async function sendWallet() {
    const amount = Number(wAmount);
    if (!amount || amount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    await send({
      kind: "wallet",
      action: wAction,
      amount,
      currency: wCurrency,
      note: wNote || undefined,
      ref: "txn_" + Math.random().toString(36).slice(2, 10)
    });
  }

  async function sendMarket() {
    const price = Number(mPrice);
    if (!mTitle.trim() || !price) {
      setError("Title and price are required");
      return;
    }
    await send({
      kind: "market",
      item_id: "listing_" + Math.random().toString(36).slice(2, 10),
      title: mTitle,
      price,
      currency: mCurrency,
      image: mImage || undefined,
      url: mUrl || undefined
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl border border-g1-border bg-g1-bg p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {kind === null && "Send G1 Card"}
            {kind === "wallet" && "G1 Wallet card"}
            {kind === "market" && "G1 Market card"}
          </h2>
          <button
            onClick={onClose}
            className="text-g1-muted hover:text-g1-text"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {kind === null && (
          <div className="space-y-2">
            <button
              onClick={() => setKind("wallet")}
              className="flex w-full items-center gap-3 rounded-xl border border-g1-border bg-g1-surface px-4 py-3 text-left"
            >
              <span className="text-2xl">💳</span>
              <div>
                <p className="text-sm font-medium">Wallet</p>
                <p className="text-xs text-g1-muted">
                  Payment request, send confirmation, or receipt
                </p>
              </div>
            </button>

            <button
              onClick={() => setKind("market")}
              className="flex w-full items-center gap-3 rounded-xl border border-g1-border bg-g1-surface px-4 py-3 text-left"
            >
              <span className="text-2xl">🛍️</span>
              <div>
                <p className="text-sm font-medium">Market</p>
                <p className="text-xs text-g1-muted">
                  Share a product listing with price and image
                </p>
              </div>
            </button>

            <p className="pt-2 text-center text-[10px] text-g1-muted">
              More G1 cards coming: Business · Tribes · Jobs · Learn · Services
            </p>
          </div>
        )}

        {kind === "wallet" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-g1-muted">Action</label>
              <select
                value={wAction}
                onChange={(e) => setWAction(e.target.value as any)}
                className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm"
              >
                <option value="payment_request">Request payment</option>
                <option value="payment_sent">Confirm payment sent</option>
              </select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-g1-muted">
                  Amount
                </label>
                <input
                  type="number"
                  value={wAmount}
                  onChange={(e) => setWAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
                />
              </div>
              <div className="w-24">
                <label className="mb-1 block text-xs text-g1-muted">
                  Currency
                </label>
                <input
                  value={wCurrency}
                  onChange={(e) => setWCurrency(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-g1-muted">
                Note (optional)
              </label>
              <input
                value={wNote}
                onChange={(e) => setWNote(e.target.value)}
                placeholder="Lunch yesterday"
                className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              onClick={sendWallet}
              disabled={sending}
              className="w-full rounded-lg bg-g1-accent py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send card"}
            </button>
          </div>
        )}

        {kind === "market" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-g1-muted">Title</label>
              <input
                value={mTitle}
                onChange={(e) => setMTitle(e.target.value)}
                placeholder="iPhone 15 Pro"
                className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-g1-muted">Price</label>
                <input
                  type="number"
                  value={mPrice}
                  onChange={(e) => setMPrice(e.target.value)}
                  placeholder="950000"
                  className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
                />
              </div>
              <div className="w-24">
                <label className="mb-1 block text-xs text-g1-muted">
                  Currency
                </label>
                <input
                  value={mCurrency}
                  onChange={(e) => setMCurrency(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-g1-muted">
                Image URL (optional)
              </label>
              <input
                value={mImage}
                onChange={(e) => setMImage(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-g1-muted">
                Link URL (optional)
              </label>
              <input
                value={mUrl}
                onChange={(e) => setMUrl(e.target.value)}
                placeholder="https://g1-market…"
                className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              onClick={sendMarket}
              disabled={sending}
              className="w-full rounded-lg bg-g1-accent py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send card"}
            </button>
          </div>
        )}

        {kind !== null && (
          <button
            onClick={() => setKind(null)}
            disabled={sending}
            className="mt-3 w-full rounded-lg border border-g1-border py-2 text-xs text-g1-muted"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}