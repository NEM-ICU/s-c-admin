"use client";

import { formatDate } from "@/lib/utils";
import {
  BookOpen,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import type { MenuSection } from "../types/menu";

type MenuListProps = {
  sections: MenuSection[];
  filteredSections: MenuSection[];
  loading: boolean;
  search: string;
  showInactive: boolean;
  onSearchChange: (search: string) => void;
  onShowInactiveChange: (show: boolean) => void;
  onRefresh: () => void;
  onAddNew: () => void;
  onEdit: (section: MenuSection) => void;
  onToggleActive: (section: MenuSection) => void;
};

export default function MenuList({
  sections,
  filteredSections,
  loading,
  search,
  showInactive,
  onSearchChange,
  onShowInactiveChange,
  onRefresh,
  onAddNew,
  onEdit,
  onToggleActive,
}: MenuListProps) {
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold">All menu sections</h2>
          <p className="mt-1 text-sm text-slate-500">
            Change order, update files, or control visibility.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block min-w-48">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="pl-9"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search menus…"
              aria-label="Search menu sections"
            />
          </label>

          <label className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-600">
            <input
              className="h-4 w-4"
              type="checkbox"
              checked={showInactive}
              onChange={(e) => onShowInactiveChange(e.target.checked)}
            />
            Show inactive
          </label>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh menu sections"
            className="flex items-center justify-center rounded-lg border border-slate-200 p-2.5 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
          <LoaderCircle size={18} className="animate-spin" />
          Loading menu sections…
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
            <BookOpen size={28} />
          </div>
          <h3 className="mt-4 font-semibold">No menu sections found</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Add your first menu section, or change your search.
          </p>
          <button
            type="button"
            onClick={onAddNew}
            className="mt-5 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Plus size={17} />
            Add menu section
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Section</th>
                <th className="px-5 py-4 font-semibold">Files</th>
                <th className="px-5 py-4 font-semibold">Order</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Updated</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSections.map((section) => (
                <tr key={section.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {section.name}
                    </p>
                    <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                      {section.description || "No description"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <FileText size={14} />
                        {section.pdf_path ? "PDF attached" : "No PDF"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 tabular-nums">
                    {section.display_order}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        section.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {section.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                    {formatDate(section.updated_at)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(section)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium transition hover:bg-slate-100"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleActive(section)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium transition hover:bg-slate-100"
                      >
                        {section.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        Showing {filteredSections.length} of {sections.length} sections
      </div>
    </section>
  );
}
