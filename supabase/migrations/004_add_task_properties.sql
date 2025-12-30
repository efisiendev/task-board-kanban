-- Add task properties (Phase 1: Essential Features)
-- Properties inspired by Notion for better task management

-- Add new columns to tasks table
ALTER TABLE tasks
  ADD COLUMN priority VARCHAR(20), -- 'low', 'medium', 'high', 'urgent'
  ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN due_date DATE,
  ADD COLUMN start_date DATE,
  ADD COLUMN labels TEXT[], -- Array of label strings
  ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN estimated_time INTEGER, -- in minutes
  ADD COLUMN actual_time INTEGER; -- in minutes

-- Create indexes for better query performance
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_labels ON tasks USING GIN(labels);

-- Add comments for documentation
COMMENT ON COLUMN tasks.priority IS 'Task priority: low, medium, high, urgent';
COMMENT ON COLUMN tasks.assigned_to IS 'User ID of person assigned to this task';
COMMENT ON COLUMN tasks.due_date IS 'Deadline for task completion';
COMMENT ON COLUMN tasks.start_date IS 'When to start working on this task';
COMMENT ON COLUMN tasks.labels IS 'Array of tags/labels for categorization';
COMMENT ON COLUMN tasks.created_by IS 'User ID of task creator';
COMMENT ON COLUMN tasks.estimated_time IS 'Estimated time to complete (in minutes)';
COMMENT ON COLUMN tasks.actual_time IS 'Actual time spent (in minutes)';
