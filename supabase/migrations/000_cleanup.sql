-- ============================================================================
-- TaskFlow - Database Cleanup Script
-- ============================================================================
-- Description: Drop all existing tables, functions, and policies for fresh migration
-- Version: 1.0
-- Created: 2024-12-31
-- ============================================================================

-- Drop all functions first (this will CASCADE and drop dependent policies/triggers)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS is_board_member(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS is_board_admin(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS create_default_board_statuses() CASCADE;
DROP FUNCTION IF EXISTS validate_task_assignment() CASCADE;
DROP FUNCTION IF EXISTS log_task_activity() CASCADE;
DROP FUNCTION IF EXISTS validate_task_depth() CASCADE;
DROP FUNCTION IF EXISTS prevent_self_relation() CASCADE;
DROP FUNCTION IF EXISTS prevent_duplicate_relation() CASCADE;
DROP FUNCTION IF EXISTS add_board_creator_as_owner() CASCADE;
DROP FUNCTION IF EXISTS log_task_creation() CASCADE;
DROP FUNCTION IF EXISTS log_task_update() CASCADE;
DROP FUNCTION IF EXISTS log_task_comment() CASCADE;
DROP FUNCTION IF EXISTS get_task_tree(UUID) CASCADE;

-- Drop all tables (CASCADE will drop all dependent policies, triggers, indexes)
DROP TABLE IF EXISTS task_activity_log CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS task_pages CASCADE;
DROP TABLE IF EXISTS task_relations CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS board_statuses CASCADE;
DROP TABLE IF EXISTS board_members CASCADE;
DROP TABLE IF EXISTS boards CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop old tables that may exist from previous migrations
DROP TABLE IF EXISTS task_checklist CASCADE;
DROP TABLE IF EXISTS subtasks CASCADE;

-- Confirmation message
DO $$
BEGIN
  RAISE NOTICE '✅ Database cleanup completed successfully!';
  RAISE NOTICE '📋 Next step: Run 001_complete_schema.sql to create new schema';
END $$;
