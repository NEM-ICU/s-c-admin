"use client";

import { Plus } from "lucide-react";

type HeaderProps = {
  onAddSection: () => void;
};

export default function Header({ onAddSection }: HeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <p className="text-sm text-slate-500">Workspace / Menus</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Menu sections
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage the categories and files displayed on your restaurant tablets.
        </p>
      </div>

      <button
        type="button"
        onClick={onAddSection}
        className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
      >
        <Plus size={18} />
        Add menu section
      </button>
    </header>
  );
}
