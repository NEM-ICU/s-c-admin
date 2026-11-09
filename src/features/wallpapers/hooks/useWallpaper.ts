import { useCallback, useState } from "react";
import {
  fetchGlobalWallpaper,
  saveGlobalWallpaper,
} from "../services/wallpaperService";

type UseWallpaperProps = {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export function useWallpaper({ onSuccess, onError }: UseWallpaperProps) {
  const [wallpaperPath, setWallpaperPath] = useState<string | null>(null);
  const [wallpaperFile, setWallpaperFile] = useState<File | null>(null);
  const [savingWallpaper, setSavingWallpaper] = useState(false);

  const loadWallpaper = useCallback(async () => {
    try {
      const path = await fetchGlobalWallpaper();
      setWallpaperPath(path);
    } catch (err) {
      onError(
        err instanceof Error
          ? err.message
          : "Failed to load global wallpaper settings.",
      );
    }
  }, [onError]);

  const saveWallpaper = useCallback(async () => {
    if (!wallpaperFile) {
      onError("Choose an image for the global wallpaper first.");
      return;
    }

    setSavingWallpaper(true);
    try {
      const newPath = await saveGlobalWallpaper(wallpaperFile);
      setWallpaperPath(newPath);
      setWallpaperFile(null);
      onSuccess(
        "Global wallpaper saved. Tap Sync on the tablet to download it.",
      );
    } catch (err) {
      onError(
        err instanceof Error
          ? err.message
          : "Unable to save the global wallpaper.",
      );
    } finally {
      setSavingWallpaper(false);
    }
  }, [wallpaperFile, onSuccess, onError]);

  return {
    wallpaperPath,
    wallpaperFile,
    setWallpaperFile,
    savingWallpaper,
    loadWallpaper,
    saveWallpaper,
  };
}
