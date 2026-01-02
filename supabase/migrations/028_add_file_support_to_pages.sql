-- Migration 028: Add File Support to Board Pages
-- Allow board_pages to store files (images, PDFs, etc) in addition to folders and pages

-- Add file-related columns to board_pages
ALTER TABLE public.board_pages
  ADD COLUMN IF NOT EXISTS storage_path TEXT, -- Supabase Storage path for files
  ADD COLUMN IF NOT EXISTS mime_type TEXT,    -- MIME type (image/png, application/pdf, etc)
  ADD COLUMN IF NOT EXISTS file_size BIGINT;  -- File size in bytes

-- Update type check constraint to include 'file'
ALTER TABLE public.board_pages
  DROP CONSTRAINT IF EXISTS board_pages_type_check;

ALTER TABLE public.board_pages
  ADD CONSTRAINT board_pages_type_check
  CHECK (type IN ('folder', 'page', 'file'));

-- Add index for file types
CREATE INDEX IF NOT EXISTS idx_board_pages_type ON public.board_pages(type);
CREATE INDEX IF NOT EXISTS idx_board_pages_mime_type ON public.board_pages(mime_type)
  WHERE type = 'file';

-- Add constraint: files must have storage_path and mime_type
ALTER TABLE public.board_pages
  ADD CONSTRAINT board_pages_file_required_fields
  CHECK (
    (type = 'file' AND storage_path IS NOT NULL AND mime_type IS NOT NULL) OR
    (type != 'file')
  );

-- Add constraint: pages and folders should NOT have file fields
ALTER TABLE public.board_pages
  ADD CONSTRAINT board_pages_non_file_no_storage
  CHECK (
    (type IN ('folder', 'page') AND storage_path IS NULL AND mime_type IS NULL AND file_size IS NULL) OR
    (type = 'file')
  );

COMMENT ON COLUMN public.board_pages.storage_path IS 'Supabase Storage path for type=file items';
COMMENT ON COLUMN public.board_pages.mime_type IS 'MIME type for type=file items (e.g., image/png, application/pdf)';
COMMENT ON COLUMN public.board_pages.file_size IS 'File size in bytes for type=file items';
