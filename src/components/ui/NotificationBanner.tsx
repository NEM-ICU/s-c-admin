"use client";

import { X } from "lucide-react";
import type { NotificationState } from "@/types/common";

type NotificationBannerProps = {
  notification: NotificationState;
  onDismiss: () => void;
};

export default function NotificationBanner({
  notification,
  onDismiss,
}: NotificationBannerProps) {
  if (!notification || !notification.message) return null;

  const isError = notification.type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${
        isError
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <span>{notification.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className="shrink-0 rounded p-0.5 opacity-80 hover:opacity-100"
      >
        <X size={16} />
      </button>
    </div>
  );
}
