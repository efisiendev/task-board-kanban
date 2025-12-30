import { useState } from 'react'
import { Task } from '../types'
import { useUserProfile } from '../hooks/useUsers'

interface TableViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

type SortField = 'title' | 'status' | 'priority' | 'assigned_to' | 'due_date' | 'created_at'
type SortDirection = 'asc' | 'desc'

const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
const statusOrder = { to_do: 1, in_progress: 2, done: 3 }

export function TableView({ tasks, onTaskClick }: TableViewProps) {
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    let aVal: string | number | null | undefined
    let bVal: string | number | null | undefined

    // Special handling for priority
    if (sortField === 'priority') {
      aVal = a.priority ? priorityOrder[a.priority] : 0
      bVal = b.priority ? priorityOrder[b.priority] : 0
    }
    // Special handling for status - using board_status name
    else if (sortField === 'status') {
      aVal = a.board_status?.name || ''
      bVal = b.board_status?.name || ''
    }
    // Default field access
    else {
      aVal = a[sortField]
      bVal = b[sortField]
    }

    // Handle null values
    if (!aVal && !bVal) return 0
    if (!aVal) return 1
    if (!bVal) return -1

    // String comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    // Number comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    }

    return 0
  })

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <TableHeader label="Title" field="title" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              <TableHeader label="Status" field="status" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} width="150px" />
              <TableHeader label="Priority" field="priority" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} width="120px" />
              <TableHeader label="Assignee" field="assigned_to" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} width="200px" />
              <TableHeader label="Due Date" field="due_date" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} width="120px" />
              <TableHeader label="Labels" field="title" sortField={sortField} sortDirection={sortDirection} onSort={() => {}} width="200px" sortable={false} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  No tasks yet. Create your first task to get started.
                </td>
              </tr>
            ) : (
              sortedTasks.map((task) => (
                <TableRow key={task.id} task={task} onClick={() => onTaskClick(task)} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface TableHeaderProps {
  label: string
  field: SortField
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
  width?: string
  sortable?: boolean
}

function TableHeader({ label, field, sortField, sortDirection, onSort, width, sortable = true }: TableHeaderProps) {
  const isActive = sortField === field

  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider ${
        sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
      }`}
      style={{ width }}
      onClick={() => sortable && onSort(field)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {sortable && (
          <span className="text-gray-400">
            {isActive ? (
              sortDirection === 'asc' ? '↑' : '↓'
            ) : (
              '↕'
            )}
          </span>
        )}
      </div>
    </th>
  )
}

interface TableRowProps {
  task: Task
  onClick: () => void
}

function TableRow({ task, onClick }: TableRowProps) {
  const { data: assigneeProfile } = useUserProfile(task.assigned_to)

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }

  const statusColors = {
    to_do: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.board_status?.name !== 'Done'

  return (
    <tr
      onClick={onClick}
      className="hover:bg-gray-50 cursor-pointer transition"
    >
      {/* Title */}
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{task.title}</div>
            {task.description && (
              <div className="text-xs text-gray-500 truncate mt-0.5">{task.description}</div>
            )}
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: task.board_status?.color, color: '#fff' }}
        >
          {task.board_status?.name || 'No Status'}
        </span>
      </td>

      {/* Priority */}
      <td className="px-4 py-3">
        {task.priority ? (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </td>

      {/* Assignee */}
      <td className="px-4 py-3">
        {assigneeProfile ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
              {assigneeProfile.email[0].toUpperCase()}
            </div>
            <span className="text-sm text-gray-900 truncate">
              {assigneeProfile.email}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">Unassigned</span>
        )}
      </td>

      {/* Due Date */}
      <td className="px-4 py-3">
        {task.due_date ? (
          <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
            {formatDate(task.due_date)}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </td>

      {/* Labels */}
      <td className="px-4 py-3">
        {task.labels && task.labels.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {task.labels.slice(0, 2).map((label) => (
              <span
                key={label}
                className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {label}
              </span>
            ))}
            {task.labels.length > 2 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                +{task.labels.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </td>
    </tr>
  )
}
