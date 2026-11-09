import { supabase } from "@/lib/supabase";
import { uploadStorageFile } from "@/lib/storage";

export async function fetchGlobalWallpaper(): Promise<string | null> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("wallpaper_path")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `${error.message}. Check app_settings read permissions and that the settings row with id = 1 exists.`,
    );
  }

  return data?.wallpaper_path ?? null;
}

export async function saveGlobalWallpaper(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file for the global wallpaper.");
  }

  const wallpaperPath = await uploadStorageFile(file, "wallpapers");

  const { error } = await supabase.from("app_settings").upsert(
    {
      id: 1,
      wallpaper_path: wallpaperPath,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(
      `${error.message}. Check app_settings insert/update permissions and Storage upload policies.`,
    );
  }

  return wallpaperPath;
}
