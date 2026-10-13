"use client";

import Link from "next/link";

type WalletMeta = {
  kind: "wallet";
  action: "payment_request" | "payment_sent" | "receipt";
  amount: number;
  currency: string;
  note?: string;
  ref?: string;
};

type MarketMeta = {
  kind: "market";
  item_id: string;
  title: string;
  price: number;
  currency: string;
  image?: string;
  url?: string;
};

type JobPostingMeta = {
  kind: "job_posting";
  posting_id: string;
  title: string;
  company: string;
  location?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string;
  description?: string;
  tags?: string[];
};

type GenericMeta = {
  kind: string;
  [key: string]: any;
};

type Meta = WalletMeta | MarketMeta | JobPostingMeta | GenericMeta;

export default function G1Card({
  metadata,
  mine
}: {
  metadata: Meta;
  mine: boolean;
}) {
  if (metadata.kind === "wallet")
    return <WalletCard meta={metadata as WalletMeta} mine={mine} />;
  if (metadata.kind === "market")
    return <MarketCard meta={metadata as MarketMeta} mine={mine} />;
  if (metadata.kind === "job_posting")
    return <JobPostingCard meta={metadata as JobPostingMeta} mine={mine} />;

  return (
    <div className="w-64 rounded-2xl border border-g1-border bg-g1-surface p-4">
      <p className="text-xs uppercase tracking-wide text-g1-muted">
        G1 · {metadata.kind}
      </p>
      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all text-[10px] text-g1-muted">
        {JSON.stringify(metadata, null, 2)}
      </pre>
    </div>
  );
}

/* -------- Wallet -------- */

function WalletCard({ meta, mine }: { meta: WalletMeta; mine: boolean }) {
  const title =
    meta.action === "payment_request"
      ? "Payment request"
      : meta.action === "payment_sent"
        ? "Payment sent"
        : "Receipt";

  const accent =
    meta.action === "payment_request"
      ? "border-amber-500/40"
      : "border-green-500/40";

  return (
    <div
      className={`w-64 rounded-2xl border bg-g1-surface p-4 ${
        mine ? accent : "border-g1-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-g1-muted">
          G1 Wallet
        </p>
        <span className="text-[10px] text-g1-muted">{title}</span>
      </div>

      <p className="mt-3 text-2xl font-bold">
        {meta.currency} {meta.amount.toLocaleString()}
      </p>

      {meta.note && <p className="mt-1 text-xs text-g1-muted">{meta.note}</p>}
      {meta.ref && (
        <p className="mt-2 text-[10px] text-g1-muted">Ref: {meta.ref}</p>
      )}

      {meta.action === "payment_request" && !mine && (
        <button className="mt-3 w-full rounded-lg bg-g1-accent px-3 py-2 text-sm font-medium text-white">
          Pay now
        </button>
      )}
      {meta.action === "payment_request" && mine && (
        <p className="mt-3 text-center text-[10px] text-g1-muted">
          Awaiting payment
        </p>
      )}
      {(meta.action === "payment_sent" || meta.action === "receipt") && (
        <p className="mt-3 text-center text-[10px] text-green-400">
          ✓ Completed
        </p>
      )}
    </div>
  );
}

/* -------- Market -------- */

function MarketCard({ meta, mine }: { meta: MarketMeta; mine: boolean }) {
  return (
    <a
      href={meta.url ?? "#"}
      target="_blank"
      rel="noreferrer"
      className={`block w-64 overflow-hidden rounded-2xl border bg-g1-surface ${
        mine ? "border-g1-accent/40" : "border-g1-border"
      }`}
    >
      {meta.image && (
        <img
          src={meta.image}
          alt={meta.title}
          className="h-40 w-full object-cover"
        />
      )}

      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-g1-muted">
          G1 Market
        </p>
        <p className="mt-1 text-sm font-medium">{meta.title}</p>
        <p className="mt-2 text-lg font-bold">
          {meta.currency} {meta.price.toLocaleString()}
        </p>

        <span className="mt-3 block rounded-lg bg-g1-accent px-3 py-2 text-center text-sm font-medium text-white">
          View item
        </span>
      </div>
    </a>
  );
}

/* -------- Job Posting -------- */

function JobPostingCard({
  meta,
  mine
}: {
  meta: JobPostingMeta;
  mine: boolean;
}) {
  const salaryLabel = formatSalary(meta);
  const typeLabel = formatEmploymentType(meta.employment_type);

  return (
    <div
      className={`w-72 overflow-hidden rounded-2xl border bg-g1-surface ${
        mine ? "border-g1-accent/40" : "border-g1-border"
      }`}
    >
      <div className="border-b border-g1-border bg-gradient-to-br from-g1-accent/10 to-transparent px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider text-g1-accent">
          G1 Jobs · Vacancy
        </p>
        <p className="mt-1 text-base font-semibold leading-tight">
          {meta.title}
        </p>
        <p className="mt-1 text-xs text-g1-muted">
          {meta.company}
          {meta.location ? ` · ${meta.location}` : ""}
        </p>
      </div>

      <div className="space-y-2 px-4 py-3">
        {typeLabel && (
          <span className="inline-block rounded-full bg-g1-bg px-2 py-0.5 text-[10px] text-g1-muted">
            {typeLabel}
          </span>
        )}

        {salaryLabel && (
          <p className="text-sm font-medium text-green-400">{salaryLabel}</p>
        )}

        {meta.description && (
          <p className="line-clamp-3 text-xs leading-relaxed text-g1-muted">
            {meta.description}
          </p>
        )}

        {meta.tags && meta.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {meta.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-full border border-g1-border px-2 py-0.5 text-[10px] text-g1-muted"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <Link
        href={`/jobs/${meta.posting_id}`}
        className="block border-t border-g1-border px-4 py-2.5 text-center text-sm font-medium text-g1-accent"
      >
        View & apply →
      </Link>
    </div>
  );
}

function formatEmploymentType(t?: string): string | null {
  if (!t) return null;
  const map: Record<string, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    contract: "Contract",
    internship: "Internship",
    remote: "Remote"
  };
  return map[t] ?? t;
}

function formatSalary(meta: JobPostingMeta): string | null {
  const cur = meta.salary_currency ?? "NGN";
  const period = meta.salary_period
    ? ` / ${meta.salary_period}`
    : "";

  if (meta.salary_min && meta.salary_max) {
    return `${cur} ${meta.salary_min.toLocaleString()} – ${meta.salary_max.toLocaleString()}${period}`;
  }
  if (meta.salary_min) return `From ${cur} ${meta.salary_min.toLocaleString()}${period}`;
  if (meta.salary_max) return `Up to ${cur} ${meta.salary_max.toLocaleString()}${period}`;
  return null;
}