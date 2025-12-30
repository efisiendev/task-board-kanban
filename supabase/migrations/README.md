# Database Migrations

## Active Migrations

Run these migrations in order for fresh database setup:

1. **001_initial_schema.sql** - Base schema (boards, tasks tables)
2. **002_enable_rls.sql** - Enable Row Level Security
3. **003_add_secure_board_function.sql** - Add secure board functions
4. **010_complete_upgrade_merged.sql** - Complete upgrade with:
   - Task properties (priority, assignee, due dates, labels, time tracking)
   - User profiles (email, employee_number, division)
   - Shared boards (board_members with roles)
   - Updated RLS policies
5. **011_add_board_members_user_profiles_fk.sql** - Fix foreign key relationships for PostgREST joins
6. **012_enable_realtime.sql** - Enable Realtime for all tables (live updates)
7. **013_add_task_checklist.sql** - Task checklist/subtasks feature (Phase 1.1)
8. **014_add_task_comments_and_activity.sql** - Comments & activity log with auto-logging (Phase 1.3)

## Archive

The `/archive` folder contains individual migrations (004-009) that were merged into `010_complete_upgrade_merged.sql`.
These are kept for reference only and should NOT be run.

## Current Schema

See `/supabase/CURRENT_SCHEMA.sql` for complete current database schema documentation.

## Migration History

- **001-003**: Base TaskFlow schema
- **004-009**: Incremental upgrades (archived, merged into 010)
- **010**: Complete merged upgrade
- **011**: Foreign key fixes for real-time joins
