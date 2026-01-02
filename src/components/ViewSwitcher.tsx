type ViewType = 'kanban' | 'table' | 'list' | 'calendar'

interface ViewSwitcherProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

const views: { type: ViewType; icon: string; label: string }[] = [
  { type: 'kanban', icon: '📊', label: 'Kanban' },
  { type: 'table', icon: '📋', label: 'Table' },
  { type: 'list', icon: '📝', label: 'List' },
  { type: 'calendar', icon: '📅', label: 'Calendar' },
]

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
      {views.map(({ type, icon, label }) => (
        <button
          key={type}
          onClick={() => onViewChange(type)}
          className={`px-2 md:px-3 py-1.5 rounded text-xs md:text-sm font-medium transition whitespace-nowrap ${
            currentView === type
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="hidden sm:inline">{icon} {label}</span>
          <span className="sm:hidden">{icon}</span>
        </button>
      ))}
    </div>
  )
}
