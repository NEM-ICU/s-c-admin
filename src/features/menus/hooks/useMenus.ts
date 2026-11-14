import { useCallback, useMemo, useState, type FormEvent } from "react";
import {
  deleteMenuCategory,
  fetchMenuSections,
  saveMenuSection,
  toggleMenuSectionActive,
} from "../services/menuService";
import {
  emptyMenuForm,
  type ConversionProgress,
  type MenuSection,
  type SectionForm,
} from "../types/menu";

type UseMenusProps = {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export function useMenus({ onSuccess, onError }: UseMenusProps) {
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Conversion & upload progress state
  const [conversionProgress, setConversionProgress] =
    useState<ConversionProgress | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);

  // Modal editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<MenuSection | null>(
    null,
  );
  const [form, setForm] = useState<SectionForm>(emptyMenuForm);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");

  const loadSections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMenuSections();
      setSections(data);
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Failed to load menu sections.",
      );
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  const openNewSection = useCallback(() => {
    setEditingSection(null);
    setForm({
      ...emptyMenuForm,
      display_order:
        sections.length > 0
          ? Math.max(...sections.map((section) => section.display_order)) + 1
          : 0,
    });
    setPdfFile(null);
    setFormError("");
    setConversionProgress(null);
    setEditorOpen(true);
  }, [sections]);

  const openEditSection = useCallback((section: MenuSection) => {
    setEditingSection(section);
    setForm({
      name: section.name,
      description: section.description ?? "",
      display_order: section.display_order,
      is_active: section.is_active,
      pdf_path: section.pdf_path,
      image_paths: section.image_paths ?? [],
      page_count: section.page_count ?? 0,
    });
    setPdfFile(null);
    setFormError("");
    setConversionProgress(null);
    setEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    if (saving) return; // Disallow closing while converting/uploading
    setEditorOpen(false);
    setEditingSection(null);
    setPdfFile(null);
    setFormError("");
    setConversionProgress(null);
  }, [saving]);

  const handleSave = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSaving(true);
      setFormError("");
      setConversionProgress(null);

      try {
        await saveMenuSection(
          form,
          editingSection,
          pdfFile,
          setConversionProgress,
        );
        setEditorOpen(false);
        onSuccess(
          editingSection
            ? `Menu section "${form.name}" updated successfully.`
            : `Menu section "${form.name}" created successfully.`,
        );
        await loadSections();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unable to save menu section.";
        setFormError(msg);
      } finally {
        setSaving(false);
        setConversionProgress(null);
      }
    },
    [form, editingSection, pdfFile, loadSections, onSuccess],
  );

  const handleDeleteSection = useCallback(
    async (section: MenuSection) => {
      const confirmed = window.confirm(
        `Are you sure you want to permanently delete "${section.name}"?\n\nThis will remove its database record, original PDF, and all generated WebP page images.\n\nThis action cannot be undone.`,
      );
      if (!confirmed) return;

      setDeletingId(section.id);
      try {
        const { storageDeletedCount, warnings } =
          await deleteMenuCategory(section);

        if (warnings.length > 0) {
          onError(
            `Deleted category "${section.name}", but encountered storage warnings: ${warnings.join(", ")}`,
          );
        } else {
          onSuccess(
            `Permanently deleted category "${section.name}" (${storageDeletedCount} storage file(s) removed).`,
          );
        }

        await loadSections();
      } catch (err) {
        onError(
          err instanceof Error
            ? err.message
            : "Failed to delete menu category.",
        );
      } finally {
        setDeletingId(null);
      }
    },
    [loadSections, onSuccess, onError],
  );

  const handleToggleActive = useCallback(
    async (section: MenuSection) => {
      try {
        const nextActive = await toggleMenuSectionActive(section);
        onSuccess(
          `${section.name} is now ${nextActive ? "active" : "inactive"}.`,
        );
        await loadSections();
      } catch (err) {
        onError(
          err instanceof Error
            ? err.message
            : "Failed to change section status.",
        );
      }
    },
    [loadSections, onSuccess, onError],
  );

  const filteredSections = useMemo(() => {
    return sections.filter((section) => {
      const matchesSearch = `${section.name} ${section.description ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesSearch && (showInactive || section.is_active);
    });
  }, [sections, search, showInactive]);

  return {
    sections,
    filteredSections,
    loading,
    saving,
    deletingId,
    conversionProgress,
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
    handleDeleteSection,
    handleToggleActive,
  };
}
