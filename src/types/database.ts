export type MediaType = "image" | "gif" | "video";

export type MenuSection = {
  id: string;
  name: string;
  description: string | null;
  pdf_path: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Screensaver = {
  id: string;
  name: string;
  storage_path: string;
  media_type: MediaType;
  is_active: boolean;
  created_at: string;
};

export type AppSetting = {
  id: number;
  wallpaper_path: string | null;
  updated_at?: string;
};
