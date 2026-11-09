"use client";

import { storageBucket, supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import {
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  Film,
  Image as ImageIcon,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Utensils,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

type MenuSection = {
  id: string;
  name: string;
  description: string | null;
  pdf_path: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Screensaver = {
  id: string;
  name: string;
  storage_path: string;
  media_type: "image" | "gif" | "video";
  is_active: boolean;
  created_at: string;
};

type SectionForm = {
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
  pdf_path: string | null;
};

const emptyForm: SectionForm = {
  name: "",
  description: "",
  display_order: 0,
  is_active: true,
  pdf_path: null,
};

function safeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<MenuSection | null>(null);
  const [form, setForm] = useState<SectionForm>(emptyForm);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [globalWallpaperPath, setGlobalWallpaperPath] = useState<string | null>(null);
  const [globalWallpaperFile, setGlobalWallpaperFile] = useState<File | null>(null);
  const [savingGlobalWallpaper, setSavingGlobalWallpaper] = useState(false);

  const [screensavers, setScreensavers] = useState<Screensaver[]>([]);
  const [screensaverFile, setScreensaverFile] = useState<File | null>(null);
  const [savingScreensaver, setSavingScreensaver] = useState(false);
  const [screensaverUrls, setScreensaverUrls] = useState<Record<string, string>>({});
  const [screensaverActionId, setScreensaverActionId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setError(error.message);
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadSections = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("menu_sections")
      .select(
        "id,name,description,pdf_path,display_order,is_active,created_at,updated_at"
      )
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (queryError) {
      setError(
        `${queryError.message}. Check that your signed-in user has permission to read menu_sections.`
      );
      setSections([]);
    } else {
      setSections((data ?? []) as MenuSection[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) void loadSections();
  }, [session, loadSections]);

  const loadGlobalWallpaper = useCallback(async () => {
    const { data, error: settingsError } = await supabase
      .from("app_settings")
      .select("wallpaper_path")
      .eq("id", 1)
      .maybeSingle();

    if (settingsError) {
      setError(
        `${settingsError.message}. Check app_settings read permissions and that the settings row with id = 1 exists.`
      );
      return;
    }

    setGlobalWallpaperPath(data?.wallpaper_path ?? null);
  }, []);

  useEffect(() => {
    if (session) void loadGlobalWallpaper();
  }, [session, loadGlobalWallpaper]);

  const loadScreensavers = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from("screensavers")
      .select("id,name,storage_path,media_type,is_active,created_at")
      .order("created_at", { ascending: true });

    if (queryError) {
      setError(`${queryError.message}. Check screensavers table read permissions.`);
      setScreensavers([]);
      return;
    }

    const items = (data ?? []) as Screensaver[];
    setScreensavers(items);

    const urlEntries = await Promise.all(
      items.map(async (item) => {
        const { data: signedData, error: signedError } = await supabase.storage
          .from(storageBucket)
          .createSignedUrl(item.storage_path, 60 * 60);
        return [item.id, signedError ? "" : signedData.signedUrl] as const;
      })
    );
    setScreensaverUrls(Object.fromEntries(urlEntries));
  }, []);

  useEffect(() => {
    if (session) void loadScreensavers();
  }, [session, loadScreensavers]);

  async function handleUploadScreensaver() {
    if (!screensaverFile) {
      setError("Choose an image, GIF, or MP4 video first.");
      return;
    }

    const isImage = ["image/jpeg", "image/png", "image/webp"].includes(screensaverFile.type);
    const isGif = screensaverFile.type === "image/gif" || screensaverFile.name.toLowerCase().endsWith(".gif");
    const isVideo = screensaverFile.type === "video/mp4" || screensaverFile.name.toLowerCase().endsWith(".mp4");

    if (!isImage && !isGif && !isVideo) {
      setError("Supported formats are JPG, PNG, WebP, GIF, and MP4.");
      return;
    }

    setSavingScreensaver(true);
    setError("");
    setNotice("");
    let uploadedPath: string | null = null;

    try {
      uploadedPath = await uploadFile(screensaverFile, "screensavers");
      const mediaType = isVideo ? "video" : isGif ? "gif" : "image";
      const { error: insertError } = await supabase.from("screensavers").insert({
        name: screensaverFile.name,
        storage_path: uploadedPath,
        media_type: mediaType,
        is_active: false,
      });

      if (insertError) throw new Error(insertError.message);

      setScreensaverFile(null);
      setNotice("Screensaver uploaded. Activate it when you are ready to publish it to the tablets.");
      await loadScreensavers();
    } catch (uploadError) {
      if (uploadedPath) {
        await supabase.storage.from(storageBucket).remove([uploadedPath]);
      }
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload screensaver.");
    } finally {
      setSavingScreensaver(false);
    }
  }

  async function toggleScreensaver(item: Screensaver) {
    setScreensaverActionId(item.id);
    setError("");
    setNotice("");

    try {
      // Each file is toggled independently. Multiple active files form the playlist.
      const { error: updateError } = await supabase
        .from("screensavers")
        .update({ is_active: !item.is_active })
        .eq("id", item.id);
      if (updateError) throw new Error(updateError.message);

      setNotice(
        item.is_active
          ? `${item.name} deactivated.`
          : `${item.name} added to the screensaver playlist.`
      );
      await loadScreensavers();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update screensaver.");
    } finally {
      setScreensaverActionId(null);
    }
  }

  async function deleteScreensaver(item: Screensaver) {
    const confirmed = window.confirm(`Permanently delete "${item.name}"? This also removes the file from Supabase Storage.`);
    if (!confirmed) return;

    setScreensaverActionId(item.id);
    setError("");
    setNotice("");

    try {
      const { error: storageError } = await supabase.storage
        .from(storageBucket)
        .remove([item.storage_path]);
      if (storageError) throw new Error(`Storage deletion failed: ${storageError.message}`);

      const { error: rowError } = await supabase
        .from("screensavers")
        .delete()
        .eq("id", item.id);
      if (rowError) throw new Error(`File removed, but database record deletion failed: ${rowError.message}`);

      setNotice(`Deleted ${item.name}.`);
      await loadScreensavers();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete screensaver.");
    } finally {
      setScreensaverActionId(null);
    }
  }

  async function handleSaveGlobalWallpaper() {
    if (!globalWallpaperFile) {
      setError("Choose an image for the global wallpaper first.");
      return;
    }

    if (!globalWallpaperFile.type.startsWith("image/")) {
      setError("Please select an image file for the global wallpaper.");
      return;
    }

    setSavingGlobalWallpaper(true);
    setError("");
    setNotice("");

    try {
      const wallpaperPath = await uploadFile(globalWallpaperFile, "wallpapers");

      const { error: settingsError } = await supabase
        .from("app_settings")
        .upsert(
          {
            id: 1,
            wallpaper_path: wallpaperPath,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (settingsError) {
        throw new Error(
          `${settingsError.message}. Check app_settings insert/update permissions and Storage upload policies.`
        );
      }

      setGlobalWallpaperPath(wallpaperPath);
      setGlobalWallpaperFile(null);
      setNotice("Global wallpaper saved. Tap Sync on the tablet to download it.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the global wallpaper."
      );
    } finally {
      setSavingGlobalWallpaper(false);
    }
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSigningIn(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) setError(signInError.message);
    setSigningIn(false);
  }

  async function handleSignOut() {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
  }

  function openNewSection() {
    setEditing(null);
    setForm({
      ...emptyForm,
      display_order:
        sections.length > 0
          ? Math.max(...sections.map((section) => section.display_order)) + 1
          : 0,
    });
    setPdfFile(null);
    setError("");
    setNotice("");
    setEditorOpen(true);
  }

  function openEditSection(section: MenuSection) {
    setEditing(section);
    setForm({
      name: section.name,
      description: section.description ?? "",
      display_order: section.display_order,
      is_active: section.is_active,
      pdf_path: section.pdf_path,
    });
    setPdfFile(null);
    setError("");
    setNotice("");
    setEditorOpen(true);
  }

  async function uploadFile(
    file: File,
    folder: "menus" | "wallpapers" | "screensavers"
  ): Promise<string> {
    const path = `${folder}/${crypto.randomUUID()}-${safeFilename(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(path, file, {
        upsert: false,
        cacheControl: "3600",
        contentType: file.type || undefined,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    return path;
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      let pdfPath = form.pdf_path;

      if (pdfFile) {
        if (pdfFile.type !== "application/pdf" && !pdfFile.name.toLowerCase().endsWith(".pdf")) {
          throw new Error("Please select a PDF file for the menu.");
        }

        pdfPath = await uploadFile(pdfFile, "menus");
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        display_order: Number(form.display_order),
        is_active: form.is_active,
        pdf_path: pdfPath,
        updated_at: new Date().toISOString(),
      };

      if (!payload.name) throw new Error("Enter a menu section name.");

      const result = editing
        ? await supabase
            .from("menu_sections")
            .update(payload)
            .eq("id", editing.id)
        : await supabase.from("menu_sections").insert(payload);

      if (result.error) {
        throw new Error(
          `${result.error.message}. Check your menu_sections write permissions and Storage upload policies.`
        );
      }

      setEditorOpen(false);
      setNotice(editing ? "Menu section updated." : "Menu section created.");
      await loadSections();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save menu section."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(section: MenuSection) {
    setError("");
    setNotice("");

    const { error: updateError } = await supabase
      .from("menu_sections")
      .update({
        is_active: !section.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", section.id);

    if (updateError) {
      setError(`${updateError.message}. Check your update permissions.`);
      return;
    }

    setNotice(
      `${section.name} is now ${section.is_active ? "inactive" : "active"}.`
    );
    await loadSections();
  }

  const filteredSections = sections.filter((section) => {
    const matchesSearch = `${section.name} ${section.description ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesSearch && (showInactive || section.is_active);
  });

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="animate-spin" />
        <span className="ml-3 text-sm text-slate-600">Loading admin…</span>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center p-5">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-7 flex items-center gap-3">
            <div className="rounded-xl bg-slate-900 p-3 text-white">
              <Utensils size={25} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Restaurant Admin</h1>
              <p className="text-sm text-slate-500">Menu management</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in with an existing Supabase Auth account.
          </p>

          {error && (
            <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <form onSubmit={handleSignIn} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">
              Email
              <input
                className="mt-2"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
              />
            </label>

            <label className="block text-sm font-medium">
              Password
              <input
                className="mt-2"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
              />
            </label>

            <button
              disabled={signingIn}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700"
            >
              {signingIn && <LoaderCircle size={17} className="animate-spin" />}
              Sign in
            </button>
          </form>
          <p className="mt-5 text-xs leading-5 text-slate-500">
            Create your admin user in Supabase Authentication first. Public sign-up
            is not enabled from this dashboard.
          </p>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen md:flex">
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
          <p className="truncate text-sm text-slate-300">{session.user.email}</p>
          <button
            onClick={handleSignOut}
            className="mt-4 flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-9">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-500">Workspace / Menus</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Menu sections</h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage the categories and files displayed on your restaurant tablets.
            </p>
          </div>

          <button
            onClick={openNewSection}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
          >
            <Plus size={18} />
            Add menu section
          </button>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <ImageIcon size={20} />
            Global tablet wallpaper
          </div>
          <p className="mt-1 text-sm text-slate-500">
            This image is used behind every menu category. It is not attached to an individual menu.
          </p>
          <p className="mt-3 break-all text-xs text-slate-500">
            {globalWallpaperPath
              ? `Current file: ${globalWallpaperPath}`
              : "No global wallpaper saved yet. The tablet will use its bundled default wallpaper."}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm hover:bg-slate-50">
              <Upload size={17} />
              <span className="min-w-0 flex-1 truncate">
                {globalWallpaperFile ? globalWallpaperFile.name : "Choose a global wallpaper image"}
              </span>
              <input
                className="hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                onChange={(event) =>
                  setGlobalWallpaperFile(event.target.files?.[0] ?? null)
                }
              />
            </label>
            <button
              type="button"
              onClick={() => void handleSaveGlobalWallpaper()}
              disabled={savingGlobalWallpaper || !globalWallpaperFile}
              className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingGlobalWallpaper ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Check size={17} />
              )}
              {savingGlobalWallpaper ? "Saving wallpaper…" : "Save global wallpaper"}
            </button>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <Film size={20} />
                Screensaver management
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Upload promotional images, GIFs, or MP4 videos. The tablet will show the active file after two minutes without interaction.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadScreensavers()}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm hover:bg-slate-50">
              <Upload size={17} />
              <span className="min-w-0 flex-1 truncate">
                {screensaverFile ? screensaverFile.name : "Choose image, GIF, or MP4 video"}
              </span>
              <input
                className="hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,.jpg,.jpeg,.png,.webp,.gif,.mp4"
                onChange={(event) => setScreensaverFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="button"
              onClick={() => void handleUploadScreensaver()}
              disabled={savingScreensaver || !screensaverFile}
              className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingScreensaver ? <LoaderCircle size={17} className="animate-spin" /> : <Upload size={17} />}
              {savingScreensaver ? "Uploading…" : "Upload screensaver"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Supported formats: JPG, PNG, WebP, GIF, MP4. New uploads are inactive until you activate them. Activate as many files as you want.</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
              {screensavers.filter((item) => item.is_active).length} active in playlist
            </span>
            <span className="text-slate-500">Playback order: oldest upload first.</span>
          </div>

          <div className="mt-6 overflow-x-auto">
            {screensavers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                No screensaver files uploaded yet.
              </div>
            ) : (
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Preview</th>
                    <th className="px-4 py-3 font-semibold">File</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {screensavers.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        {screensaverUrls[item.id] ? (
                          item.media_type === "video" ? (
                            <video src={screensaverUrls[item.id]} className="h-16 w-28 rounded-lg bg-slate-100 object-cover" muted />
                          ) : (
                            <img src={screensaverUrls[item.id]} alt={item.name} className="h-16 w-28 rounded-lg bg-slate-100 object-cover" />
                          )
                        ) : <div className="flex h-16 w-28 items-center justify-center rounded-lg bg-slate-100"><ImageIcon size={20} className="text-slate-400" /></div>}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 font-medium text-slate-800">{item.name}</td>
                      <td className="px-4 py-3 uppercase text-slate-500">{item.media_type}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {item.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={screensaverActionId === item.id}
                            onClick={() => void toggleScreensaver(item)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
                          >
                            {item.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            disabled={screensaverActionId === item.id}
                            onClick={() => void deleteScreensaver(item)}
                            aria-label={`Delete ${item.name}`}
                            className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">Activate multiple files to include them in the looping playlist. Playback follows upload order (oldest first). Deleting a file removes its Storage object and database record.</p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total sections" value={sections.length} icon={<BookOpen size={20} />} />
          <StatCard
            label="Active sections"
            value={sections.filter((section) => section.is_active).length}
            icon={<Check size={20} />}
          />
          <StatCard
            label="PDF menus attached"
            value={sections.filter((section) => section.pdf_path).length}
            icon={<FileText size={20} />}
          />
        </section>

        {(error || notice) && (
          <div
            role={error ? "alert" : "status"}
            className={`mt-6 flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            <span>{error || notice}</span>
            <button
              onClick={() => {
                setError("");
                setNotice("");
              }}
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold">All menu sections</h2>
              <p className="mt-1 text-sm text-slate-500">
                Change order, update files, or control visibility.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative block min-w-48">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search menus…"
                  aria-label="Search menu sections"
                />
              </label>

              <label className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-600">
                <input
                  className="h-4 w-4"
                  type="checkbox"
                  checked={showInactive}
                  onChange={(event) => setShowInactive(event.target.checked)}
                />
                Show inactive
              </label>

              <button
                onClick={() => void loadSections()}
                disabled={loading}
                aria-label="Refresh menu sections"
                className="flex items-center justify-center rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50"
              >
                <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
              <LoaderCircle size={18} className="animate-spin" />
              Loading menu sections…
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
                <BookOpen size={28} />
              </div>
              <h3 className="mt-4 font-semibold">No menu sections found</h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Add your first menu section, or change your search.
              </p>
              <button
                onClick={openNewSection}
                className="mt-5 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
              >
                <Plus size={17} />
                Add menu section
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Section</th>
                    <th className="px-5 py-4 font-semibold">Files</th>
                    <th className="px-5 py-4 font-semibold">Order</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Updated</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSections.map((section) => (
                    <tr key={section.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{section.name}</p>
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {section.description || "No description"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2 text-xs text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <FileText size={14} />
                            {section.pdf_path ? "PDF attached" : "No PDF"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 tabular-nums">{section.display_order}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            section.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {section.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                        {formatDate(section.updated_at)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditSection(section)}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-100"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => void toggleActive(section)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-100"
                          >
                            {section.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Showing {filteredSections.length} of {sections.length} sections
          </div>
        </section>
      </main>

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
            className="my-auto max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <h2 id="editor-title" className="text-xl font-bold">
                  {editing ? "Edit menu section" : "Add menu section"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the section details and attach its files.
                </p>
              </div>
              <button
                onClick={() => setEditorOpen(false)}
                aria-label="Close editor"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-6">
              <label className="block text-sm font-medium">
                Section name *
                <input
                  className="mt-2"
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. Lunch Menu"
                />
              </label>

              <label className="block text-sm font-medium">
                Description
                <textarea
                  className="mt-2 min-h-24 resize-y"
                  maxLength={1000}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Optional description"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Display order
                  <input
                    className="mt-2"
                    type="number"
                    required
                    value={form.display_order}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        display_order: Number(event.target.value),
                      })
                    }
                  />
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    Lower numbers appear first.
                  </span>
                </label>

                <label className="flex items-center gap-3 self-start pt-2 text-sm font-medium">
                  <input
                    className="h-4 w-4"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      setForm({ ...form, is_active: event.target.checked })
                    }
                  />
                  Active on the menu
                </label>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <FileText size={18} />
                  Menu PDF
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {form.pdf_path
                    ? `Current file: ${form.pdf_path}`
                    : "No PDF attached yet."}
                </p>
                <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm hover:bg-slate-50">
                  <Upload size={17} />
                  <span className="min-w-0 flex-1 truncate">
                    {pdfFile ? pdfFile.name : "Choose a PDF file"}
                  </span>
                  <input
                    className="hidden"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(event) =>
                      setPdfFile(event.target.files?.[0] ?? null)
                    }
                  />
                </label>
              </div>

              {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  {saving ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Check size={17} />
                  )}
                  {saving ? "Saving…" : editing ? "Save changes" : "Create section"}
                  <ChevronDown size={14} className="opacity-60" />
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
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
