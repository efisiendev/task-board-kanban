# 🏗️ Refactoring Plan - Architecture Improvement

**Branch:** `refactor/architecture-improvement` (create from `update-4-januari-2026`)
**Start Date:** 2026-01-04
**Status:** Planning Phase

---

## 🎯 Goals
- Improve code maintainability
- Feature-based organization
- Better separation of concerns
- Scalable architecture

---

## 📋 High Priority Tasks

### 1. Split types/ by domain ⏱️ ~30 min

**Current:**
```
src/types/index.ts (207 lines - monolith)
```

**Target:**
```
src/types/
├── index.ts              # Re-export all
├── task.types.ts         # Task, Subtask, TaskFormData
├── board.types.ts        # Board, BoardStatus, BoardMember
├── user.types.ts         # UserProfile, User
├── calendar.types.ts     # CalendarEvent, EventCoordination
├── page.types.ts         # BoardPage, TaskPage
└── common.types.ts       # ViewType, TaskFilters, etc.
```

**Steps:**
1. Read `src/types/index.ts`
2. Create separate type files by domain
3. Move related types to each file
4. Update `index.ts` to re-export all
5. Test build - no import changes needed (barrel export)

---

### 2. Group Calendar components ⏱️ ~20 min

**Current:**
```
src/components/
├── CalendarView.tsx
├── CalendarMonth.tsx
├── CalendarYearView.tsx
├── EventDetailSidebar.tsx
└── ...
```

**Target:**
```
src/features/calendar/
├── components/
│   ├── CalendarView.tsx
│   ├── CalendarMonth.tsx
│   ├── CalendarYearView.tsx
│   └── EventDetailSidebar.tsx
├── hooks/
│   ├── useCalendarEvents.ts
│   └── useCalendarSelection.ts
└── utils/
    └── calendarUtils.ts
```

**Steps:**
1. Create `src/features/calendar/` folder structure
2. Move calendar components
3. Move calendar hooks
4. Move calendar utils
5. Update all imports (find & replace)
6. Test build

---

### 3. Extract services layer ⏱️ ~45 min

**Current:** Supabase calls scattered in hooks

**Target:**
```
src/services/
├── supabase/
│   ├── client.ts          # Supabase client export
│   ├── tasks.service.ts   # All task CRUD
│   ├── boards.service.ts  # All board CRUD
│   ├── users.service.ts   # All user queries
│   └── auth.service.ts    # Auth operations
└── index.ts
```

**Example - tasks.service.ts:**
```typescript
import { supabase } from '../../lib/supabase'
import { Task } from '../../types'

export const tasksService = {
  async getTasksByBoard(boardId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('board_id', boardId)
    if (error) throw error
    return data as Task[]
  },

  async createTask(task: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single()
    if (error) throw error
    return data as Task
  },

  // ... other methods
}
```

**Steps:**
1. Create `src/services/supabase/` folder
2. Create service files per domain
3. Extract Supabase calls from hooks
4. Update hooks to use services
5. Test all CRUD operations

---

## 📊 Medium Priority Tasks

### 4. Feature-based folders ⏱️ ~60 min

**Target Structure:**
```
src/features/
├── tasks/
│   ├── components/
│   │   ├── TaskCard.tsx
│   │   ├── TaskModal.tsx
│   │   ├── SubTaskList.tsx
│   │   ├── TaskComments.tsx
│   │   └── TaskPages.tsx
│   ├── hooks/
│   │   ├── useTasks.ts
│   │   ├── useTaskAssignees.ts
│   │   ├── useSubtasks.ts
│   │   └── useTaskRelations.ts
│   └── types/
│       └── index.ts (re-export from types/)
│
├── boards/
│   ├── components/
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   ├── BoardMembers.tsx
│   │   ├── BoardStatusManager.tsx
│   │   ├── FilterSidebar.tsx
│   │   ├── TableView.tsx
│   │   └── ListView.tsx
│   ├── hooks/
│   │   ├── useBoards.ts
│   │   ├── useBoardMembers.ts
│   │   └── useBoardStatuses.ts
│   └── types/
│
├── pages/
│   ├── components/
│   │   ├── PageEditor.tsx
│   │   ├── PageModal.tsx
│   │   ├── PageEditorModal.tsx
│   │   └── FolderTree.tsx
│   └── hooks/
│       └── useBoardPages.ts
│
└── calendar/
    └── (already done in step 2)
```

**Steps:**
1. Create feature folders
2. Move components by feature
3. Move hooks by feature
4. Update all imports
5. Test build

---

### 5. Organize shared/ui ⏱️ ~30 min

**Target:**
```
src/shared/
├── components/
│   ├── ui/              # Pure UI
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── SidePanel.tsx
│   │   └── ColorPicker.tsx
│   │
│   ├── form/            # Form fields
│   │   ├── PropertyRow.tsx
│   │   ├── PriorityField.tsx
│   │   ├── DateField.tsx
│   │   ├── TimeField.tsx
│   │   ├── AssigneeField.tsx
│   │   ├── MultiAssigneeField.tsx
│   │   ├── CreatorField.tsx
│   │   └── LabelsField.tsx
│   │
│   └── layout/          # Layout
│       ├── MainLayout.tsx
│       └── PageLayout.tsx
│
├── hooks/               # Generic hooks
│   ├── useToggle.ts
│   ├── useAutoSave.ts
│   └── useBatchUserProfiles.ts
│
└── utils/
    ├── timeUtils.ts
    └── index.ts
```

**Steps:**
1. Create shared/ structure
2. Move components to appropriate folders
3. Move shared hooks
4. Update imports
5. Test build

---

## 🚀 Execution Order (Nanti Malam)

**Phase 1: Safe Moves (No Logic Changes)**
1. Split types → 30 min
2. Group calendar → 20 min
3. Organize shared → 30 min
   **Checkpoint:** Test build ✅

**Phase 2: Service Layer (Logic Changes)**
4. Extract services → 45 min
   **Checkpoint:** Test all features ✅

**Phase 3: Feature Folders (Big Move)**
5. Feature-based folders → 60 min
   **Checkpoint:** Full regression test ✅

**Total:** ~3 hours

---

## ✅ Testing Checklist

After each phase:
- [ ] `npm run build` - no errors
- [ ] Open browser - no console errors
- [ ] Test CRUD operations:
  - [ ] Create task
  - [ ] Update task
  - [ ] Delete task
  - [ ] Assign multiple users
  - [ ] Add comment
  - [ ] Calendar events

---

## 📝 Notes

- Keep `git status` clean before starting
- Commit after each completed task
- Use descriptive commit messages
- Branch: `refactor/architecture-improvement`

---

## 🔄 Rollback Plan

If anything breaks:
```bash
git reset --hard HEAD~1  # Undo last commit
# or
git checkout update-4-januari-2026  # Back to original branch
```
