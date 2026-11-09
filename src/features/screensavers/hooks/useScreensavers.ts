import { useCallback, useState } from "react";
import {
  deleteScreensaverRecord,
  fetchScreensavers,
  fetchScreensaverSignedUrls,
  toggleScreensaverActive,
  uploadScreensaver,
} from "../services/screensaverService";
import type { Screensaver } from "../types/screensaver";

type UseScreensaversProps = {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export function useScreensavers({ onSuccess, onError }: UseScreensaversProps) {
  const [screensavers, setScreensavers] = useState<Screensaver[]>([]);
  const [screensaverUrls, setScreensaverUrls] = useState<
    Record<string, string>
  >({});
  const [screensaverFile, setScreensaverFile] = useState<File | null>(null);
  const [savingScreensaver, setSavingScreensaver] = useState(false);
  const [screensaverActionId, setScreensaverActionId] = useState<string | null>(
    null,
  );

  const loadScreensavers = useCallback(async () => {
    try {
      const items = await fetchScreensavers();
      setScreensavers(items);
      const urls = await fetchScreensaverSignedUrls(items);
      setScreensaverUrls(urls);
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Failed to load screensavers.",
      );
    }
  }, [onError]);

  const handleUpload = useCallback(async () => {
    if (!screensaverFile) {
      onError("Choose an image, GIF, or MP4 video first.");
      return;
    }

    setSavingScreensaver(true);
    try {
      await uploadScreensaver(screensaverFile);
      setScreensaverFile(null);
      onSuccess(
        "Screensaver uploaded. Activate it when you are ready to publish it to the tablets.",
      );
      await loadScreensavers();
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Unable to upload screensaver.",
      );
    } finally {
      setSavingScreensaver(false);
    }
  }, [screensaverFile, loadScreensavers, onSuccess, onError]);

  const handleToggle = useCallback(
    async (item: Screensaver) => {
      setScreensaverActionId(item.id);
      try {
        const nextActive = await toggleScreensaverActive(item);
        onSuccess(
          nextActive
            ? `${item.name} added to the screensaver playlist.`
            : `${item.name} deactivated.`,
        );
        await loadScreensavers();
      } catch (err) {
        onError(
          err instanceof Error
            ? err.message
            : "Unable to update screensaver status.",
        );
      } finally {
        setScreensaverActionId(null);
      }
    },
    [loadScreensavers, onSuccess, onError],
  );

  const handleDelete = useCallback(
    async (item: Screensaver) => {
      const confirmed = window.confirm(
        `Permanently delete "${item.name}"? This also removes the file from Supabase Storage.`,
      );
      if (!confirmed) return;

      setScreensaverActionId(item.id);
      try {
        await deleteScreensaverRecord(item);
        onSuccess(`Deleted ${item.name}.`);
        await loadScreensavers();
      } catch (err) {
        onError(
          err instanceof Error ? err.message : "Unable to delete screensaver.",
        );
      } finally {
        setScreensaverActionId(null);
      }
    },
    [loadScreensavers, onSuccess, onError],
  );

  return {
    screensavers,
    screensaverUrls,
    screensaverFile,
    setScreensaverFile,
    savingScreensaver,
    screensaverActionId,
    loadScreensavers,
    handleUpload,
    handleToggle,
    handleDelete,
  };
}
