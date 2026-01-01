-- Complete setup for task_pages table
-- This migration ensures task_pages schema matches TypeScript types
-- Combines all necessary schema changes and RLS policies

-- ============================================================================
-- STEP 1: Ensure table structure is correct
-- ============================================================================

-- Add title column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'task_pages' AND column_name = 'title'
    ) THEN
        ALTER TABLE task_pages ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Untitled';
    END IF;
END $$;

-- Add order_index if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'task_pages' AND column_name = 'order_index'
    ) THEN
        ALTER TABLE task_pages ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Change content from JSONB to TEXT if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'task_pages'
        AND column_name = 'content'
        AND data_type = 'jsonb'
    ) THEN
        -- Create temp column
        ALTER TABLE task_pages ADD COLUMN content_temp TEXT;

        -- Convert JSONB to TEXT
        UPDATE task_pages SET content_temp = content::text WHERE content IS NOT NULL;

        -- Drop old and rename
        ALTER TABLE task_pages DROP COLUMN content;
        ALTER TABLE task_pages RENAME COLUMN content_temp TO content;
    END IF;
END $$;

-- Remove content_type if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'task_pages' AND column_name = 'content_type'
    ) THEN
        ALTER TABLE task_pages DROP COLUMN content_type;
    END IF;
END $$;

-- Make created_by nullable
ALTER TABLE task_pages ALTER COLUMN created_by DROP NOT NULL;

-- Ensure proper defaults
ALTER TABLE task_pages ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE task_pages ALTER COLUMN updated_at SET DEFAULT NOW();

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_task_pages_task_id ON task_pages(task_id);
CREATE INDEX IF NOT EXISTS idx_task_pages_order ON task_pages(task_id, order_index);

-- ============================================================================
-- STEP 3: Setup RLS Policies (include board owners)
-- ============================================================================

-- Enable RLS
ALTER TABLE task_pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate
DROP POLICY IF EXISTS "Users can view pages of tasks in their boards" ON task_pages;
DROP POLICY IF EXISTS "Users can insert pages in tasks in their boards" ON task_pages;
DROP POLICY IF EXISTS "Users can update pages in tasks in their boards" ON task_pages;
DROP POLICY IF EXISTS "Users can delete pages in tasks in their boards" ON task_pages;

-- Recreate with board owner check
CREATE POLICY "Users can view pages of tasks in their boards"
  ON task_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN boards b ON b.id = t.board_id
      LEFT JOIN board_members bm ON bm.board_id = t.board_id AND bm.user_id = auth.uid()
      WHERE t.id = task_pages.task_id
        AND (b.user_id = auth.uid() OR bm.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert pages in tasks in their boards"
  ON task_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN boards b ON b.id = t.board_id
      LEFT JOIN board_members bm ON bm.board_id = t.board_id AND bm.user_id = auth.uid()
      WHERE t.id = task_pages.task_id
        AND (b.user_id = auth.uid() OR bm.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update pages in tasks in their boards"
  ON task_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN boards b ON b.id = t.board_id
      LEFT JOIN board_members bm ON bm.board_id = t.board_id AND bm.user_id = auth.uid()
      WHERE t.id = task_pages.task_id
        AND (b.user_id = auth.uid() OR bm.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete pages in tasks in their boards"
  ON task_pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN boards b ON b.id = t.board_id
      LEFT JOIN board_members bm ON bm.board_id = t.board_id AND bm.user_id = auth.uid()
      WHERE t.id = task_pages.task_id
        AND (b.user_id = auth.uid() OR bm.user_id = auth.uid())
    )
  );

-- ============================================================================
-- STEP 4: Triggers for auto-update timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_task_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_pages_updated_at ON task_pages;
CREATE TRIGGER task_pages_updated_at
  BEFORE UPDATE ON task_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_task_pages_updated_at();

-- ============================================================================
-- STEP 5: Grant permissions
-- ============================================================================

GRANT ALL ON task_pages TO authenticated;
GRANT ALL ON task_pages TO service_role;

-- ============================================================================
-- Done! Schema should now match TypeScript types
-- ============================================================================
