"use client";

import { useState } from "react";

export default function BotTestPage() {
  const [secret, setSecret] = useState("");
  const [fromUsername, setFromUsername] = useState("g1market");
  const [toUsername, setToUsername] = useState("tester");
  const [kind, setKind] = useState<"text" | "market" | "wallet">("market");
  const [content, setContent] = useState("Hello from a bot!");

  const [title, setTitle] = useState("Test Item");
  const [price, setPrice] = useState("1000");
  const [currency, setCurrency] = useState("NGN");
  const [imageUrl, setImageUrl] = useState("");
  const [itemUrl, setItemUrl] = useState("https://example.com");

  const [amount, setAmount] = useState("5000");
  const [note, setNote] = useState("Test payment");
  const [action, setAction] = useState<"payment_request" | "payment_sent">(
    "payment_request"
  );

  const [response, setResponse] = useState<string | null>(null);
  const [debugResponse, setDebugResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setResponse(null);

    let metadata: Record<string, any> | undefined = undefined;

    if (kind === "market") {
      metadata = {
        kind: "market",
        item_id: "listing_" + Math.random().toString(36).slice(2, 8),
        title,
        price: Number(price),
        currency,
        image: imageUrl || undefined,
        url: itemUrl || undefined
      };
    } else if (kind === "wallet") {
      metadata = {
        kind: "wallet",
        action,
        amount: Number(amount),
        currency,
        note,
        ref: "txn_" + Math.random().toString(36).slice(2, 8)
      };
    }

    const body = {
      from_username: fromUsername,
      to_username: toUsername,
      content: kind === "text" ? content : undefined,
      metadata
    };

    try {
      const res = await fetch("/api/bots/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-g1-bots-secret": secret
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      setResponse(
        `${res.status} ${res.statusText}\n\n${JSON.stringify(data, null, 2)}`
      );
    } catch (err: any) {
      setResponse(`Fetch error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function debugAuth() {
    setDebugResponse("Loading…");
    try {
      const res = await fetch("/api/bots/debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-g1-bots-secret": secret
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setDebugResponse(
        `${res.status} ${res.statusText}\n\n${JSON.stringify(data, null, 2)}`
      );
    } catch (err: any) {
      setDebugResponse(`Fetch error: ${err.message}`);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-10 text-sm">
      <h1 className="mb-1 text-xl font-bold">G1 Bots Console</h1>
      <p className="mb-6 text-xs text-g1-muted">
        Test and trigger the G1 ecosystem bots from inside the app.
      </p>

      <label className="mb-1 block text-xs text-g1-muted">
        Bot secret (paste from Vercel)
      </label>
      <input
        type="password"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        className="mb-4 w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2"
        placeholder="••••••••"
      />

      <button
        onClick={debugAuth}
        className="mb-6 w-full rounded-lg border border-g1-border bg-g1-surface py-2 text-xs"
      >
        Debug auth (see what server receives)
      </button>

      {debugResponse && (
        <pre className="mb-6 overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-g1-border bg-g1-surface p-3 text-[10px]">
          {debugResponse}
        </pre>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-g1-muted">From</label>
          <select
            value={fromUsername}
            onChange={(e) => setFromUsername(e.target.value)}
            className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2"
          >
            <option value="g1market">g1market</option>
            <option value="g1wallet">g1wallet</option>
            <option value="g1jobs">g1jobs</option>
            <option value="g1tribes">g1tribes</option>
            <option value="g1learn">g1learn</option>
            <option value="g1business">g1business</option>
            <option value="g1services">g1services</option>
            <option value="g1ai">g1ai</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-g1-muted">To</label>
          <input
            value={toUsername}
            onChange={(e) => setToUsername(e.target.value)}
            className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2"
          />
        </div>
      </div>

      <label className="mb-1 block text-xs text-g1-muted">Card type</label>
      <div className="mb-4 flex gap-2">
        {(["text", "market", "wallet"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs ${
              kind === k
                ? "border-g1-accent bg-g1-accent/10"
                : "border-g1-border bg-g1-surface"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {kind === "text" && (
        <>
          <label className="mb-1 block text-xs text-g1-muted">Message</label>
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mb-4 w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2"
          />
        </>
      )}

      {kind === "market" && (
        <>
          <label className="mb-1 block text-xs text-g1-muted">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-3 w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2"
          />
          <div className="mb-3 grid grid-cols-2 gap-2">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price"
              className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2"
            />
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              placeholder="Currency"
              className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2"
            />
          </div>
          <label className="mb-1 block text-xs text-g1-muted">
            Image URL (optional)
          </label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://res.cloudinary.com/…"
            className="mb-3 w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2"
          />
          <label className="mb-1 block text-xs text-g1-muted">
            Item URL (optional)
          </label>
          <input
            value={itemUrl}
            onChange={(e) => setItemUrl(e.target.value)}
            className="mb-4 w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2"
          />
        </>
      )}

      {kind === "wallet" && (
        <>
          <label className="mb-1 block text-xs text-g1-muted">Action</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as any)}
            className="mb-3 w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2"
          >
            <option value="payment_request">Request payment</option>
            <option value="payment_sent">Confirm sent</option>
          </select>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2"
            />
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              placeholder="Currency"
              className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2"
            />
          </div>
          <label className="mb-1 block text-xs text-g1-muted">Note</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mb-4 w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2"
          />
        </>
      )}

      <button
        onClick={send}
        disabled={loading || !secret}
        className="w-full rounded-lg bg-g1-accent py-2 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Sending…" : "Send bot message"}
      </button>

      {response && (
        <pre className="mt-6 overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-g1-border bg-g1-surface p-3 text-[10px]">
          {response}
        </pre>
      )}
    </main>
  );
}