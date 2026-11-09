"use client";

import { BookOpen, LogOut, Utensils } from "lucide-react";

type SidebarProps = {
  userEmail?: string | null;
  onSignOut: () => void;
};

export default function Sidebar({ userEmail, onSignOut }: SidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col bg-slate-950 text-white md:min-h-screen md:w-64">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="rounded-xl bg-white/10 p-2.5">
          <Utensils size={24} />
        </div>
        <div>
          <p className="font-semibold">Restaurant Admin</p>
          <p className="text-xs text-slate-400">Management panel</p>
        </div>
      </div>

      <div className="px-4 pb-5">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Workspace
        </p>
        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3 text-sm font-medium">
          <BookOpen size={18} />
          Menu sections
        </div>
      </div>

      <div className="mt-auto border-t border-white/10 p-5">
        {userEmail && (
          <p className="truncate text-sm text-slate-300" title={userEmail}>
            {userEmail}
          </p>
        )}
        <button
          type="button"
          onClick={onSignOut}
          className="mt-4 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
