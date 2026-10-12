"use client";

import { useUnreadTotal } from "./use-unread-total";

export default function UnreadHeader({
  currentUserId,
  username
}: {
  currentUserId: string;
  username: string;
}) {
  const total = useUnreadTotal(currentUserId);

  return (
    <div className="flex items-center gap-2">
      <div>
        <h1 className="text-xl font-bold">G1-Chat</h1>
        <p className="text-xs text-g1-muted">@{username}</p>
      </div>
      {total > 0 && (
        <span className="rounded-full bg-g1-accent px-2 py-0.5 text-[10px] font-medium text-white">
          {total} new
        </span>
      )}
    </div>
  );
}