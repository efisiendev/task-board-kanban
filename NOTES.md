# Development Notes

## Known Issues

### CORS Configuration (Low Priority)
**Issue**: Supabase CORS allowing `localhost:5174` but app runs on `localhost:5173`

**Error**:
```
Access to fetch blocked by CORS policy: The 'Access-Control-Allow-Origin'
header has a value 'http://localhost:5174' that is not equal to the
supplied origin 'http://localhost:5173'
```

**Solutions**:
1. **Recommended**: Update Supabase Dashboard → Project Settings → API → Add `http://localhost:5173` to allowed origins
2. Alternative: Change `vite.config.ts` port from 5173 to 5174

**Priority**: Low - only affects local development

---

## Phase Completion Status

✅ **Phase 1.1** - Task Checklist/Subtasks (Basic)
✅ **Phase 1.2** - User Profiles
✅ **Phase 1.3** - Comments & Activity Log
✅ **Phase 1.4** - Kanban-style Subtasks with Properties

🔄 **Phase 2** - (Current)

---

## Future Architecture Consideration: Unified Hierarchical Tasks

### Current Implementation (Phase 1.4)
- **Two separate systems:**
  1. `tasks` table - Main tasks
  2. `task_checklist` table - Subtasks/checklist items
- Subtasks are lightweight, cannot be assigned separately
- Limited nesting (only 1 level deep)

### Proposed Long-term Architecture
**Single unified system:** Everything is a task in the `tasks` table

```sql
-- Add to tasks table:
ALTER TABLE tasks
  ADD COLUMN parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  ADD COLUMN is_checklist_item BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_parent_order ON tasks(parent_task_id, order_index);
```

### Key Concept
- Main tasks: `parent_task_id = NULL`
- Subtasks: `parent_task_id = <parent-task-id>`
- Infinite nesting possible: task → subtask → sub-subtask → ...

### Benefits (Long-term)
1. ✅ **Unlimited nesting** - No depth limit
2. ✅ **Easy promotion/demotion** - Just update parent_task_id
3. ✅ **Flexible assignment** - Assign subtasks to different people
4. ✅ **Single source of truth** - All features work at all levels
5. ✅ **Scalable** - New features automatically work everywhere
6. ✅ **Industry standard** - Matches Jira, Linear, ClickUp architecture

### Example Hierarchy
```
tasks table (flat):
├─ task-1 (parent_task_id: NULL) "Product Launch" → Main Task
│   ├─ task-2 (parent_task_id: task-1) "Research" → Subtask
│   │   └─ task-4 (parent_task_id: task-2) "User Interviews" → Sub-subtask
│   └─ task-3 (parent_task_id: task-1) "Development" → Subtask
└─ task-5 (parent_task_id: NULL) "Marketing" → Main Task
```

### Migration Path (When Ready)
1. Backup `task_checklist` table
2. Migrate checklist items to `tasks` with `parent_task_id` set
3. Drop `task_checklist` table
4. Update UI components (TaskChecklist → TaskHierarchy)
5. Update hooks and API calls

**Estimated effort:** 2-3 days

### Decision
- **Current:** Keep dual system for Phase 1 (faster to market)
- **Future (Phase 3?):** Migrate to unified system for scalability
- **Trigger:** When users request nested subtasks or cross-assignment

🔄 **Phase 2** - (Current)
