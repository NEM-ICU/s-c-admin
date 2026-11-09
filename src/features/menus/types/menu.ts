import type { MenuSection } from "@/types/database";

export type { MenuSection };

export type SectionForm = {
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
  pdf_path: string | null;
};

export const emptyMenuForm: SectionForm = {
  name: "",
  description: "",
  display_order: 0,
  is_active: true,
  pdf_path: null,
};
