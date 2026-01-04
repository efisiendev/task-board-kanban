-- Create task_assignees table for multiple assignees per task
-- This allows tasks to be assigned to multiple users

CREATE TABLE IF NOT EXISTS task_assignees (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  PRIMARY KEY (task_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id ON task_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_assigned_at ON task_assignees(assigned_at);

-- Enable RLS
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view task assignees if they can view the task
CREATE POLICY "Users can view task assignees for accessible tasks"
  ON task_assignees FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE EXISTS (
        SELECT 1 FROM boards
        WHERE boards.id = tasks.board_id
        AND (boards.user_id = auth.uid() OR is_board_member(tasks.board_id, auth.uid()))
      )
    )
  );

-- Policy: Board members can add assignees to tasks
CREATE POLICY "Board members can add task assignees"
  ON task_assignees FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM tasks
      WHERE EXISTS (
        SELECT 1 FROM boards
        WHERE boards.id = tasks.board_id
        AND (boards.user_id = auth.uid() OR is_board_member(tasks.board_id, auth.uid()))
      )
    )
  );

-- Policy: Board members can remove assignees from tasks
CREATE POLICY "Board members can remove task assignees"
  ON task_assignees FOR DELETE
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE EXISTS (
        SELECT 1 FROM boards
        WHERE boards.id = tasks.board_id
        AND (boards.user_id = auth.uid() OR is_board_member(tasks.board_id, auth.uid()))
      )
    )
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE task_assignees;
