-- Add missing indexes for performance optimization
-- This migration adds indexes for frequently queried columns

-- ============================================================================
-- TASKS TABLE INDEXES
-- ============================================================================

-- Index for due_date filtering (overdue tasks, date range queries)
CREATE INDEX IF NOT EXISTS idx_tasks_due_date
ON tasks(due_date)
WHERE due_date IS NOT NULL;

-- Index for created_at sorting (table view, recent tasks)
CREATE INDEX IF NOT EXISTS idx_tasks_created_at
ON tasks(created_at DESC);

-- Composite index for kanban board queries (board_id + status_id)
-- This is the most common query pattern in the app
CREATE INDEX IF NOT EXISTS idx_tasks_board_status
ON tasks(board_id, status_id);

-- Composite index for assignee filtering within boards
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_board
ON tasks(assigned_to, board_id)
WHERE assigned_to IS NOT NULL;

-- GIN index for array label searches
CREATE INDEX IF NOT EXISTS idx_tasks_labels_gin
ON tasks USING GIN(labels)
WHERE labels IS NOT NULL;

-- ============================================================================
-- BOARD_STATUSES TABLE INDEXES
-- ============================================================================

-- Composite index for ordering statuses within boards
CREATE INDEX IF NOT EXISTS idx_board_statuses_order
ON board_statuses(board_id, order_index);

-- ============================================================================
-- TASK_COMMENTS TABLE INDEXES
-- ============================================================================

-- Recreate with proper DESC ordering for recent comments first
DROP INDEX IF EXISTS idx_task_comments_task_created;
CREATE INDEX idx_task_comments_task_created
ON task_comments(task_id, created_at DESC);

-- ============================================================================
-- TASK_ACTIVITY_LOG TABLE INDEXES
-- ============================================================================

-- Add index for activity queries (ordered by created_at DESC)
CREATE INDEX IF NOT EXISTS idx_task_activity_log_task_created
ON task_activity_log(task_id, created_at DESC);

-- ============================================================================
-- BOARD_PAGES TABLE INDEXES
-- ============================================================================

-- Composite index for hierarchical page queries
CREATE INDEX IF NOT EXISTS idx_board_pages_board_parent
ON board_pages(board_id, parent_id);

-- Index for page ordering within parent
CREATE INDEX IF NOT EXISTS idx_board_pages_position
ON board_pages(parent_id, position)
WHERE parent_id IS NOT NULL;

-- ============================================================================
-- Performance Notes
-- ============================================================================
-- These indexes should significantly improve:
-- 1. Kanban board loading (idx_tasks_board_status)
-- 2. Filter sidebar queries (idx_tasks_assigned_board, idx_tasks_labels_gin)
-- 3. Table view sorting (idx_tasks_created_at)
-- 4. Overdue task detection (idx_tasks_due_date)
-- 5. Comment/activity loading (DESC ordering)
-- 6. Page tree rendering (idx_board_pages_board_parent)
