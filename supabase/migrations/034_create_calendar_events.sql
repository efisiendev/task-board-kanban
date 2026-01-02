-- Create calendar_events table for global timeline/calendar feature
-- This is different from tasks - these are events/agendas that can span multiple dates

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,

  -- Date range (can be single day or multi-day event)
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Event metadata
  coordination_type TEXT CHECK (coordination_type IN ('synchronous', 'asynchronous')),

  -- Optional: Link to board/project (nullable for standalone events)
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,

  -- Optional: Link to specific task (nullable for standalone events)
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,

  -- Event color for calendar display
  color TEXT DEFAULT '#3B82F6',

  -- Audit fields
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_end_date ON calendar_events(end_date);
CREATE INDEX idx_calendar_events_board_id ON calendar_events(board_id);
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);

-- Add RLS policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view events from boards they're members of, or standalone events they created
CREATE POLICY "Users can view calendar events from their boards or own events"
  ON calendar_events FOR SELECT
  USING (
    -- Standalone events created by user
    (board_id IS NULL AND created_by = auth.uid())
    OR
    -- Events linked to boards where user is a member
    (board_id IN (
      SELECT board_id FROM board_members WHERE user_id = auth.uid()
    ))
  );

-- Policy: Users can create calendar events
CREATE POLICY "Users can create calendar events"
  ON calendar_events FOR INSERT
  WITH CHECK (
    -- Can create standalone events
    (board_id IS NULL AND created_by = auth.uid())
    OR
    -- Can create events for boards where they're members
    (board_id IN (
      SELECT board_id FROM board_members WHERE user_id = auth.uid()
    ))
  );

-- Policy: Users can update their own events or events in boards they're members of
CREATE POLICY "Users can update calendar events"
  ON calendar_events FOR UPDATE
  USING (
    (board_id IS NULL AND created_by = auth.uid())
    OR
    (board_id IN (
      SELECT board_id FROM board_members WHERE user_id = auth.uid()
    ))
  );

-- Policy: Users can delete their own events or events in boards they're admin/owner
CREATE POLICY "Users can delete calendar events"
  ON calendar_events FOR DELETE
  USING (
    (board_id IS NULL AND created_by = auth.uid())
    OR
    (board_id IN (
      SELECT board_id FROM board_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    ))
  );

-- Add updated_at trigger
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
