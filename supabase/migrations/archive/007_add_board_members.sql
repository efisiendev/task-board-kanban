-- Create board_members table for shared board access
-- Allows multiple users to collaborate on the same board

CREATE TABLE board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, user_id) -- A user can only be a member once per board
);

-- Create indexes for performance
CREATE INDEX idx_board_members_board_id ON board_members(board_id);
CREATE INDEX idx_board_members_user_id ON board_members(user_id);
CREATE INDEX idx_board_members_role ON board_members(role);

-- RLS Policies for board_members
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

-- Users can view members of boards they have access to
CREATE POLICY "Users can view board members"
  ON board_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    board_id IN (
      SELECT board_id FROM board_members WHERE user_id = auth.uid()
    )
  );

-- Board owners and admins can add members
CREATE POLICY "Owners and admins can add members"
  ON board_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE id = board_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_id = board_members.board_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Board owners and admins can remove members
CREATE POLICY "Owners and admins can remove members"
  ON board_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE id = board_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_id = board_members.board_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Update boards RLS policies to allow shared access
DROP POLICY IF EXISTS "Users can view their own boards" ON boards;
DROP POLICY IF EXISTS "Users can insert their own boards" ON boards;
DROP POLICY IF EXISTS "Users can update their own boards" ON boards;
DROP POLICY IF EXISTS "Users can delete their own boards" ON boards;

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

-- Update tasks RLS policies to allow shared access
DROP POLICY IF EXISTS "Users can view tasks for their boards" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks for their boards" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks for their boards" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks for their boards" ON tasks;

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

-- Function to automatically add board creator as owner
CREATE OR REPLACE FUNCTION add_board_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO board_members (board_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add creator as owner when board is created
CREATE TRIGGER add_board_creator_trigger
  AFTER INSERT ON boards
  FOR EACH ROW
  EXECUTE FUNCTION add_board_creator_as_owner();

-- Add comments for documentation
COMMENT ON TABLE board_members IS 'Board membership for shared access control';
COMMENT ON COLUMN board_members.role IS 'User role: owner (creator), admin (full access), member (can edit), viewer (read-only)';
