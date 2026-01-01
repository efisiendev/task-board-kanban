-- Performance indexes based on actual query patterns in the codebase
-- This migration only includes indexes for queries that are actually used
-- Safe for production - only creates indexes that don't exist yet

-- ============================================================================
-- TASKS TABLE INDEXES
-- ============================================================================

-- Composite index for the main kanban query (useTasks.ts:35-42)
-- Query: .eq('board_id').is('parent_task_id', null).order('order_index')
CREATE INDEX IF NOT EXISTS idx_tasks_board_parent_order
ON tasks(board_id, parent_task_id, order_index)
WHERE parent_task_id IS NULL;

-- Composite index for board member checks (useTasks.ts:12-16)
-- Query: .eq('board_id').eq('user_id')
CREATE INDEX IF NOT EXISTS idx_board_members_board_user
ON board_members(board_id, user_id);

-- ============================================================================
-- BOARD_STATUSES TABLE INDEXES
-- ============================================================================

-- Composite index for status ordering (useTasks.ts:113-117)
-- Query: .eq('board_id').order('order_index')
CREATE INDEX IF NOT EXISTS idx_board_statuses_board_order
ON board_statuses(board_id, order_index);

-- ============================================================================
-- BOARD_PAGES TABLE INDEXES
-- ============================================================================

-- Composite index for page listing (useBoardPages.ts:14-17)
-- Query: .eq('board_id').order('position')
CREATE INDEX IF NOT EXISTS idx_board_pages_board_position
ON board_pages(board_id, position);

-- Composite index for nested page queries (useBoardPages.ts:80-84)
-- Query: .eq('board_id').eq('parent_id').order('position')
CREATE INDEX IF NOT EXISTS idx_board_pages_board_parent_position
ON board_pages(board_id, parent_id, position);

-- ============================================================================
-- TASK_COMMENTS TABLE INDEXES
-- ============================================================================

-- Composite index for comment listing (useTaskComments.ts:17-20)
-- Query: .eq('task_id').order('created_at', ascending: true)
CREATE INDEX IF NOT EXISTS idx_task_comments_task_created
ON task_comments(task_id, created_at ASC);

-- ============================================================================
-- TASK_ACTIVITY_LOG TABLE INDEXES
-- ============================================================================

-- Composite index for activity listing (useTaskComments.ts:129-133)
-- Query: .eq('task_id').order('created_at', ascending: false).limit(50)
CREATE INDEX IF NOT EXISTS idx_task_activity_log_task_created
ON task_activity_log(task_id, created_at DESC);

-- ============================================================================
-- USER_PROFILES TABLE INDEXES
-- ============================================================================

-- Index for batch user profile fetching (useBatchUserProfiles.ts:21-23)
-- Query: .in('user_id', [...])
-- Note: This might already exist as primary key, but we ensure it exists
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id
ON user_profiles(user_id);

-- ============================================================================
-- Notes
-- ============================================================================
-- All indexes are created based on actual queries found in:
-- - src/hooks/useTasks.ts
-- - src/hooks/useBoardPages.ts
-- - src/hooks/useTaskComments.ts
-- - src/hooks/useBatchUserProfiles.ts
-- - src/hooks/useBoardStatuses.ts
--
-- All indexes use IF NOT EXISTS so safe to run multiple times
-- This migration is production-ready
