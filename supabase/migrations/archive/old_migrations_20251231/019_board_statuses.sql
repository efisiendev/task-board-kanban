-- =============================================
-- Migration: Custom Board Statuses
-- Description: Allow each board to have customizable statuses
-- =============================================

-- 1. Create board_statuses table
CREATE TABLE board_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(50) NOT NULL DEFAULT 'gray', -- For UI styling
  order_index INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT false, -- Mark default statuses (to_do, in_progress, done)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, name), -- Prevent duplicate status names per board
  UNIQUE(board_id, order_index) -- Ensure unique ordering
);

-- 2. Add indexes for performance
CREATE INDEX idx_board_statuses_board_id ON board_statuses(board_id);
CREATE INDEX idx_board_statuses_order ON board_statuses(board_id, order_index);

-- 3. Enable RLS
ALTER TABLE board_statuses ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (same as tasks - must be board member)
CREATE POLICY "Board members can view statuses"
  ON board_statuses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = board_statuses.board_id
      AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Board owners and admins can insert statuses"
  ON board_statuses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = board_statuses.board_id
      AND board_members.user_id = auth.uid()
      AND board_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Board owners and admins can update statuses"
  ON board_statuses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = board_statuses.board_id
      AND board_members.user_id = auth.uid()
      AND board_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Board owners and admins can delete statuses"
  ON board_statuses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = board_statuses.board_id
      AND board_members.user_id = auth.uid()
      AND board_members.role IN ('owner', 'admin')
    )
  );

-- 5. Add status_id column to tasks table
ALTER TABLE tasks ADD COLUMN status_id UUID REFERENCES board_statuses(id) ON DELETE RESTRICT;

-- 6. Create function to auto-create default statuses for new boards
CREATE OR REPLACE FUNCTION create_default_board_statuses()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert 3 default statuses
  INSERT INTO board_statuses (board_id, name, color, order_index, is_default)
  VALUES
    (NEW.id, 'To Do', 'gray', 0, true),
    (NEW.id, 'In Progress', 'blue', 1, true),
    (NEW.id, 'Done', 'green', 2, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to auto-create default statuses
CREATE TRIGGER trigger_create_default_board_statuses
  AFTER INSERT ON boards
  FOR EACH ROW
  EXECUTE FUNCTION create_default_board_statuses();

-- 8. Migrate existing tasks to use status_id
-- First, create statuses for existing boards
INSERT INTO board_statuses (board_id, name, color, order_index, is_default)
SELECT DISTINCT
  board_id,
  CASE
    WHEN status = 'to_do' THEN 'To Do'
    WHEN status = 'in_progress' THEN 'In Progress'
    WHEN status = 'done' THEN 'Done'
  END as name,
  CASE
    WHEN status = 'to_do' THEN 'gray'
    WHEN status = 'in_progress' THEN 'blue'
    WHEN status = 'done' THEN 'green'
  END as color,
  CASE
    WHEN status = 'to_do' THEN 0
    WHEN status = 'in_progress' THEN 1
    WHEN status = 'done' THEN 2
  END as order_index,
  true as is_default
FROM tasks
WHERE board_id IN (SELECT id FROM boards)
ON CONFLICT (board_id, name) DO NOTHING;

-- Then, update tasks to reference the new status_id
UPDATE tasks t
SET status_id = bs.id
FROM board_statuses bs
WHERE t.board_id = bs.board_id
  AND (
    (t.status = 'to_do' AND bs.name = 'To Do')
    OR (t.status = 'in_progress' AND bs.name = 'In Progress')
    OR (t.status = 'done' AND bs.name = 'Done')
  );

-- 9. Make status_id NOT NULL (after data migration)
ALTER TABLE tasks ALTER COLUMN status_id SET NOT NULL;

-- 10. Drop old status column (keep for now as backup, will remove later)
-- ALTER TABLE tasks DROP COLUMN status;

-- 11. Enable Realtime for board_statuses
ALTER PUBLICATION supabase_realtime ADD TABLE board_statuses;

-- 12. Updated timestamp trigger
CREATE TRIGGER set_board_statuses_updated_at
  BEFORE UPDATE ON board_statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 13. Function to prevent deleting status if tasks exist
CREATE OR REPLACE FUNCTION prevent_delete_status_with_tasks()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM tasks WHERE status_id = OLD.id LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Cannot delete status with existing tasks. Please move or delete tasks first.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_status_has_no_tasks
  BEFORE DELETE ON board_statuses
  FOR EACH ROW
  EXECUTE FUNCTION prevent_delete_status_with_tasks();
