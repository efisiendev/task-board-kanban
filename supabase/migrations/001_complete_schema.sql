-- ============================================================================
-- TaskFlow - Complete Database Schema
-- ============================================================================
-- Description: Consolidated migration containing all schema definitions
-- Version: 1.0
-- Created: 2024-12-31
-- Consolidates: Previous migrations 001-019
--
-- Features:
-- - User profiles with employee numbers
-- - Boards with custom statuses
-- - Hierarchical tasks (tasks + subtasks)
-- - Task relations (blocks, duplicates, etc)
-- - Task comments and activity logging
-- - Task pages (Notion-style content)
-- - Board members with roles
-- - Row Level Security (RLS)
-- - Realtime subscriptions
-- ============================================================================

-- ============================================================================
-- PART 1: EXTENSIONS & HELPER FUNCTIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Check if user is board member
CREATE OR REPLACE FUNCTION is_board_member(board_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM board_members
    WHERE board_id = board_uuid
    AND user_id = user_uuid
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function: Check if user is board owner/admin
CREATE OR REPLACE FUNCTION is_board_admin(board_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM board_members
    WHERE board_id = board_uuid
    AND user_id = user_uuid
    AND role IN ('owner', 'admin')
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 2: CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- User Profiles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(100),
  full_name VARCHAR(255),
  avatar_url TEXT,
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_number ON user_profiles(employee_number);

-- Trigger: Update updated_at
CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Boards
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boards_created_by ON boards(created_by);

-- Trigger: Update updated_at
CREATE TRIGGER trigger_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Board Statuses (Custom statuses per board)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS board_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL, -- Hex color code
  order_index INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(board_id, name),
  UNIQUE(board_id, order_index),
  CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE INDEX IF NOT EXISTS idx_board_statuses_board_id ON board_statuses(board_id);
CREATE INDEX IF NOT EXISTS idx_board_statuses_board_default ON board_statuses(board_id, is_default);

-- Trigger: Update updated_at
CREATE TRIGGER trigger_board_statuses_updated_at
  BEFORE UPDATE ON board_statuses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Board Members
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS board_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(board_id, user_id),
  CHECK (role IN ('owner', 'admin', 'member'))
);

CREATE INDEX IF NOT EXISTS idx_board_members_board_id ON board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user_id ON board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_board_members_board_user ON board_members(board_id, user_id);

-- Trigger: Update updated_at
CREATE TRIGGER trigger_board_members_updated_at
  BEFORE UPDATE ON board_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-add board creator as owner
CREATE OR REPLACE FUNCTION add_board_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO board_members (board_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_add_board_creator
  AFTER INSERT ON boards
  FOR EACH ROW EXECUTE FUNCTION add_board_creator_as_owner();

-- Trigger: Auto-create default statuses for new board
CREATE OR REPLACE FUNCTION create_default_board_statuses()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO board_statuses (board_id, name, color, order_index, is_default)
  VALUES
    (NEW.id, 'To Do', '#6B7280', 1, true),
    (NEW.id, 'In Progress', '#3B82F6', 2, false),
    (NEW.id, 'Done', '#10B981', 3, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_default_statuses
  AFTER INSERT ON boards
  FOR EACH ROW EXECUTE FUNCTION create_default_board_statuses();

-- ============================================================================
-- PART 3: TASK TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tasks (Unified hierarchical structure)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status_id UUID NOT NULL REFERENCES board_statuses(id) ON DELETE RESTRICT,
  priority VARCHAR(20),
  assigned_to UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  due_date DATE,
  start_date DATE,
  labels TEXT[],
  order_index DECIMAL(10, 5) NOT NULL DEFAULT 0,
  estimated_time INTEGER, -- minutes
  actual_time INTEGER, -- minutes

  -- Hierarchy fields
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  depth_level INTEGER NOT NULL DEFAULT 0,

  created_by UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CHECK (priority IS NULL OR priority IN ('low', 'medium', 'high', 'urgent')),
  CHECK (estimated_time IS NULL OR estimated_time > 0),
  CHECK (actual_time IS NULL OR actual_time > 0),
  CHECK (depth_level >= 0 AND depth_level < 5), -- Max 5 levels deep
  CHECK (due_date IS NULL OR start_date IS NULL OR start_date <= due_date)
);

CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status_id ON tasks(status_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_board_order ON tasks(board_id, order_index);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_depth_order ON tasks(parent_task_id, depth_level, order_index);

-- Trigger: Update updated_at
CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Get task tree (recursive)
CREATE OR REPLACE FUNCTION get_task_tree(root_task_id UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  depth_level INTEGER,
  parent_task_id UUID
) AS $$
  WITH RECURSIVE task_tree AS (
    SELECT t.id, t.title, t.depth_level, t.parent_task_id
    FROM tasks t
    WHERE t.id = root_task_id

    UNION ALL

    SELECT t.id, t.title, t.depth_level, t.parent_task_id
    FROM tasks t
    INNER JOIN task_tree tt ON t.parent_task_id = tt.id
  )
  SELECT * FROM task_tree ORDER BY depth_level, order_index;
$$ LANGUAGE SQL STABLE;

-- ----------------------------------------------------------------------------
-- Task Relations (blocks, duplicates, etc)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  to_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  relation_type VARCHAR(50) NOT NULL,
  created_by UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(from_task_id, to_task_id, relation_type),
  CHECK (from_task_id != to_task_id), -- Prevent self-reference
  CHECK (relation_type IN ('blocks', 'blocked_by', 'relates_to', 'duplicates', 'duplicate_of'))
);

CREATE INDEX IF NOT EXISTS idx_task_relations_from_task ON task_relations(from_task_id);
CREATE INDEX IF NOT EXISTS idx_task_relations_to_task ON task_relations(to_task_id);
CREATE INDEX IF NOT EXISTS idx_task_relations_from_type ON task_relations(from_task_id, relation_type);
CREATE INDEX IF NOT EXISTS idx_task_relations_type ON task_relations(relation_type);

-- ----------------------------------------------------------------------------
-- Task Pages (Notion-style rich content)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '[]',
  created_by UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(task_id) -- One page per task
);

CREATE INDEX IF NOT EXISTS idx_task_pages_task_id ON task_pages(task_id);
CREATE INDEX IF NOT EXISTS idx_task_pages_content_gin ON task_pages USING GIN(content);

-- Trigger: Update updated_at
CREATE TRIGGER trigger_task_pages_updated_at
  BEFORE UPDATE ON task_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Task Comments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CHECK (LENGTH(comment) > 0)
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_created ON task_comments(task_id, created_at DESC);

-- Trigger: Update updated_at
CREATE TRIGGER trigger_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Task Activity Log (Audit trail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CHECK (action IN ('created', 'updated', 'commented', 'assigned', 'status_changed', 'priority_changed', 'moved', 'deleted'))
);

CREATE INDEX IF NOT EXISTS idx_task_activity_task_id ON task_activity_log(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_user_id ON task_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_task_created ON task_activity_log(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_activity_details_gin ON task_activity_log USING GIN(details);

-- Trigger: Auto-log task creation
CREATE OR REPLACE FUNCTION log_task_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_activity_log (task_id, user_id, action)
  VALUES (NEW.id, NEW.created_by, 'created');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_task_creation
  AFTER INSERT ON tasks
  FOR EACH ROW EXECUTE FUNCTION log_task_creation();

-- Trigger: Auto-log task updates
CREATE OR REPLACE FUNCTION log_task_update()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB := '{}'::JSONB;
BEGIN
  -- Track status changes
  IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
    changes := changes || jsonb_build_object('status_changed', true);
    INSERT INTO task_activity_log (task_id, user_id, action, details)
    VALUES (NEW.id, auth.uid(), 'status_changed',
            jsonb_build_object('old_status_id', OLD.status_id, 'new_status_id', NEW.status_id));
  END IF;

  -- Track priority changes
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    changes := changes || jsonb_build_object('priority_changed', true);
    INSERT INTO task_activity_log (task_id, user_id, action, details)
    VALUES (NEW.id, auth.uid(), 'priority_changed',
            jsonb_build_object('old_priority', OLD.priority, 'new_priority', NEW.priority));
  END IF;

  -- Track assignment changes
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    changes := changes || jsonb_build_object('assigned', true);
    INSERT INTO task_activity_log (task_id, user_id, action, details)
    VALUES (NEW.id, auth.uid(), 'assigned',
            jsonb_build_object('old_assigned_to', OLD.assigned_to, 'new_assigned_to', NEW.assigned_to));
  END IF;

  -- Log general update if title or description changed
  IF OLD.title IS DISTINCT FROM NEW.title OR OLD.description IS DISTINCT FROM NEW.description THEN
    INSERT INTO task_activity_log (task_id, user_id, action, details)
    VALUES (NEW.id, auth.uid(), 'updated', changes);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_task_update
  AFTER UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION log_task_update();

-- Trigger: Auto-log comments
CREATE OR REPLACE FUNCTION log_task_comment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_activity_log (task_id, user_id, action, details)
  VALUES (NEW.task_id, NEW.user_id, 'commented',
          jsonb_build_object('comment_id', NEW.id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_task_comment
  AFTER INSERT ON task_comments
  FOR EACH ROW EXECUTE FUNCTION log_task_comment();

-- ============================================================================
-- PART 4: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- User Profiles Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Boards Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view boards they are members of"
  ON boards FOR SELECT
  USING (is_board_member(id, auth.uid()));

CREATE POLICY "Authenticated users can create boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Board owners/admins can update boards"
  ON boards FOR UPDATE
  USING (is_board_admin(id, auth.uid()))
  WITH CHECK (is_board_admin(id, auth.uid()));

CREATE POLICY "Board owners can delete boards"
  ON boards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_id = boards.id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- ----------------------------------------------------------------------------
-- Board Statuses Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view board statuses for their boards"
  ON board_statuses FOR SELECT
  USING (is_board_member(board_id, auth.uid()));

CREATE POLICY "Board admins can manage statuses"
  ON board_statuses FOR ALL
  USING (is_board_admin(board_id, auth.uid()))
  WITH CHECK (is_board_admin(board_id, auth.uid()));

-- ----------------------------------------------------------------------------
-- Board Members Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view members of their boards"
  ON board_members FOR SELECT
  USING (is_board_member(board_id, auth.uid()));

CREATE POLICY "Board owners/admins can add members"
  ON board_members FOR INSERT
  WITH CHECK (
    is_board_admin(board_id, auth.uid())
  );

CREATE POLICY "Members can update own record"
  ON board_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Board owners/admins can delete members"
  ON board_members FOR DELETE
  USING (
    is_board_admin(board_id, auth.uid())
    AND user_id != auth.uid() -- Cannot remove self
  );

-- ----------------------------------------------------------------------------
-- Tasks Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view tasks in their boards"
  ON tasks FOR SELECT
  USING (is_board_member(board_id, auth.uid()));

CREATE POLICY "Board members can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    is_board_member(board_id, auth.uid())
    AND auth.uid() = created_by
  );

CREATE POLICY "Board members can update tasks"
  ON tasks FOR UPDATE
  USING (is_board_member(board_id, auth.uid()))
  WITH CHECK (is_board_member(board_id, auth.uid()));

CREATE POLICY "Task creators and board admins can delete tasks"
  ON tasks FOR DELETE
  USING (
    is_board_member(board_id, auth.uid())
    AND (created_by = auth.uid() OR is_board_admin(board_id, auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Task Relations Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view task relations in their boards"
  ON task_relations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_relations.from_task_id
      AND is_board_member(tasks.board_id, auth.uid())
    )
  );

CREATE POLICY "Board members can create task relations"
  ON task_relations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = from_task_id
      AND is_board_member(tasks.board_id, auth.uid())
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Relation creators can delete relations"
  ON task_relations FOR DELETE
  USING (created_by = auth.uid());

-- ----------------------------------------------------------------------------
-- Task Pages Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view task pages in their boards"
  ON task_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_pages.task_id
      AND is_board_member(tasks.board_id, auth.uid())
    )
  );

CREATE POLICY "Board members can manage task pages"
  ON task_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_pages.task_id
      AND is_board_member(tasks.board_id, auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_pages.task_id
      AND is_board_member(tasks.board_id, auth.uid())
    )
    AND auth.uid() = created_by
  );

-- ----------------------------------------------------------------------------
-- Task Comments Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view comments in their boards"
  ON task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_comments.task_id
      AND is_board_member(tasks.board_id, auth.uid())
    )
  );

CREATE POLICY "Board members can create comments"
  ON task_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_id
      AND is_board_member(tasks.board_id, auth.uid())
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Comment authors can update own comments"
  ON task_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comment authors can delete own comments"
  ON task_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Task Activity Log Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view activity in their boards"
  ON task_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_activity_log.task_id
      AND is_board_member(tasks.board_id, auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create activity logs"
  ON task_activity_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ============================================================================
-- PART 5: REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable Realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE boards;
ALTER PUBLICATION supabase_realtime ADD TABLE board_members;
ALTER PUBLICATION supabase_realtime ADD TABLE board_statuses;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_relations;
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE task_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE task_pages;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
