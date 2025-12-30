-- ============================================
-- PHASE 1.4: KANBAN-STYLE SUBTASKS
-- ============================================
-- Upgrade task_checklist from simple checklist to mini Kanban board

-- Add status column to track subtask state (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_checklist' AND column_name = 'status') THEN
    ALTER TABLE task_checklist ADD COLUMN status VARCHAR(20) DEFAULT 'todo';
  END IF;
END $$;

-- Add task properties to subtasks (same as main tasks)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_checklist' AND column_name = 'priority') THEN
    ALTER TABLE task_checklist ADD COLUMN priority VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_checklist' AND column_name = 'assigned_to') THEN
    ALTER TABLE task_checklist ADD COLUMN assigned_to UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_checklist' AND column_name = 'due_date') THEN
    ALTER TABLE task_checklist ADD COLUMN due_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_checklist' AND column_name = 'labels') THEN
    ALTER TABLE task_checklist ADD COLUMN labels TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_checklist' AND column_name = 'estimated_time') THEN
    ALTER TABLE task_checklist ADD COLUMN estimated_time INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_checklist' AND column_name = 'actual_time') THEN
    ALTER TABLE task_checklist ADD COLUMN actual_time INTEGER;
  END IF;
END $$;

-- Update existing records to set status based on is_completed
UPDATE task_checklist
  SET status = CASE
    WHEN is_completed = true THEN 'done'
    ELSE 'todo'
  END;

-- Add NOT NULL constraint after setting default values
DO $$
BEGIN
  ALTER TABLE task_checklist ALTER COLUMN status SET NOT NULL;
EXCEPTION
  WHEN others THEN
    NULL; -- Ignore if already NOT NULL
END $$;

-- Add check constraint for valid status values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_checklist_status_check') THEN
    ALTER TABLE task_checklist
      ADD CONSTRAINT task_checklist_status_check
      CHECK (status IN ('todo', 'in_progress', 'done'));
  END IF;
END $$;

-- Add check constraint for valid priority values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_checklist_priority_check') THEN
    ALTER TABLE task_checklist
      ADD CONSTRAINT task_checklist_priority_check
      CHECK (priority IS NULL OR priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;
END $$;

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_task_checklist_status ON task_checklist(task_id, status);

-- Create index for ordering within status column
CREATE INDEX IF NOT EXISTS idx_task_checklist_status_order ON task_checklist(task_id, status, order_index);

-- Create indexes for new properties (for filtering/sorting)
CREATE INDEX IF NOT EXISTS idx_task_checklist_priority ON task_checklist(priority);
CREATE INDEX IF NOT EXISTS idx_task_checklist_assigned_to ON task_checklist(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_checklist_due_date ON task_checklist(due_date);

-- Note: We keep is_completed column for backward compatibility
-- It will be updated automatically based on status
-- status = 'done' → is_completed = true
-- status != 'done' → is_completed = false

-- Create trigger to sync is_completed with status
CREATE OR REPLACE FUNCTION sync_checklist_completed()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_completed := (NEW.status = 'done');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_checklist_completed_trigger ON task_checklist;
CREATE TRIGGER sync_checklist_completed_trigger
  BEFORE INSERT OR UPDATE OF status ON task_checklist
  FOR EACH ROW
  EXECUTE FUNCTION sync_checklist_completed();

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Task checklist upgraded to Kanban-style!';
  RAISE NOTICE 'Status column added: todo, in_progress, done';
  RAISE NOTICE 'Sync trigger created for is_completed field';
END $$;
