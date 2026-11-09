"use client";

import AppLayout from "@/components/layout/AppLayout";
import Header from "@/components/layout/Header";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import NotificationBanner from "@/components/ui/NotificationBanner";
import LoginForm from "@/features/auth/components/LoginForm";
import { useAuth } from "@/features/auth/hooks/useAuth";
import MenuEditorModal from "@/features/menus/components/MenuEditorModal";
import MenuList from "@/features/menus/components/MenuList";
import MenuStats from "@/features/menus/components/MenuStats";
import { useMenus } from "@/features/menus/hooks/useMenus";
import ScreensaverSection from "@/features/screensavers/components/ScreensaverSection";
import { useScreensavers } from "@/features/screensavers/hooks/useScreensavers";
import WallpaperSection from "@/features/wallpapers/components/WallpaperSection";
import { useWallpaper } from "@/features/wallpapers/hooks/useWallpaper";
import type { NotificationState } from "@/types/common";
import { useCallback, useEffect, useState } from "react";

export default function DashboardPage() {
  const { session, authLoading, authError, signIn, signOut } = useAuth();

  const [notification, setNotification] = useState<NotificationState>(null);

  const notifySuccess = useCallback((message: string) => {
    setNotification({ type: "success", message });
  }, []);

  const notifyError = useCallback((message: string) => {
    setNotification({ type: "error", message });
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const {
    wallpaperPath,
    wallpaperFile,
    setWallpaperFile,
    savingWallpaper,
    loadWallpaper,
    saveWallpaper,
  } = useWallpaper({
    onSuccess: notifySuccess,
    onError: notifyError,
  });

  const {
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
  } = useScreensavers({
    onSuccess: notifySuccess,
    onError: notifyError,
  });

  const {
    sections,
    filteredSections,
    loading: menusLoading,
    saving: menusSaving,
    search,
    setSearch,
    showInactive,
    setShowInactive,
    editorOpen,
    editingSection,
    form,
    setForm,
    pdfFile,
    setPdfFile,
    formError,
    loadSections,
    openNewSection,
    openEditSection,
    closeEditor,
    handleSave,
    handleToggleActive,
  } = useMenus({
    onSuccess: notifySuccess,
    onError: notifyError,
  });

  useEffect(() => {
    if (session) {
      void loadWallpaper();
      void loadScreensavers();
      void loadSections();
    }
  }, [session, loadWallpaper, loadScreensavers, loadSections]);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingSpinner label="Loading admin…" />
      </main>
    );
  }

  if (!session) {
    return <LoginForm onSignIn={signIn} error={authError} />;
  }

  return (
    <AppLayout userEmail={session.user.email} onSignOut={() => void signOut()}>
      <Header onAddSection={openNewSection} />

      <WallpaperSection
        wallpaperPath={wallpaperPath}
        wallpaperFile={wallpaperFile}
        saving={savingWallpaper}
        onFileSelect={setWallpaperFile}
        onSave={() => void saveWallpaper()}
      />

      <ScreensaverSection
        screensavers={screensavers}
        screensaverUrls={screensaverUrls}
        screensaverFile={screensaverFile}
        savingScreensaver={savingScreensaver}
        actionId={screensaverActionId}
        onFileSelect={setScreensaverFile}
        onUpload={() => void handleUpload()}
        onRefresh={() => void loadScreensavers()}
        onToggle={(item) => void handleToggle(item)}
        onDelete={(item) => void handleDelete(item)}
      />

      <MenuStats sections={sections} />

      {notification && (
        <div className="mt-8">
          <NotificationBanner
            notification={notification}
            onDismiss={dismissNotification}
          />
        </div>
      )}

      <MenuList
        sections={sections}
        filteredSections={filteredSections}
        loading={menusLoading}
        search={search}
        showInactive={showInactive}
        onSearchChange={setSearch}
        onShowInactiveChange={setShowInactive}
        onRefresh={() => void loadSections()}
        onAddNew={openNewSection}
        onEdit={openEditSection}
        onToggleActive={(section) => void handleToggleActive(section)}
      />

      <MenuEditorModal
        isOpen={editorOpen}
        editingSection={editingSection}
        form={form}
        pdfFile={pdfFile}
        saving={menusSaving}
        error={formError}
        onFormChange={setForm}
        onPdfSelect={setPdfFile}
        onSubmit={(e) => void handleSave(e)}
        onClose={closeEditor}
      />
    </AppLayout>
  );
}
