-- Fix board_members RLS policies to avoid circular reference
-- The issue: When creating a board, the trigger tries to insert board_members
-- but the RLS policy checks if the board exists, causing a race condition

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Owners and admins can add members" ON board_members;

-- Create a simpler INSERT policy that allows:
-- 1. Board owners to add members (checks boards table directly)
-- 2. The trigger function to work (via SECURITY DEFINER)
CREATE POLICY "Board owners can add members"
  ON board_members FOR INSERT
  WITH CHECK (
    -- Allow if user is the board owner
    EXISTS (
      SELECT 1 FROM boards
      WHERE id = board_id AND user_id = auth.uid()
    )
    -- OR if the inserter is already an admin/owner member
    OR EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = board_members.board_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
    )
  );

-- Also update the trigger function to ensure it works correctly
DROP TRIGGER IF EXISTS add_board_creator_trigger ON boards;
DROP FUNCTION IF EXISTS add_board_creator_as_owner();

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION add_board_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the creator as owner, ignore if already exists
  INSERT INTO board_members (board_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.user_id, 'owner', NEW.user_id)
  ON CONFLICT (board_id, user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the board creation
    RAISE WARNING 'Failed to add board creator as member: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER add_board_creator_trigger
  AFTER INSERT ON boards
  FOR EACH ROW
  EXECUTE FUNCTION add_board_creator_as_owner();

-- Also fix the DELETE policy for board_members
DROP POLICY IF EXISTS "Owners and admins can remove members" ON board_members;

CREATE POLICY "Board owners can remove members"
  ON board_members FOR DELETE
  USING (
    -- Board owner can remove anyone
    EXISTS (
      SELECT 1 FROM boards
      WHERE id = board_id AND user_id = auth.uid()
    )
    -- OR admin members can remove non-owners
    OR (
      EXISTS (
        SELECT 1 FROM board_members bm
        WHERE bm.board_id = board_members.board_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
      AND role != 'owner' -- Admins cannot remove owners
    )
  );
