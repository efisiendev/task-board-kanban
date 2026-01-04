import { viewIcons } from '../lib/icons'
import { LucideIcon } from 'lucide-react'

type ViewType = 'kanban' | 'table' | 'list' | 'calendar'

interface ViewSwitcherProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

const views: { type: ViewType; icon: LucideIcon; label: string }[] = [
  { type: 'kanban', icon: viewIcons.kanban, label: 'Kanban' },
  { type: 'table', icon: viewIcons.table, label: 'Table' },
  { type: 'list', icon: viewIcons.list, label: 'List' },
  { type: 'calendar', icon: viewIcons.calendar, label: 'Calendar' },
]

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
      {views.map(({ type, icon: Icon, label }) => (
        <button
          key={type}
          onClick={() => onViewChange(type)}
          className={`px-2 md:px-3 py-1.5 rounded text-xs md:text-sm font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
            currentView === type
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
