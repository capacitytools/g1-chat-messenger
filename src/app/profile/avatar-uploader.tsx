"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function AvatarUploader({
  initialUrl
}: {
  initialUrl: string | null;
}) {
  const supabase = createClient();
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const signRes = await fetch("/api/upload/sign", { method: "POST" });
      if (!signRes.ok) throw new Error("Could not get upload signature");
      const { timestamp, folder, signature, apiKey, cloudName } =
        await signRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("folder", folder);
      formData.append("signature", signature);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      if (!uploadRes.ok) throw new Error("Cloudinary upload failed");
      const data = await uploadRes.json();
      const secureUrl: string = data.secure_url;

      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const { error: dbError } = await supabase
        .from("profiles")
        .update({ avatar_url: secureUrl })
        .eq("id", user.id);

      if (dbError) throw dbError;

      setUrl(secureUrl);
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-24 w-24 overflow-hidden rounded-full border border-g1-border bg-g1-bg">
        {url ? (
          <Image src={url} alt="Avatar" fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-g1-muted">
            No avatar
          </div>
        )}
      </div>

      <label className="cursor-pointer rounded-lg border border-g1-border bg-g1-surface px-3 py-1.5 text-xs">
        {uploading ? "Uploading…" : "Change avatar"}
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}