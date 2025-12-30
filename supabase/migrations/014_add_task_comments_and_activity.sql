-- ============================================
-- PHASE 1.3: TASK COMMENTS & ACTIVITY LOG
-- ============================================
-- Add comments and activity tracking for tasks

-- ============================================
-- TABLE: task_comments
-- ============================================
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at DESC);

-- ============================================
-- TABLE: task_activity_log
-- ============================================
CREATE TABLE IF NOT EXISTS task_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- created, updated, moved, commented, assigned, etc
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_activity_task_id ON task_activity_log(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_user_id ON task_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_created_at ON task_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_activity_action ON task_activity_log(action);

-- ============================================
-- RLS POLICIES: task_comments
-- ============================================
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view comments for accessible tasks" ON task_comments;
CREATE POLICY "Users can view comments for accessible tasks"
  ON task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN boards ON tasks.board_id = boards.id
      WHERE tasks.id = task_comments.task_id
      AND (
        boards.user_id = auth.uid() OR
        boards.id IN (SELECT board_id FROM board_members WHERE user_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can add comments to accessible tasks" ON task_comments;
CREATE POLICY "Users can add comments to accessible tasks"
  ON task_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN boards ON tasks.board_id = boards.id
      WHERE tasks.id = task_comments.task_id
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

DROP POLICY IF EXISTS "Users can update own comments" ON task_comments;
CREATE POLICY "Users can update own comments"
  ON task_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON task_comments;
CREATE POLICY "Users can delete own comments"
  ON task_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: task_activity_log
-- ============================================
ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view activity for accessible tasks" ON task_activity_log;
CREATE POLICY "Users can view activity for accessible tasks"
  ON task_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN boards ON tasks.board_id = boards.id
      WHERE tasks.id = task_activity_log.task_id
      AND (
        boards.user_id = auth.uid() OR
        boards.id IN (SELECT board_id FROM board_members WHERE user_id = auth.uid())
      )
    )
  );

-- Activity log is insert-only (no updates/deletes) for audit trail
DROP POLICY IF EXISTS "System can insert activity logs" ON task_activity_log;
CREATE POLICY "System can insert activity logs"
  ON task_activity_log FOR INSERT
  WITH CHECK (true); -- Allow all inserts (will be controlled by application logic)

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for updated_at on comments
DROP TRIGGER IF EXISTS update_task_comments_updated_at ON task_comments;
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically log task creation
CREATE OR REPLACE FUNCTION log_task_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_activity_log (task_id, user_id, action, details)
  VALUES (
    NEW.id,
    NEW.created_by,
    'created',
    jsonb_build_object(
      'title', NEW.title,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_task_creation_trigger ON tasks;
CREATE TRIGGER log_task_creation_trigger
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_creation();

-- Function to automatically log task updates
CREATE OR REPLACE FUNCTION log_task_update()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB := '{}'::jsonb;
  current_user_id UUID;
BEGIN
  -- Get current user (may be null for system updates)
  current_user_id := auth.uid();

  -- Track what changed
  IF OLD.title != NEW.title THEN
    changes := changes || jsonb_build_object('title', jsonb_build_object('from', OLD.title, 'to', NEW.title));
  END IF;

  IF OLD.status != NEW.status THEN
    changes := changes || jsonb_build_object('status', jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;

  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    changes := changes || jsonb_build_object('priority', jsonb_build_object('from', OLD.priority, 'to', NEW.priority));
  END IF;

  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    changes := changes || jsonb_build_object('assigned_to', jsonb_build_object('from', OLD.assigned_to, 'to', NEW.assigned_to));
    -- Log assignment as separate action
    INSERT INTO task_activity_log (task_id, user_id, action, details)
    VALUES (NEW.id, current_user_id, 'assigned', jsonb_build_object('assigned_to', NEW.assigned_to));
  END IF;

  IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
    changes := changes || jsonb_build_object('due_date', jsonb_build_object('from', OLD.due_date, 'to', NEW.due_date));
  END IF;

  -- Only log if there were actual changes
  IF changes != '{}'::jsonb THEN
    INSERT INTO task_activity_log (task_id, user_id, action, details)
    VALUES (NEW.id, current_user_id, 'updated', changes);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_task_update_trigger ON tasks;
CREATE TRIGGER log_task_update_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_update();

-- Function to log comments
CREATE OR REPLACE FUNCTION log_task_comment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_activity_log (task_id, user_id, action, details)
  VALUES (
    NEW.task_id,
    NEW.user_id,
    'commented',
    jsonb_build_object('comment_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_task_comment_trigger ON task_comments;
CREATE TRIGGER log_task_comment_trigger
  AFTER INSERT ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION log_task_comment();

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE task_activity_log;

-- ============================================
-- VERIFY
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Task comments & activity log tables created!';
  RAISE NOTICE 'RLS policies enabled';
  RAISE NOTICE 'Auto-logging triggers created';
  RAISE NOTICE 'Realtime enabled';
END $$;
