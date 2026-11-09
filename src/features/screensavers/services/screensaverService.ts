import {
  getSignedStorageUrl,
  removeStorageFile,
  uploadStorageFile,
} from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import type { MediaType, Screensaver } from "../types/screensaver";

export async function fetchScreensavers(): Promise<Screensaver[]> {
  const { data, error } = await supabase
    .from("screensavers")
    .select("id,name,storage_path,media_type,is_active,created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(
      `${error.message}. Check screensavers table read permissions.`,
    );
  }

  return (data ?? []) as Screensaver[];
}

export async function fetchScreensaverSignedUrls(
  items: Screensaver[],
): Promise<Record<string, string>> {
  const urlEntries = await Promise.all(
    items.map(async (item) => {
      const url = await getSignedStorageUrl(item.storage_path, 3600);
      return [item.id, url] as const;
    }),
  );

  return Object.fromEntries(urlEntries);
}

export function detectMediaType(file: File): MediaType | null {
  const isImage = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
  const isGif =
    file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
  const isVideo =
    file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");

  if (isVideo) return "video";
  if (isGif) return "gif";
  if (isImage) return "image";
  return null;
}

export async function uploadScreensaver(file: File): Promise<void> {
  const mediaType = detectMediaType(file);
  if (!mediaType) {
    throw new Error("Supported formats are JPG, PNG, WebP, GIF, and MP4.");
  }

  let uploadedPath: string | null = null;
  try {
    uploadedPath = await uploadStorageFile(file, "screensavers");
    const { error: insertError } = await supabase.from("screensavers").insert({
      name: file.name,
      storage_path: uploadedPath,
      media_type: mediaType,
      is_active: false,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }
  } catch (err) {
    if (uploadedPath) {
      await removeStorageFile(uploadedPath).catch(() => {});
    }
    throw err;
  }
}

export async function toggleScreensaverActive(
  item: Screensaver,
): Promise<boolean> {
  const nextActive = !item.is_active;
  const { error } = await supabase
    .from("screensavers")
    .update({ is_active: nextActive })
    .eq("id", item.id);

  if (error) {
    throw new Error(error.message);
  }

  return nextActive;
}

export async function deleteScreensaverRecord(
  item: Screensaver,
): Promise<void> {
  await removeStorageFile(item.storage_path);

  const { error: rowError } = await supabase
    .from("screensavers")
    .delete()
    .eq("id", item.id);

  if (rowError) {
    throw new Error(
      `File removed, but database record deletion failed: ${rowError.message}`,
    );
  }
}
