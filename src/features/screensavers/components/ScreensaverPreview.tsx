"use client";

import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import type { MediaType } from "../types/screensaver";

type ScreensaverPreviewProps = {
  url?: string;
  name: string;
  mediaType: MediaType;
};

export default function ScreensaverPreview({
  url,
  name,
  mediaType,
}: ScreensaverPreviewProps) {
  if (!url) {
    return (
      <div className="flex h-16 w-28 items-center justify-center rounded-lg bg-slate-100">
        <ImageIcon size={20} className="text-slate-400" />
      </div>
    );
  }

  if (mediaType === "video") {
    return (
      <video
        src={url}
        className="h-16 w-28 rounded-lg bg-slate-100 object-cover"
        muted
        playsInline
      />
    );
  }

  return (
    <Image
      src={url}
      alt={name}
      width={112}
      height={64}
      unoptimized
      className="h-16 w-28 rounded-lg bg-slate-100 object-cover"
    />
  );
}
