-- ============================================================================
-- Migration 004: Board Pages (Knowledge Base / Documentation)
-- ============================================================================
-- Description:
--   Add pages/documentation feature to boards, similar to Notion workspace pages.
--   Users can create folders and pages within each board for documentation,
--   meeting notes, resources, etc.
-- ============================================================================

-- Create board_pages table
CREATE TABLE IF NOT EXISTS public.board_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.board_pages(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT, -- Markdown content

  -- Type: 'folder' or 'page'
  type TEXT NOT NULL DEFAULT 'page' CHECK (type IN ('folder', 'page')),

  -- Order for sorting (within same parent)
  position INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_board_pages_board_id ON public.board_pages(board_id);
CREATE INDEX idx_board_pages_parent_id ON public.board_pages(parent_id);
CREATE INDEX idx_board_pages_type ON public.board_pages(type);
CREATE INDEX idx_board_pages_position ON public.board_pages(board_id, parent_id, position);

-- Enable Row Level Security
ALTER TABLE public.board_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can manage pages in boards they have access to
-- Policy 1: Users can view pages in boards they're members of
CREATE POLICY "Users can view pages in their boards"
  ON public.board_pages FOR SELECT
  USING (
    board_id IN (
      SELECT b.id FROM public.boards b
      LEFT JOIN public.board_members bm ON b.id = bm.board_id
      WHERE b.user_id = auth.uid() OR bm.user_id = auth.uid()
    )
  );

-- Policy 2: Users can create pages in boards they're members of
CREATE POLICY "Users can create pages in their boards"
  ON public.board_pages FOR INSERT
  WITH CHECK (
    board_id IN (
      SELECT b.id FROM public.boards b
      LEFT JOIN public.board_members bm ON b.id = bm.board_id
      WHERE b.user_id = auth.uid() OR bm.user_id = auth.uid()
    )
  );

-- Policy 3: Users can update pages in boards they're members of
CREATE POLICY "Users can update pages in their boards"
  ON public.board_pages FOR UPDATE
  USING (
    board_id IN (
      SELECT b.id FROM public.boards b
      LEFT JOIN public.board_members bm ON b.id = bm.board_id
      WHERE b.user_id = auth.uid() OR bm.user_id = auth.uid()
    )
  );

-- Policy 4: Users can delete pages in boards they're members of
CREATE POLICY "Users can delete pages in their boards"
  ON public.board_pages FOR DELETE
  USING (
    board_id IN (
      SELECT b.id FROM public.boards b
      LEFT JOIN public.board_members bm ON b.id = bm.board_id
      WHERE b.user_id = auth.uid() OR bm.user_id = auth.uid()
    )
  );

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_board_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_board_pages_updated_at
  BEFORE UPDATE ON public.board_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_board_pages_updated_at();

-- Enable Realtime for live collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_pages;

-- Grant permissions
GRANT ALL ON public.board_pages TO authenticated;
GRANT ALL ON public.board_pages TO service_role;
