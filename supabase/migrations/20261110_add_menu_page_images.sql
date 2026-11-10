-- Migration: Add page_count, image_paths, and version columns to menu_sections
-- Run this in your Supabase SQL editor:

ALTER TABLE menu_sections
ADD COLUMN IF NOT EXISTS page_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_paths jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

COMMENT ON COLUMN menu_sections.page_count IS 'Total number of pages converted to WebP images';
COMMENT ON COLUMN menu_sections.image_paths IS 'Ordered list of Supabase Storage paths for each WebP page image';
COMMENT ON COLUMN menu_sections.version IS 'Version counter incremented on each PDF replacement';
