import { uploadStorageFile } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import type { MenuSection, SectionForm } from "../types/menu";

export async function fetchMenuSections(): Promise<MenuSection[]> {
  const { data, error } = await supabase
    .from("menu_sections")
    .select(
      "id,name,description,pdf_path,display_order,is_active,created_at,updated_at",
    )
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(
      `${error.message}. Check that your signed-in user has permission to read menu_sections.`,
    );
  }

  return (data ?? []) as MenuSection[];
}

export async function saveMenuSection(
  form: SectionForm,
  editingId?: string | null,
  pdfFile?: File | null,
): Promise<void> {
  let pdfPath = form.pdf_path;

  if (pdfFile) {
    if (
      pdfFile.type !== "application/pdf" &&
      !pdfFile.name.toLowerCase().endsWith(".pdf")
    ) {
      throw new Error("Please select a PDF file for the menu.");
    }
    pdfPath = await uploadStorageFile(pdfFile, "menus");
  }

  const trimmedName = form.name.trim();
  if (!trimmedName) {
    throw new Error("Enter a menu section name.");
  }

  const payload = {
    name: trimmedName,
    description: form.description.trim() || null,
    display_order: Number(form.display_order),
    is_active: form.is_active,
    pdf_path: pdfPath,
    updated_at: new Date().toISOString(),
  };

  const result = editingId
    ? await supabase.from("menu_sections").update(payload).eq("id", editingId)
    : await supabase.from("menu_sections").insert(payload);

  if (result.error) {
    throw new Error(
      `${result.error.message}. Check your menu_sections write permissions and Storage upload policies.`,
    );
  }
}

export async function toggleMenuSectionActive(
  section: MenuSection,
): Promise<boolean> {
  const nextStatus = !section.is_active;
  const { error } = await supabase
    .from("menu_sections")
    .update({
      is_active: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", section.id);

  if (error) {
    throw new Error(`${error.message}. Check your update permissions.`);
  }

  return nextStatus;
}
