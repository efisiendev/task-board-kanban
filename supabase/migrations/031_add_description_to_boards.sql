-- Migration 031: Add Description Field to Boards
-- Store project knowledge/documentation in boards

-- Add description column to boards table
ALTER TABLE public.boards
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Add index for full-text search on description (optional)
CREATE INDEX IF NOT EXISTS idx_boards_description ON public.boards
  USING gin(to_tsvector('english', description));

COMMENT ON COLUMN public.boards.description IS 'Project knowledge/documentation/description';
