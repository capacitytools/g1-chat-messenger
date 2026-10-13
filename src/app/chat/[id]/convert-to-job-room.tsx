"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { convertToJobRoom } from "./actions";

export default function ConvertToJobRoom({
  conversationId,
  onClose
}: {
  conversationId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!companyName.trim()) {
      setError("Company name required");
      return;
    }

    setSending(true);
    const res = await convertToJobRoom(
      conversationId,
      companyName,
      description,
      location,
      industry
    );

    setSending(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-g1-border bg-g1-bg p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Turn into a job room</h2>
          <button
            onClick={onClose}
            className="text-g1-muted hover:text-g1-text"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-xs text-g1-muted">
          Job rooms let members post vacancies and receive applications.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-g1-muted">
              Company name *
            </label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corp"
              className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-g1-muted">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Akure, Nigeria"
              className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-g1-muted">Industry</label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Technology"
              className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-g1-muted">
              Short description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What this company does…"
              className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-lg bg-g1-accent py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {sending ? "Converting…" : "Convert to job room"}
          </button>
        </form>
      </div>
    </div>
  );
}