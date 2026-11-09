"use client";

import { Film, LoaderCircle, RefreshCw, Trash2, Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import type { Screensaver } from "../types/screensaver";
import ScreensaverPreview from "./ScreensaverPreview";

type ScreensaverSectionProps = {
  screensavers: Screensaver[];
  screensaverUrls: Record<string, string>;
  screensaverFile: File | null;
  savingScreensaver: boolean;
  actionId: string | null;
  onFileSelect: (file: File | null) => void;
  onUpload: () => void;
  onRefresh: () => void;
  onToggle: (item: Screensaver) => void;
  onDelete: (item: Screensaver) => void;
};

export default function ScreensaverSection({
  screensavers,
  screensaverUrls,
  screensaverFile,
  savingScreensaver,
  actionId,
  onFileSelect,
  onUpload,
  onRefresh,
  onToggle,
  onDelete,
}: ScreensaverSectionProps) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    onFileSelect(file);
  }

  const activeCount = screensavers.filter((item) => item.is_active).length;

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Film size={20} />
            Screensaver management
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Upload promotional images, GIFs, or MP4 videos. The tablet will show
            the active file after two minutes without interaction.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:bg-slate-50"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm hover:bg-slate-50">
          <Upload size={17} />
          <span className="min-w-0 flex-1 truncate">
            {screensaverFile
              ? screensaverFile.name
              : "Choose image, GIF, or MP4 video"}
          </span>
          <input
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,.jpg,.jpeg,.png,.webp,.gif,.mp4"
            onChange={handleFileChange}
          />
        </label>
        <button
          type="button"
          onClick={onUpload}
          disabled={savingScreensaver || !screensaverFile}
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingScreensaver ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Upload size={17} />
          )}
          {savingScreensaver ? "Uploading…" : "Upload screensaver"}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Supported formats: JPG, PNG, WebP, GIF, MP4. New uploads are inactive
        until you activate them. Activate as many files as you want.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
          {activeCount} active in playlist
        </span>
        <span className="text-slate-500">
          Playback order: oldest upload first.
        </span>
      </div>

      <div className="mt-6 overflow-x-auto">
        {screensavers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
            No screensaver files uploaded yet.
          </div>
        ) : (
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Preview</th>
                <th className="px-4 py-3 font-semibold">File</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {screensavers.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <ScreensaverPreview
                      url={screensaverUrls[item.id]}
                      name={item.name}
                      mediaType={item.media_type}
                    />
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 font-medium text-slate-800">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 uppercase text-slate-500">
                    {item.media_type}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={actionId === item.id}
                        onClick={() => onToggle(item)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        {item.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        disabled={actionId === item.id}
                        onClick={() => onDelete(item)}
                        aria-label={`Delete ${item.name}`}
                        className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Activate multiple files to include them in the looping playlist.
        Playback follows upload order (oldest first). Deleting a file removes
        its Storage object and database record.
      </p>
    </section>
  );
}
