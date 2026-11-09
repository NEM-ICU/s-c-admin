import { useCallback, useMemo, useState, type FormEvent } from "react";
import {
  fetchMenuSections,
  saveMenuSection,
  toggleMenuSectionActive,
} from "../services/menuService";
import {
  emptyMenuForm,
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
    });
    setPdfFile(null);
    setFormError("");
    setEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingSection(null);
    setPdfFile(null);
    setFormError("");
  }, []);

  const handleSave = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSaving(true);
      setFormError("");

      try {
        await saveMenuSection(form, editingSection?.id, pdfFile);
        setEditorOpen(false);
        onSuccess(
          editingSection ? "Menu section updated." : "Menu section created.",
        );
        await loadSections();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unable to save menu section.";
        setFormError(msg);
      } finally {
        setSaving(false);
      }
    },
    [form, editingSection, pdfFile, loadSections, onSuccess],
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
  };
}
