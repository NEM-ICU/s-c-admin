"use client";

import {
  Check,
  ChevronDown,
  FileText,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import type { MenuSection, SectionForm } from "../types/menu";

type MenuEditorModalProps = {
  isOpen: boolean;
  editingSection: MenuSection | null;
  form: SectionForm;
  pdfFile: File | null;
  saving: boolean;
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
              Enter the section details and attach its files.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
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
              Menu PDF
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {form.pdf_path
                ? `Current file: ${form.pdf_path}`
                : "No PDF attached yet."}
            </p>
            <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm hover:bg-slate-50">
              <Upload size={17} />
              <span className="min-w-0 flex-1 truncate">
                {pdfFile ? pdfFile.name : "Choose a PDF file"}
              </span>
              <input
                className="hidden"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
              />
            </label>
          </div>

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
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium transition hover:bg-slate-50"
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
                ? "Saving…"
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
