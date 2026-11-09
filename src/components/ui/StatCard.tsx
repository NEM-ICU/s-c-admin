import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: number | string;
  icon: ReactNode;
};

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
      </div>
      <div className="rounded-xl bg-slate-100 p-3 text-slate-600">{icon}</div>
    </div>
  );
}
