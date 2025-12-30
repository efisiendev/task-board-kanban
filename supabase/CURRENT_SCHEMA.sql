-- ============================================
-- TASKFLOW - COMPLETE DATABASE SCHEMA
-- Current state after all migrations (001-011)
-- ============================================

-- ============================================
-- TABLE: boards
-- ============================================
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);

-- ============================================
-- TABLE: tasks
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'to_do',
  order_index DECIMAL(10,5) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Task Properties (Added in migration 004)
  priority VARCHAR(20),                              -- low, medium, high, urgent
  assigned_to UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  due_date DATE,
  start_date DATE,
  labels TEXT[],
  created_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  estimated_time INTEGER,                            -- in minutes
  actual_time INTEGER                                -- in minutes
);

CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_labels ON tasks USING GIN(labels);

-- ============================================
-- TABLE: user_profiles
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  division VARCHAR(100),
  department VARCHAR(100),
  position VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_number ON user_profiles(employee_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_division ON user_profiles(division);
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON user_profiles(department);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- ============================================
-- TABLE: board_members
-- ============================================
CREATE TABLE IF NOT EXISTS board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',         -- owner, admin, member, viewer
  invited_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_board_members_board_id ON board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user_id ON board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_board_members_role ON board_members(role);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to boards
DROP TRIGGER IF EXISTS update_boards_updated_at ON boards;
CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to tasks
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-add board creator as owner
CREATE OR REPLACE FUNCTION add_board_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO board_members (board_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.user_id, 'owner', NEW.user_id)
  ON CONFLICT (board_id, user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to add board creator as member: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS add_board_creator_trigger ON boards;
CREATE TRIGGER add_board_creator_trigger
  AFTER INSERT ON boards
  FOR EACH ROW
  EXECUTE FUNCTION add_board_creator_as_owner();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: user_profiles
-- ============================================

DROP POLICY IF EXISTS "Anyone can view user profiles" ON user_profiles;
CREATE POLICY "Anyone can view user profiles"
  ON user_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: boards
-- ============================================

DROP POLICY IF EXISTS "Users can view boards they own or are members of" ON boards;
CREATE POLICY "Users can view boards they own or are members of"
  ON boards FOR SELECT
  USING (
    user_id = auth.uid() OR
    id IN (SELECT board_id FROM board_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert their own boards" ON boards;
CREATE POLICY "Users can insert their own boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Board owners can update their boards" ON boards;
CREATE POLICY "Board owners can update their boards"
  ON boards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Board owners can delete their boards" ON boards;
CREATE POLICY "Board owners can delete their boards"
  ON boards FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: board_members
-- ============================================

DROP POLICY IF EXISTS "Users can view board members" ON board_members;
CREATE POLICY "Users can view board members"
  ON board_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    board_id IN (
      SELECT board_id FROM board_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Board owners can add members" ON board_members;
CREATE POLICY "Board owners can add members"
  ON board_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE id = board_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = board_members.board_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Board owners can remove members" ON board_members;
CREATE POLICY "Board owners can remove members"
  ON board_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE id = board_id AND user_id = auth.uid()
    )
    OR (
      EXISTS (
        SELECT 1 FROM board_members bm
        WHERE bm.board_id = board_members.board_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
      AND role != 'owner'
    )
  );

-- ============================================
-- RLS POLICIES: tasks
-- ============================================

DROP POLICY IF EXISTS "Users can view tasks for accessible boards" ON tasks;
CREATE POLICY "Users can view tasks for accessible boards"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = tasks.board_id
      AND (
        boards.user_id = auth.uid() OR
        boards.id IN (SELECT board_id FROM board_members WHERE user_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert tasks for accessible boards" ON tasks;
CREATE POLICY "Users can insert tasks for accessible boards"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = tasks.board_id
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

DROP POLICY IF EXISTS "Users can update tasks for accessible boards" ON tasks;
CREATE POLICY "Users can update tasks for accessible boards"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = tasks.board_id
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
      SELECT 1 FROM boards
      WHERE boards.id = tasks.board_id
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

DROP POLICY IF EXISTS "Users can delete tasks for accessible boards" ON tasks;
CREATE POLICY "Users can delete tasks for accessible boards"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = tasks.board_id
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

-- ============================================
-- REALTIME
-- ============================================

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE boards;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE board_members;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;

-- ============================================
-- SUMMARY
-- ============================================
-- Tables: 4
--   - boards (board management)
--   - tasks (task management with properties)
--   - user_profiles (user info: email, employee_number, division)
--   - board_members (shared board access with roles)
--
-- Features:
--   ✅ Kanban board with drag-and-drop
--   ✅ Task properties (priority, assignee, due dates, labels, time tracking)
--   ✅ User profiles with organization data
--   ✅ Shared boards with role-based access
--   ✅ Real-time collaboration
--   ✅ Row-level security
-- ============================================
