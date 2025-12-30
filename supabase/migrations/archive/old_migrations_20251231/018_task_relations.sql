-- Migration 018: Task Relations (Cross-referencing)
-- Enable tasks to link to each other with relationship types

CREATE TABLE IF NOT EXISTS task_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  to_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  relation_type VARCHAR(50) NOT NULL, -- blocks, blocked_by, relates_to, duplicates, duplicate_of
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate relations
  UNIQUE(from_task_id, to_task_id, relation_type),

  -- Prevent self-referencing
  CHECK (from_task_id != to_task_id)
);

-- Indexes for performance
CREATE INDEX idx_task_relations_from ON task_relations(from_task_id);
CREATE INDEX idx_task_relations_to ON task_relations(to_task_id);
CREATE INDEX idx_task_relations_type ON task_relations(relation_type);

-- Enable RLS
ALTER TABLE task_relations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can see relations if they have access to either task
CREATE POLICY "Users can view task relations"
  ON task_relations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN boards b ON t.board_id = b.id
      LEFT JOIN board_members bm ON b.id = bm.board_id
      WHERE t.id = task_relations.from_task_id
        AND (b.user_id = auth.uid() OR bm.user_id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN boards b ON t.board_id = b.id
      LEFT JOIN board_members bm ON b.id = bm.board_id
      WHERE t.id = task_relations.to_task_id
        AND (b.user_id = auth.uid() OR bm.user_id = auth.uid())
    )
  );

-- RLS Policy: Users can create relations if they have access to both tasks
CREATE POLICY "Users can create task relations"
  ON task_relations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN boards b ON t.board_id = b.id
      LEFT JOIN board_members bm ON b.id = bm.board_id
      WHERE t.id = task_relations.from_task_id
        AND (b.user_id = auth.uid() OR bm.user_id = auth.uid())
    )
    AND
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN boards b ON t.board_id = b.id
      LEFT JOIN board_members bm ON b.id = bm.board_id
      WHERE t.id = task_relations.to_task_id
        AND (b.user_id = auth.uid() OR bm.user_id = auth.uid())
    )
  );

-- RLS Policy: Users can delete relations they created or if they own the board
CREATE POLICY "Users can delete task relations"
  ON task_relations
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN boards b ON t.board_id = b.id
      WHERE t.id = task_relations.from_task_id
        AND b.user_id = auth.uid()
    )
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE task_relations;

-- Add helpful comment
COMMENT ON TABLE task_relations IS 'Cross-references between tasks (blocks, relates to, duplicates, etc)';
