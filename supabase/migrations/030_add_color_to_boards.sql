-- Migration 030: Add Color Field to Boards
-- Allow boards to have customizable colors for visual distinction

-- Add color column to boards table
ALTER TABLE public.boards
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6'; -- Default blue

-- Add constraint for valid hex colors
ALTER TABLE public.boards
  ADD CONSTRAINT boards_color_check
  CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

-- Create index for color (optional, for filtering by color later)
CREATE INDEX IF NOT EXISTS idx_boards_color ON public.boards(color);

COMMENT ON COLUMN public.boards.color IS 'Board color in hex format (#RRGGBB) for visual distinction';
