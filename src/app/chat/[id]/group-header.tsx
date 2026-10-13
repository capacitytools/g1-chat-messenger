"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ConvertToJobRoom from "./convert-to-job-room";

type Member = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export default function GroupHeader({
  conversationId,
  title,
  memberCount,
  members,
  currentUserId,
  jobRoom
}: {
  conversationId: string;
  title: string;
  memberCount: number;
  members: Member[];
  currentUserId: string;
  jobRoom?: { company_name: string; is_verified: boolean } | null;
}) {
  const [open, setOpen] = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  return (
    <>
      <header className="flex items-center gap-3 border-b border-g1-border px-4 py-3">
        <Link href="/chat" className="text-g1-muted">
          ←
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${
              jobRoom
                ? "bg-g1-accent text-white"
                : "bg-g1-accent/20 text-g1-text"
            }`}
          >
            {title[0]?.toUpperCase() ?? "#"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {jobRoom ? "💼 " : "👥 "}
              {title}
            </p>
            <p className="text-[10px] text-g1-muted">
              {memberCount} members
              {jobRoom ? " · Job room" : ""}
            </p>
          </div>
        </button>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-g1-border bg-g1-bg p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{title}</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-g1-muted hover:text-g1-text"
              >
                ✕
              </button>
            </div>

            {jobRoom && (
              <div className="mb-4 rounded-lg border border-g1-accent/40 bg-g1-accent/5 p-3">
                <p className="text-[10px] uppercase tracking-wide text-g1-accent">
                  Job Room
                </p>
                <p className="mt-1 text-sm font-medium">
                  {jobRoom.company_name}
                </p>
                {jobRoom.is_verified && (
                  <p className="mt-1 text-[10px] text-green-400">
                    ✓ Verified employer
                  </p>
                )}
              </div>
            )}

            {!jobRoom && (
              <button
                onClick={() => {
                  setOpen(false);
                  setShowConvert(true);
                }}
                className="mb-4 w-full rounded-lg border border-g1-accent bg-g1-accent/10 py-2 text-xs font-medium text-g1-accent"
              >
                💼 Turn into job room
              </button>
            )}

            <p className="mb-2 text-xs uppercase tracking-wide text-g1-muted">
              {memberCount} members
            </p>

            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg bg-g1-surface px-3 py-2"
                >
                  <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-g1-bg">
                    {m.avatar_url ? (
                      <Image
                        src={m.avatar_url}
                        alt={m.username}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-medium text-g1-muted">
                        {m.username[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      @{m.username}
                      {m.id === currentUserId && (
                        <span className="ml-1 text-[10px] text-g1-muted">
                          (you)
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-center text-[10px] text-g1-muted">
              Adding members coming soon
            </p>
          </div>
        </div>
      )}

      {showConvert && (
        <ConvertToJobRoom
          conversationId={conversationId}
          onClose={() => setShowConvert(false)}
        />
      )}
    </>
  );
}