-- Migrate existing assigned_to data to task_assignees table
-- This script copies single-assignee data from tasks.assigned_to to task_assignees junction table

-- Insert assignees from tasks table where assigned_to is not null
INSERT INTO task_assignees (task_id, user_id, assigned_by, assigned_at)
SELECT
  id as task_id,
  assigned_to as user_id,
  created_by as assigned_by,
  created_at as assigned_at
FROM tasks
WHERE assigned_to IS NOT NULL
ON CONFLICT (task_id, user_id) DO NOTHING; -- Skip if already exists

-- Similarly, migrate subtask assignees (tasks with task_id not null are subtasks)
-- Already handled above since subtasks are also in tasks table

-- Verification query (commented out - uncomment to check migration results)
-- SELECT
--   t.id as task_id,
--   t.title,
--   t.assigned_to as old_assigned_to,
--   array_agg(ta.user_id) as new_assignee_ids
-- FROM tasks t
-- LEFT JOIN task_assignees ta ON ta.task_id = t.id
-- WHERE t.assigned_to IS NOT NULL
-- GROUP BY t.id, t.title, t.assigned_to
-- ORDER BY t.created_at DESC;
