export type NotificationType = "success" | "error";

export type NotificationState = {
  type: NotificationType;
  message: string;
} | null;
