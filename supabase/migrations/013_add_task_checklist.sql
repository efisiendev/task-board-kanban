-- ============================================
-- PHASE 1.1: TASK CHECKLIST
-- ============================================
-- Add checklist items functionality to tasks

CREATE TABLE IF NOT EXISTS task_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(500) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  order_index DECIMAL(10,5) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_checklist_task_id ON task_checklist(task_id);
CREATE INDEX IF NOT EXISTS idx_task_checklist_order ON task_checklist(task_id, order_index);

-- Enable RLS
ALTER TABLE task_checklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can manage checklist items for tasks they can access
DROP POLICY IF EXISTS "Users can view checklist items for accessible tasks" ON task_checklist;
CREATE POLICY "Users can view checklist items for accessible tasks"
  ON task_checklist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN boards ON tasks.board_id = boards.id
      WHERE tasks.id = task_checklist.task_id
      AND (
        boards.user_id = auth.uid() OR
        boards.id IN (SELECT board_id FROM board_members WHERE user_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert checklist items for accessible tasks" ON task_checklist;
CREATE POLICY "Users can insert checklist items for accessible tasks"
  ON task_checklist FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN boards ON tasks.board_id = boards.id
      WHERE tasks.id = task_checklist.task_id
      AND (
        boards.user_id = auth.uid() OR
        boards.id IN (
          SELECT board_id FROM board_members
          WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin', 'member')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can update checklist items for accessible tasks" ON task_checklist;
CREATE POLICY "Users can update checklist items for accessible tasks"
  ON task_checklist FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN boards ON tasks.board_id = boards.id
      WHERE tasks.id = task_checklist.task_id
      AND (
        boards.user_id = auth.uid() OR
        boards.id IN (
          SELECT board_id FROM board_members
          WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin', 'member')
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN boards ON tasks.board_id = boards.id
      WHERE tasks.id = task_checklist.task_id
      AND (
        boards.user_id = auth.uid() OR
        boards.id IN (
          SELECT board_id FROM board_members
          WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin', 'member')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete checklist items for accessible tasks" ON task_checklist;
CREATE POLICY "Users can delete checklist items for accessible tasks"
  ON task_checklist FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN boards ON tasks.board_id = boards.id
      WHERE tasks.id = task_checklist.task_id
      AND (
        boards.user_id = auth.uid() OR
        boards.id IN (
          SELECT board_id FROM board_members
          WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin', 'member')
        )
      )
    )
  );

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_task_checklist_updated_at ON task_checklist;
CREATE TRIGGER update_task_checklist_updated_at
  BEFORE UPDATE ON task_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE task_checklist;

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Task checklist table created successfully!';
  RAISE NOTICE 'RLS policies enabled';
  RAISE NOTICE 'Realtime enabled';
END $$;
