import { storageBucket, supabase } from "@/lib/supabase";
import { safeFilename } from "@/lib/utils";

export type StorageFolder = "menus" | "wallpapers" | "screensavers";

export async function uploadStorageFile(
  file: File,
  folder: StorageFolder,
  customPath?: string,
): Promise<string> {
  const path =
    customPath ?? `${folder}/${crypto.randomUUID()}-${safeFilename(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(storageBucket)
    .upload(path, file, {
      upsert: true,
      cacheControl: "3600",
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw new Error(`Upload failed for ${path}: ${uploadError.message}`);
  }

  return path;
}

export async function removeStorageFile(path: string): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from(storageBucket).remove([path]);
  if (error) {
    throw new Error(`Storage deletion failed: ${error.message}`);
  }
}

export async function removeStorageFiles(paths: string[]): Promise<string[]> {
  const validPaths = paths.filter(Boolean);
  if (validPaths.length === 0) return [];

  const { data, error } = await supabase.storage
    .from(storageBucket)
    .remove(validPaths);

  if (error) {
    throw new Error(`Storage batch deletion failed: ${error.message}`);
  }

  return (data ?? []).map((item) => item.name);
}

export async function listStorageFolder(folderPath: string): Promise<string[]> {
  // Normalize folder path: ensure no leading or trailing slashes
  const cleanPrefix = folderPath.replace(/^\/+|\/+$/g, "");

  const { data, error } = await supabase.storage
    .from(storageBucket)
    .list(cleanPrefix, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });

  if (error) {
    throw new Error(`Failed to list storage directory: ${error.message}`);
  }

  const results: string[] = [];
  for (const item of data ?? []) {
    if (item.id === null) {
      // It's a subfolder
      const subItems = await listStorageFolder(`${cleanPrefix}/${item.name}`);
      results.push(...subItems);
    } else {
      results.push(`${cleanPrefix}/${item.name}`);
    }
  }

  return results;
}

export async function deleteMenuCategoryStorage(
  sectionId: string,
  extraPaths: (string | null | undefined)[] = [],
): Promise<{ deleted: string[]; errors: string[] }> {
  const deleted: string[] = [];
  const errors: string[] = [];

  const folderPrefix = `menus/${sectionId}`;
  let filesToDelete: string[] = [];

  try {
    const folderFiles = await listStorageFolder(folderPrefix);
    filesToDelete.push(...folderFiles);
  } catch (err) {
    errors.push(
      `Could not list folder ${folderPrefix}: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }

  // Include any extra explicitly tracked paths (e.g. legacy flat pdf_path)
  for (const extra of extraPaths) {
    if (extra && extra.startsWith("menus/") && !filesToDelete.includes(extra)) {
      filesToDelete.push(extra);
    }
  }

  // Strict guardrail: NEVER delete files outside of menus/
  filesToDelete = filesToDelete.filter((p) => {
    if (p.startsWith("wallpapers/") || p.startsWith("screensavers/")) {
      console.warn("Safety check blocked attempt to delete shared asset:", p);
      return false;
    }
    return p.startsWith("menus/");
  });

  if (filesToDelete.length > 0) {
    try {
      await removeStorageFiles(filesToDelete);
      deleted.push(...filesToDelete);
    } catch (batchErr) {
      errors.push(
        `Failed to remove storage files: ${batchErr instanceof Error ? batchErr.message : "Unknown error"}`,
      );
    }
  }

  return { deleted, errors };
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
