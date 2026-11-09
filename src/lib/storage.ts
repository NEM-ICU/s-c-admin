import { storageBucket, supabase } from "@/lib/supabase";
import { safeFilename } from "@/lib/utils";

export type StorageFolder = "menus" | "wallpapers" | "screensavers";

export async function uploadStorageFile(
  file: File,
  folder: StorageFolder,
): Promise<string> {
  const path = `${folder}/${crypto.randomUUID()}-${safeFilename(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(storageBucket)
    .upload(path, file, {
      upsert: false,
      cacheControl: "3600",
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  return path;
}

export async function removeStorageFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from(storageBucket).remove([path]);
  if (error) {
    throw new Error(`Storage deletion failed: ${error.message}`);
  }
}

export async function getSignedStorageUrl(
  path: string,
  expiresInSeconds: number = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(storageBucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) {
    return "";
  }

  return data.signedUrl;
}
