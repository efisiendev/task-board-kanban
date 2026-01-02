-- Fix calendar events visibility to support both public and board-specific events

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view calendar events from their boards or own events" ON calendar_events;

-- New SELECT policy: Users can view public events OR events from their boards
CREATE POLICY "Users can view calendar events"
  ON calendar_events FOR SELECT
  USING (
    -- Public events (no board_id) - visible to all authenticated users
    (board_id IS NULL)
    OR
    -- Events linked to boards where user is a member
    (board_id IN (
      SELECT board_id FROM board_members WHERE user_id = auth.uid()
    ))
  );

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create calendar events" ON calendar_events;

-- New INSERT policy: Allow creating public events or board events
CREATE POLICY "Users can create calendar events"
  ON calendar_events FOR INSERT
  WITH CHECK (
    -- Can create public events (all users)
    (board_id IS NULL AND created_by = auth.uid())
    OR
    -- Can create events for boards where they're members
    (board_id IN (
      SELECT board_id FROM board_members WHERE user_id = auth.uid()
    ))
  );

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update calendar events" ON calendar_events;

-- New UPDATE policy: Can update own public events or board events
CREATE POLICY "Users can update calendar events"
  ON calendar_events FOR UPDATE
  USING (
    -- Own public events
    (board_id IS NULL AND created_by = auth.uid())
    OR
    -- Events in boards where user is member
    (board_id IN (
      SELECT board_id FROM board_members WHERE user_id = auth.uid()
    ))
  );

-- Drop existing DELETE policy
DROP POLICY IF EXISTS "Users can delete calendar events" ON calendar_events;

-- New DELETE policy: Can delete own public events or board events (if admin/owner)
CREATE POLICY "Users can delete calendar events"
  ON calendar_events FOR DELETE
  USING (
    -- Own public events
    (board_id IS NULL AND created_by = auth.uid())
    OR
    -- Events in boards where user is admin/owner
    (board_id IN (
      SELECT board_id FROM board_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    ))
  );
