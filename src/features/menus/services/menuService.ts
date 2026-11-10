import { convertPdfToPngPages } from "@/lib/pdfConverter";
import {
  deleteMenuCategoryStorage,
  removeStorageFiles,
  uploadStorageFile,
} from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { safeFilename } from "@/lib/utils";
import type {
  ConversionProgress,
  MenuSection,
  SectionForm,
} from "../types/menu";

export async function fetchMenuSections(): Promise<MenuSection[]> {
  const { data, error } = await supabase
    .from("menu_sections")
    .select(
      "id,name,description,pdf_path,image_paths,page_count,version,display_order,is_active,created_at,updated_at",
    )
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(
      `${error.message}. Check that your signed-in user has permission to read menu_sections.`,
    );
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    pdf_path: row.pdf_path,
    image_paths: Array.isArray(row.image_paths) ? row.image_paths : [],
    page_count: typeof row.page_count === "number" ? row.page_count : 0,
    version: typeof row.version === "number" ? row.version : 1,
    display_order: row.display_order,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })) as MenuSection[];
}

export async function saveMenuSection(
  form: SectionForm,
  editingSection?: MenuSection | null,
  pdfFile?: File | null,
  onProgress?: (progress: ConversionProgress) => void,
): Promise<void> {
  const trimmedName = form.name.trim();
  if (!trimmedName) {
    throw new Error("Enter a menu section name.");
  }

  // Case 1: A new PDF was uploaded. Must convert to WebP, upload versioned, and safely replace.
  if (pdfFile) {
    const sectionId = editingSection?.id ?? crypto.randomUUID();
    const nextVersion = (editingSection?.version ?? 0) + 1;
    const versionTag = `v${nextVersion}-${Date.now()}`;
    const versionFolder = `menus/${sectionId}/${versionTag}`;

    // 1. Convert all pages sequentially to PNG images
    const { pageCount, pages } = await convertPdfToPngPages(
    pdfFile,
    onProgress,
  );

    // Track newly uploaded paths for automatic rollback on failure
    const newlyUploadedPaths: string[] = [];

    try {
      // 2. Upload original PDF into versioned folder
      const originalPdfPath = `${versionFolder}/original-${safeFilename(pdfFile.name)}`;
      onProgress?.({
        stage: "uploading",
        current: 0,
        total: pageCount + 1,
        message: "Uploading original PDF…",
      });

      await uploadStorageFile(pdfFile, "menus", originalPdfPath);
      newlyUploadedPaths.push(originalPdfPath);

      // 3. Upload every generated WebP page sequentially
      const imagePaths: string[] = [];
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        onProgress?.({
          stage: "uploading",
          current: i + 1,
          total: pageCount + 1,
          message: `Uploading PNG page ${page.pageNumber} of ${pageCount}…`,
        });

        const pagePath = `${versionFolder}/page-${page.pageNumber}.png`;
        await uploadStorageFile(page.file, "menus", pagePath);
        newlyUploadedPaths.push(pagePath);
        imagePaths.push(pagePath);
      }

      // 4. Publish to database atomically
      onProgress?.({
        stage: "publishing",
        current: pageCount + 1,
        total: pageCount + 1,
        message: "Publishing menu section…",
      });

      const payload = {
        name: trimmedName,
        description: form.description.trim() || null,
        display_order: Number(form.display_order),
        is_active: form.is_active,
        pdf_path: originalPdfPath,
        image_paths: imagePaths,
        page_count: pageCount,
        version: nextVersion,
        updated_at: new Date().toISOString(),
      };

      const result = editingSection
        ? await supabase
            .from("menu_sections")
            .update(payload)
            .eq("id", editingSection.id)
        : await supabase.from("menu_sections").insert({
            id: sectionId,
            ...payload,
          });

      if (result.error) {
        throw new Error(
          `${result.error.message}. Check your menu_sections write permissions and Storage upload policies.`,
        );
      }

      // 5. Clean up old files only after successful database publication
      if (editingSection) {
        const oldPathsToClean = [
          editingSection.pdf_path,
          ...(editingSection.image_paths ?? []),
        ].filter(
          (p): p is string =>
            typeof p === "string" &&
            p.length > 0 &&
            !newlyUploadedPaths.includes(p),
        );

        if (oldPathsToClean.length > 0) {
          removeStorageFiles(oldPathsToClean).catch((cleanupErr) => {
            console.warn(
              "Notice: Old version cleanup was deferred:",
              cleanupErr,
            );
          });
        }
      }
    } catch (uploadError) {
      // Rollback: safely remove newly uploaded version files so storage is not polluted
      if (newlyUploadedPaths.length > 0) {
        await removeStorageFiles(newlyUploadedPaths).catch((rbErr) => {
          console.warn("Rollback removal error:", rbErr);
        });
      }
      throw uploadError;
    }

    return;
  }

  // Case 2: No new PDF provided (updating metadata like title, order, or active state)
  const payload = {
    name: trimmedName,
    description: form.description.trim() || null,
    display_order: Number(form.display_order),
    is_active: form.is_active,
    updated_at: new Date().toISOString(),
  };

  const result = editingSection
    ? await supabase
        .from("menu_sections")
        .update(payload)
        .eq("id", editingSection.id)
    : await supabase.from("menu_sections").insert(payload);

  if (result.error) {
    throw new Error(
      `${result.error.message}. Check your menu_sections write permissions.`,
    );
  }
}

export async function deleteMenuCategory(
  section: MenuSection,
): Promise<{ storageDeletedCount: number; warnings: string[] }> {
  const warnings: string[] = [];

  // 1. Delete all storage files associated with this category
  const { deleted, errors } = await deleteMenuCategoryStorage(section.id, [
    section.pdf_path,
    ...(section.image_paths ?? []),
  ]);

  if (errors.length > 0) {
    warnings.push(...errors);
  }

  // 2. Delete database record
  const { error: dbError } = await supabase
    .from("menu_sections")
    .delete()
    .eq("id", section.id);

  if (dbError) {
    throw new Error(
      `Database deletion failed: ${dbError.message}. Some storage files may have been removed.`,
    );
  }

  return {
    storageDeletedCount: deleted.length,
    warnings,
  };
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
