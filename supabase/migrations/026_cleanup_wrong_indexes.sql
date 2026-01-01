-- Cleanup wrong/unnecessary indexes from migration 025 (old version)
-- Drop indexes that were created based on incorrect assumptions

-- ============================================================================
-- DROP INCORRECT/UNUSED INDEXES
-- ============================================================================

-- Drop indexes that don't match actual queries
DROP INDEX IF EXISTS idx_tasks_due_date;
DROP INDEX IF EXISTS idx_tasks_created_at;
DROP INDEX IF EXISTS idx_tasks_board_status;
DROP INDEX IF EXISTS idx_tasks_assigned_board;
DROP INDEX IF EXISTS idx_tasks_labels_gin;

-- Drop old board_statuses index (wrong name/structure)
DROP INDEX IF EXISTS idx_board_statuses_order;

-- Drop old task_comments index (will be recreated with correct structure)
DROP INDEX IF EXISTS idx_task_comments_task_created;

-- Drop task_activity index (wrong table name - should be task_activity_log)
DROP INDEX IF EXISTS idx_task_activity_task_created;

-- Drop old board_pages indexes (will be recreated with better structure)
DROP INDEX IF EXISTS idx_board_pages_board_parent;
DROP INDEX IF EXISTS idx_board_pages_position;

-- ============================================================================
-- CLEANUP COMPLETE
-- ============================================================================
-- After running this migration, run migration 025 again to create correct indexes
-- All indexes in 025 are now based on actual query patterns from the codebase
