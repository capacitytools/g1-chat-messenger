"use client";

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

type GenericMeta = {
  kind: string;
  [key: string]: any;
};

type Meta = WalletMeta | MarketMeta | GenericMeta;

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