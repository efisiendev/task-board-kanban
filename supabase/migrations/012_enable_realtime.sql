-- ============================================
-- ENABLE REALTIME FOR ALL TABLES
-- ============================================
-- This ensures all tables are included in the supabase_realtime publication
-- so that real-time subscriptions work automatically

-- Add tables to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS boards;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS board_members;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS user_profiles;

-- Verify
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public';

  RAISE NOTICE 'Realtime enabled for % tables', table_count;
  RAISE NOTICE 'Tables: boards, tasks, board_members, user_profiles';
END $$;
