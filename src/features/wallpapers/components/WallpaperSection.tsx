"use client";

import { Check, Image as ImageIcon, LoaderCircle, Upload } from "lucide-react";
import type { ChangeEvent } from "react";

type WallpaperSectionProps = {
  wallpaperPath: string | null;
  wallpaperFile: File | null;
  saving: boolean;
  onFileSelect: (file: File | null) => void;
  onSave: () => void;
};

export default function WallpaperSection({
  wallpaperPath,
  wallpaperFile,
  saving,
  onFileSelect,
  onSave,
}: WallpaperSectionProps) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    onFileSelect(file);
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 font-semibold text-slate-900">
        <ImageIcon size={20} />
        Global tablet wallpaper
      </div>
      <p className="mt-1 text-sm text-slate-500">
        This image is used behind every menu category. It is not attached to an
        individual menu.
      </p>
      <p className="mt-3 break-all text-xs text-slate-500">
        {wallpaperPath
          ? `Current file: ${wallpaperPath}`
          : "No global wallpaper saved yet. The tablet will use its bundled default wallpaper."}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm hover:bg-slate-50">
          <Upload size={17} />
          <span className="min-w-0 flex-1 truncate">
            {wallpaperFile
              ? wallpaperFile.name
              : "Choose a global wallpaper image"}
          </span>
          <input
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            onChange={handleFileChange}
          />
        </label>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !wallpaperFile}
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Check size={17} />
          )}
          {saving ? "Saving wallpaper…" : "Save global wallpaper"}
        </button>
      </div>
    </section>
  );
}
