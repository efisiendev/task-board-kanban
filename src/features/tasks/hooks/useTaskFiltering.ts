import { useMemo } from 'react'
import { Task } from '../../../types'
import { TaskFilters } from '../../boards/components/FilterSidebar'

export function useTaskFiltering(tasks: Task[], searchQuery: string, filters: TaskFilters) {
  return useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

      // Status filter (using status_id)
      const matchesStatus = filters.status.length === 0 || filters.status.includes(task.status_id)

      // Priority filter
      const matchesPriority = filters.priority.length === 0 || (task.priority && filters.priority.includes(task.priority))

      // Assignee filter
      const matchesAssignee =
        filters.assignee.length === 0 ||
        (filters.assignee.includes('unassigned') && !task.assigned_to) ||
        (task.assigned_to && filters.assignee.includes(task.assigned_to))

      // Has labels filter
      const matchesHasLabels =
        filters.hasLabels === null ||
        (filters.hasLabels === true && task.labels && task.labels.length > 0)

      // Overdue filter
      const matchesOverdue =
        filters.isOverdue === null ||
        (filters.isOverdue === true && task.due_date && new Date(task.due_date) < new Date() && task.board_status?.name !== 'Done')

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesHasLabels && matchesOverdue
    })
  }, [tasks, searchQuery, filters])
}
