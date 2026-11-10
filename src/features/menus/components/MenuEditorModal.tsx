"use client";

import {
  Check,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import type {
  ConversionProgress,
  MenuSection,
  SectionForm,
} from "../types/menu";

type MenuEditorModalProps = {
  isOpen: boolean;
  editingSection: MenuSection | null;
  form: SectionForm;
  pdfFile: File | null;
  saving: boolean;
  conversionProgress: ConversionProgress | null;
  error: string;
  onFormChange: (form: SectionForm) => void;
  onPdfSelect: (file: File | null) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export default function MenuEditorModal({
  isOpen,
  editingSection,
  form,
  pdfFile,
  saving,
  conversionProgress,
  error,
  onFormChange,
  onPdfSelect,
  onSubmit,
  onClose,
}: MenuEditorModalProps) {
  if (!isOpen) return null;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    onPdfSelect(file);
  }

  const progressPercentage =
    conversionProgress && conversionProgress.total > 0
      ? Math.round(
          (conversionProgress.current / conversionProgress.total) * 100,
        )
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
        className="my-auto max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div>
            <h2 id="editor-title" className="text-xl font-bold">
              {editingSection ? "Edit menu section" : "Add menu section"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter section details. Uploading a PDF automatically converts
              every page to WebP for fast tablet loading.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close editor"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          <label className="block text-sm font-medium">
            Section name *
            <input
              className="mt-2"
              required
              disabled={saving}
              maxLength={120}
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              placeholder="e.g. Lunch Menu"
            />
          </label>

          <label className="block text-sm font-medium">
            Description
            <textarea
              className="mt-2 min-h-24 resize-y"
              disabled={saving}
              maxLength={1000}
              value={form.description}
              onChange={(e) =>
                onFormChange({ ...form, description: e.target.value })
              }
              placeholder="Optional description"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Display order
              <input
                className="mt-2"
                type="number"
                required
                disabled={saving}
                value={form.display_order}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    display_order: Number(e.target.value),
                  })
                }
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                Lower numbers appear first.
              </span>
            </label>

            <label className="flex items-center gap-3 self-start pt-2 text-sm font-medium">
              <input
                className="h-4 w-4"
                type="checkbox"
                disabled={saving}
                checked={form.is_active}
                onChange={(e) =>
                  onFormChange({ ...form, is_active: e.target.checked })
                }
              />
              Active on the menu
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 font-semibold">
              <FileText size={18} />
              Menu PDF & WebP Pages
            </div>

            <div className="mt-2 text-xs text-slate-500 space-y-1">
              {editingSection?.pdf_path ? (
                <p className="break-all">
                  <span className="font-medium text-slate-700">
                    Current file:
                  </span>{" "}
                  {editingSection.pdf_path}
                </p>
              ) : (
                <p>No PDF attached yet.</p>
              )}

              {editingSection?.page_count ? (
                <p className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                  <ImageIcon size={13} />
                  {editingSection.page_count} WebP page(s) published (v
                  {editingSection.version})
                </p>
              ) : null}
            </div>

            <label
              className={`mt-3 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm transition ${
                saving
                  ? "cursor-not-allowed bg-slate-50 opacity-60"
                  : "cursor-pointer hover:bg-slate-50"
              }`}
            >
              <Upload size={17} />
              <span className="min-w-0 flex-1 truncate">
                {pdfFile
                  ? pdfFile.name
                  : editingSection?.pdf_path
                    ? "Choose a replacement PDF file"
                    : "Choose a PDF file to convert"}
              </span>
              <input
                className="hidden"
                type="file"
                disabled={saving}
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
              />
            </label>
            <p className="mt-2 text-xs text-slate-400">
              Pages are rendered at up to 1600px with high-quality WebP
              compression. The existing menu remains active until all pages
              finish uploading.
            </p>
          </div>

          {/* Progress Indicator */}
          {saving && conversionProgress && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                <span className="flex items-center gap-2">
                  <LoaderCircle
                    size={14}
                    className="animate-spin text-slate-900"
                  />
                  {conversionProgress.message}
                </span>
                <span className="tabular-nums font-semibold">
                  {progressPercentage}%
                </span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-slate-900 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Check size={17} />
              )}
              {saving
                ? "Processing & saving…"
                : editingSection
                  ? "Save changes"
                  : "Create section"}
              <ChevronDown size={14} className="opacity-60" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
