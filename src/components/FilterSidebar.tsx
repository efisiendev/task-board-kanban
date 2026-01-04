import { TaskPriority, BoardStatus } from '../types'
import { useUsers } from '../hooks/useUsers'
import { Circle, Calendar, Tag } from '../lib/icons'

export interface TaskFilters {
  status: string[] // status_ids
  priority: TaskPriority[]
  assignee: string[]
  hasLabels: boolean | null
  isOverdue: boolean | null
}

interface FilterSidebarProps {
  filters: TaskFilters
  statuses: BoardStatus[]
  onChange: (filters: TaskFilters) => void
  onClear: () => void
}

export function FilterSidebar({ filters, statuses, onChange, onClear }: FilterSidebarProps) {
  const { data: users = [] } = useUsers()

  const toggleStatus = (statusId: string) => {
    const newStatuses = filters.status.includes(statusId)
      ? filters.status.filter((s) => s !== statusId)
      : [...filters.status, statusId]
    onChange({ ...filters, status: newStatuses })
  }

  const togglePriority = (priority: TaskPriority) => {
    const newPriorities = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority]
    onChange({ ...filters, priority: newPriorities })
  }

  const toggleAssignee = (userId: string) => {
    const newAssignees = filters.assignee.includes(userId)
      ? filters.assignee.filter((a) => a !== userId)
      : [...filters.assignee, userId]
    onChange({ ...filters, assignee: newAssignees })
  }

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.assignee.length > 0 ||
    filters.hasLabels !== null ||
    filters.isOverdue !== null

  return (
    <div className="w-64 bg-white rounded-lg border border-gray-200 p-4 space-y-6 h-fit sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
        <div className="space-y-1.5">
          {statuses.map((status) => (
            <FilterCheckbox
              key={status.id}
              label={status.name}
              checked={filters.status.includes(status.id)}
              onChange={() => toggleStatus(status.id)}
            />
          ))}
        </div>
      </div>

      {/* Priority Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Priority</h4>
        <div className="space-y-1.5">
          <FilterCheckbox
            label={<><Circle className="w-3 h-3 inline fill-red-500 text-red-500" /> Urgent</>}
            checked={filters.priority.includes('urgent')}
            onChange={() => togglePriority('urgent')}
          />
          <FilterCheckbox
            label={<><Circle className="w-3 h-3 inline fill-orange-500 text-orange-500" /> High</>}
            checked={filters.priority.includes('high')}
            onChange={() => togglePriority('high')}
          />
          <FilterCheckbox
            label={<><Circle className="w-3 h-3 inline fill-yellow-500 text-yellow-500" /> Medium</>}
            checked={filters.priority.includes('medium')}
            onChange={() => togglePriority('medium')}
          />
          <FilterCheckbox
            label={<><Circle className="w-3 h-3 inline fill-blue-500 text-blue-500" /> Low</>}
            checked={filters.priority.includes('low')}
            onChange={() => togglePriority('low')}
          />
        </div>
      </div>

      {/* Assignee Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Assignee</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          <FilterCheckbox
            label="Unassigned"
            checked={filters.assignee.includes('unassigned')}
            onChange={() => toggleAssignee('unassigned')}
          />
          {users.map((user) => (
            <FilterCheckbox
              key={user.user_id}
              label={user.email}
              checked={filters.assignee.includes(user.user_id)}
              onChange={() => toggleAssignee(user.user_id)}
            />
          ))}
        </div>
      </div>

      {/* Quick Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Filters</h4>
        <div className="space-y-1.5">
          <FilterCheckbox
            label={<><Calendar className="w-3 h-3 inline" /> Overdue</>}
            checked={filters.isOverdue === true}
            onChange={() => onChange({ ...filters, isOverdue: filters.isOverdue === true ? null : true })}
          />
          <FilterCheckbox
            label={<><Tag className="w-3 h-3 inline" /> Has Labels</>}
            checked={filters.hasLabels === true}
            onChange={() => onChange({ ...filters, hasLabels: filters.hasLabels === true ? null : true })}
          />
        </div>
      </div>
    </div>
  )
}

interface FilterCheckboxProps {
  label: React.ReactNode
  checked: boolean
  onChange: () => void
}

function FilterCheckbox({ label, checked, onChange }: FilterCheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700 group-hover:text-gray-900 select-none truncate">
        {label}
      </span>
    </label>
  )
}
