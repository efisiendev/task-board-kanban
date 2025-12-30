-- ============================================
-- COMPLETE TASKFLOW UPGRADE - MERGED MIGRATION
-- ============================================
-- This migration includes:
-- 1. Task properties (priority, assigned_to, due_date, etc.)
-- 2. User profiles (email, employee_number, division)
-- 3. Shared boards with member management
-- 4. Updated RLS policies
-- ============================================

-- ============================================
-- PART 1: TASK PROPERTIES
-- ============================================

-- Add new columns to tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS labels TEXT[],
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS estimated_time INTEGER,
  ADD COLUMN IF NOT EXISTS actual_time INTEGER;

-- Create indexes for task properties
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_labels ON tasks USING GIN(labels);

-- ============================================
-- PART 2: USER PROFILES
-- ============================================

-- Create user_profiles table
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

-- Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_number ON user_profiles(employee_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_division ON user_profiles(division);
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON user_profiles(department);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- RLS Policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

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

-- Apply updated_at trigger to user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Populate user_profiles from existing auth.users
INSERT INTO user_profiles (user_id, email, username, employee_number, division)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'username', SPLIT_PART(au.email, '@', 1)) as username,
  'EMP' || LPAD(ROW_NUMBER() OVER (ORDER BY au.created_at)::text, 4, '0') as employee_number,
  'Unassigned' as division
FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- PART 3: SHARED BOARDS (BOARD MEMBERS)
-- ============================================

-- Create board_members table
CREATE TABLE IF NOT EXISTS board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);

-- Create indexes for board_members
CREATE INDEX IF NOT EXISTS idx_board_members_board_id ON board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user_id ON board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_board_members_role ON board_members(role);

-- RLS Policies for board_members
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

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
-- PART 4: UPDATE BOARDS RLS FOR SHARED ACCESS
-- ============================================

-- Drop old boards policies
DROP POLICY IF EXISTS "Users can view their own boards" ON boards;
DROP POLICY IF EXISTS "Users can insert their own boards" ON boards;
DROP POLICY IF EXISTS "Users can update their own boards" ON boards;
DROP POLICY IF EXISTS "Users can delete their own boards" ON boards;
DROP POLICY IF EXISTS "Users can view boards they own or are members of" ON boards;
DROP POLICY IF EXISTS "Board owners can update their boards" ON boards;
DROP POLICY IF EXISTS "Board owners can delete their boards" ON boards;

-- New boards RLS policies for shared access
CREATE POLICY "Users can view boards they own or are members of"
  ON boards FOR SELECT
  USING (
    user_id = auth.uid() OR
    id IN (SELECT board_id FROM board_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Board owners can update their boards"
  ON boards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Board owners can delete their boards"
  ON boards FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PART 5: UPDATE TASKS RLS FOR SHARED ACCESS
-- ============================================

-- Drop old tasks policies
DROP POLICY IF EXISTS "Users can view tasks for their boards" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks for their boards" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks for their boards" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks for their boards" ON tasks;
DROP POLICY IF EXISTS "Users can view tasks for accessible boards" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks for accessible boards" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks for accessible boards" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks for accessible boards" ON tasks;

-- New tasks RLS policies for shared board access
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
-- PART 6: AUTO-ADD BOARD CREATOR AS OWNER
-- ============================================

-- Function to add board creator as owner
DROP TRIGGER IF EXISTS add_board_creator_trigger ON boards;
DROP FUNCTION IF EXISTS add_board_creator_as_owner();

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

CREATE TRIGGER add_board_creator_trigger
  AFTER INSERT ON boards
  FOR EACH ROW
  EXECUTE FUNCTION add_board_creator_as_owner();

-- ============================================
-- PART 7: POPULATE EXISTING BOARDS
-- ============================================

-- Add existing board owners to board_members
INSERT INTO board_members (board_id, user_id, role, invited_by)
SELECT
  b.id as board_id,
  b.user_id,
  'owner' as role,
  b.user_id as invited_by
FROM boards b
WHERE NOT EXISTS (
  SELECT 1 FROM board_members bm
  WHERE bm.board_id = b.id AND bm.user_id = b.user_id
)
ON CONFLICT (board_id, user_id) DO NOTHING;

-- ============================================
-- DONE!
-- ============================================

DO $$
DECLARE
  user_count INTEGER;
  board_count INTEGER;
  member_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM user_profiles;
  SELECT COUNT(*) INTO board_count FROM boards;
  SELECT COUNT(*) INTO member_count FROM board_members;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'TaskFlow Upgrade Complete!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'User profiles: %', user_count;
  RAISE NOTICE 'Boards: %', board_count;
  RAISE NOTICE 'Board members: %', member_count;
  RAISE NOTICE '===========================================';
END $$;
