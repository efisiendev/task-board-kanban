-- Migration: Add task_pages for Notion-like pages feature
-- Each task can have multiple rich text pages/documents

CREATE TABLE IF NOT EXISTS task_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT, -- Rich text content (HTML or JSON)
  content_type VARCHAR(20) DEFAULT 'html', -- 'html' or 'json'
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_task_pages_task_id ON task_pages(task_id);
CREATE INDEX idx_task_pages_order ON task_pages(task_id, order_index);

-- Enable Row Level Security
ALTER TABLE task_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Same as tasks - can access if you're a member of the board
CREATE POLICY "Users can view pages of tasks in their boards"
  ON task_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN board_members bm ON bm.board_id = t.board_id
      WHERE t.id = task_pages.task_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pages in tasks in their boards"
  ON task_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN board_members bm ON bm.board_id = t.board_id
      WHERE t.id = task_pages.task_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pages in tasks in their boards"
  ON task_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN board_members bm ON bm.board_id = t.board_id
      WHERE t.id = task_pages.task_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pages in tasks in their boards"
  ON task_pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN board_members bm ON bm.board_id = t.board_id
      WHERE t.id = task_pages.task_id
        AND bm.user_id = auth.uid()
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER task_pages_updated_at
  BEFORE UPDATE ON task_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_task_pages_updated_at();
