-- ============================================
-- MIGRATION 016: UNIFIED HIERARCHICAL TASKS
-- ============================================
-- Migrate from dual system (tasks + task_checklist) to unified system
-- where subtasks are also tasks with parent_task_id

-- ============================================
-- STEP 1: Add parent_task_id to tasks table
-- ============================================

-- Add parent_task_id column (self-referencing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'tasks' AND column_name = 'parent_task_id') THEN
    ALTER TABLE tasks ADD COLUMN parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add is_checklist_item hint for UI (optional)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'tasks' AND column_name = 'is_checklist_item') THEN
    ALTER TABLE tasks ADD COLUMN is_checklist_item BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add depth level for easier querying (optional)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'tasks' AND column_name = 'depth_level') THEN
    ALTER TABLE tasks ADD COLUMN depth_level INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_order ON tasks(parent_task_id, order_index);
CREATE INDEX IF NOT EXISTS idx_tasks_board_parent ON tasks(board_id, parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_depth ON tasks(depth_level);

-- ============================================
-- STEP 2: Migrate data from task_checklist
-- ============================================

-- Migrate all checklist items to tasks table
INSERT INTO tasks (
  id,
  board_id,
  title,
  description,
  status,
  order_index,
  parent_task_id,
  is_checklist_item,
  depth_level,
  -- Properties from checklist
  priority,
  assigned_to,
  due_date,
  start_date,
  labels,
  estimated_time,
  actual_time,
  created_by,
  created_at,
  updated_at
)
SELECT
  tc.id,
  t.board_id,
  tc.title,
  NULL as description, -- Checklist items don't have description
  tc.status, -- 'todo', 'in_progress', 'done' (compatible!)
  tc.order_index,
  tc.task_id as parent_task_id, -- Link to parent task
  TRUE as is_checklist_item, -- Mark as checklist for UI
  1 as depth_level, -- Subtasks are level 1
  -- Properties
  tc.priority,
  tc.assigned_to,
  tc.due_date,
  NULL as start_date,
  tc.labels,
  tc.estimated_time,
  tc.actual_time,
  NULL as created_by,
  tc.created_at,
  tc.updated_at
FROM task_checklist tc
JOIN tasks t ON tc.task_id = t.id
WHERE NOT EXISTS (
  -- Prevent duplicate migration if run multiple times
  SELECT 1 FROM tasks WHERE id = tc.id
);

-- ============================================
-- STEP 3: Update RLS policies for subtasks
-- ============================================

-- Subtasks inherit permissions from parent task's board
-- Users can access subtasks if they can access the parent task's board

-- Drop old policies if exist
DROP POLICY IF EXISTS "Users can view subtasks of their boards" ON tasks;
DROP POLICY IF EXISTS "Users can create subtasks in their boards" ON tasks;
DROP POLICY IF EXISTS "Users can update subtasks in their boards" ON tasks;
DROP POLICY IF EXISTS "Users can delete subtasks in their boards" ON tasks;

-- Recreate policies to handle both main tasks and subtasks
DROP POLICY IF EXISTS "Users can view tasks in their boards" ON tasks;
CREATE POLICY "Users can view tasks in their boards" ON tasks
  FOR SELECT
  USING (
    -- User is member of the board
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = tasks.board_id
      AND board_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create tasks in their boards" ON tasks;
CREATE POLICY "Users can create tasks in their boards" ON tasks
  FOR INSERT
  WITH CHECK (
    -- User is member of the board
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = tasks.board_id
      AND board_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update tasks in their boards" ON tasks;
CREATE POLICY "Users can update tasks in their boards" ON tasks
  FOR UPDATE
  USING (
    -- User is member of the board
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = tasks.board_id
      AND board_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete tasks in their boards" ON tasks;
CREATE POLICY "Users can delete tasks in their boards" ON tasks
  FOR DELETE
  USING (
    -- User is member of the board
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = tasks.board_id
      AND board_members.user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 4: Create helper function for recursive queries
-- ============================================

-- Function to get task with all descendants
CREATE OR REPLACE FUNCTION get_task_tree(task_uuid UUID)
RETURNS TABLE (
  id UUID,
  parent_task_id UUID,
  title VARCHAR,
  status VARCHAR,
  depth_level INTEGER,
  order_index DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE task_tree AS (
    -- Base case: the task itself
    SELECT
      t.id,
      t.parent_task_id,
      t.title,
      t.status,
      t.depth_level,
      t.order_index,
      0 as current_depth
    FROM tasks t
    WHERE t.id = task_uuid

    UNION ALL

    -- Recursive case: all children
    SELECT
      t.id,
      t.parent_task_id,
      t.title,
      t.status,
      t.depth_level,
      t.order_index,
      tt.current_depth + 1
    FROM tasks t
    JOIN task_tree tt ON t.parent_task_id = tt.id
  )
  SELECT
    task_tree.id,
    task_tree.parent_task_id,
    task_tree.title,
    task_tree.status,
    task_tree.depth_level,
    task_tree.order_index
  FROM task_tree
  ORDER BY current_depth, order_index;
END;
$$ LANGUAGE plpgsql;

-- Function to get all root tasks (no parent) for a board
CREATE OR REPLACE FUNCTION get_root_tasks(board_uuid UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  status VARCHAR,
  order_index DECIMAL,
  has_subtasks BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.status,
    t.order_index,
    EXISTS(SELECT 1 FROM tasks st WHERE st.parent_task_id = t.id) as has_subtasks
  FROM tasks t
  WHERE t.board_id = board_uuid
    AND t.parent_task_id IS NULL
  ORDER BY t.order_index;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 5: Create trigger to update depth_level
-- ============================================

CREATE OR REPLACE FUNCTION update_task_depth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_task_id IS NULL THEN
    -- Root task, depth = 0
    NEW.depth_level := 0;
  ELSE
    -- Get parent's depth and add 1
    SELECT depth_level + 1 INTO NEW.depth_level
    FROM tasks
    WHERE id = NEW.parent_task_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_task_depth ON tasks;
CREATE TRIGGER trigger_update_task_depth
  BEFORE INSERT OR UPDATE OF parent_task_id ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_depth();

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  checklist_count INTEGER;
  migrated_count INTEGER;
BEGIN
  -- Count original checklist items
  SELECT COUNT(*) INTO checklist_count FROM task_checklist;

  -- Count migrated items (is_checklist_item = true)
  SELECT COUNT(*) INTO migrated_count FROM tasks WHERE is_checklist_item = TRUE;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION 016 COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Original checklist items: %', checklist_count;
  RAISE NOTICE 'Migrated to tasks: %', migrated_count;
  RAISE NOTICE 'parent_task_id column: ADDED';
  RAISE NOTICE 'Indexes created: 4';
  RAISE NOTICE 'Helper functions: 2';
  RAISE NOTICE 'RLS policies: UPDATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next: Update UI to use unified system';
  RAISE NOTICE 'Note: task_checklist table NOT dropped yet (backup)';
  RAISE NOTICE '========================================';
END $$;
