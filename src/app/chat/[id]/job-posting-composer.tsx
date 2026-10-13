"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function JobPostingComposer({
  conversationId,
  currentUserId,
  onClose
}: {
  conversationId: string;
  currentUserId: string;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("NGN");
  const [salaryPeriod, setSalaryPeriod] = useState("month");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !company.trim()) {
      setError("Title and company are required");
      return;
    }

    setSending(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);

    const salaryMinNum = salaryMin ? Number(salaryMin) : null;
    const salaryMaxNum = salaryMax ? Number(salaryMax) : null;

    // 1. Insert job_posting row
    const { data: posting, error: postingErr } = await supabase
      .from("job_postings")
      .insert({
        room_id: conversationId,
        posted_by: currentUserId,
        title: title.trim(),
        company: company.trim(),
        location: location.trim() || null,
        employment_type: employmentType,
        salary_min: salaryMinNum,
        salary_max: salaryMaxNum,
        salary_currency: salaryCurrency,
        salary_period: salaryPeriod,
        description: description.trim() || null,
        tags: tags.length ? tags : null
      })
      .select("id")
      .single();

    if (postingErr || !posting) {
      setError(postingErr?.message ?? "Failed to create posting");
      setSending(false);
      return;
    }

    // 2. Insert message with metadata pointing to the posting
    const { error: msgErr } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: null,
      metadata: {
        kind: "job_posting",
        posting_id: posting.id,
        title: title.trim(),
        company: company.trim(),
        location: location.trim() || undefined,
        employment_type: employmentType,
        salary_min: salaryMinNum ?? undefined,
        salary_max: salaryMaxNum ?? undefined,
        salary_currency: salaryCurrency,
        salary_period: salaryPeriod,
        description: description.trim() || undefined,
        tags: tags.length ? tags : undefined
      }
    });

    if (msgErr) {
      setError(msgErr.message);
      setSending(false);
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-g1-border bg-g1-bg p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Post a vacancy</h2>
          <button
            onClick={onClose}
            className="text-g1-muted hover:text-g1-text"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-g1-muted">
              Job title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior Backend Engineer"
              className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-g1-muted">
              Company *
            </label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corp"
              className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-g1-muted">
                Location
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lagos, Nigeria"
                className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-g1-muted">Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm"
              >
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-1">
              <label className="mb-1 block text-xs text-g1-muted">Min</label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="100000"
                className="w-full rounded-lg border border-g1-border bg-g1-surface px-2 py-2 text-sm"
              />
            </div>
            <div className="col-span-1">
              <label className="mb-1 block text-xs text-g1-muted">Max</label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="300000"
                className="w-full rounded-lg border border-g1-border bg-g1-surface px-2 py-2 text-sm"
              />
            </div>
            <div className="col-span-1">
              <label className="mb-1 block text-xs text-g1-muted">Cur</label>
              <input
                value={salaryCurrency}
                onChange={(e) =>
                  setSalaryCurrency(e.target.value.toUpperCase())
                }
                className="w-full rounded-lg border border-g1-border bg-g1-surface px-2 py-2 text-sm"
              />
            </div>
            <div className="col-span-1">
              <label className="mb-1 block text-xs text-g1-muted">Per</label>
              <select
                value={salaryPeriod}
                onChange={(e) => setSalaryPeriod(e.target.value)}
                className="w-full rounded-lg border border-g1-border bg-g1-surface px-2 py-2 text-sm"
              >
                <option value="month">mo</option>
                <option value="year">yr</option>
                <option value="hour">hr</option>
                <option value="day">day</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-g1-muted">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What the role involves, key responsibilities…"
              className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-g1-muted">
              Tags (comma-separated)
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="React, Node, SQL"
              className="w-full rounded-lg border border-g1-border bg-g1-surface px-3 py-2 text-sm outline-none focus:border-g1-accent"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-lg bg-g1-accent py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {sending ? "Posting…" : "Post vacancy"}
          </button>
        </form>
      </div>
    </div>
  );
}