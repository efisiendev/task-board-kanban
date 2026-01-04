import { Search, Users, Folder, LucideIcon } from 'lucide-react'

interface HeaderActionButtonsProps {
  showFilters: {
    isOpen: boolean
    toggle: () => void
  }
  showMembers: {
    isOpen: boolean
    toggle: () => void
  }
  showPages: {
    isOpen: boolean
    toggle: () => void
  }
}

export function HeaderActionButtons({ showFilters, showMembers, showPages }: HeaderActionButtonsProps) {
  const buttons: { icon: LucideIcon; label: string; handler: { isOpen: boolean; toggle: () => void } }[] = [
    { icon: Search, label: 'Filter', handler: showFilters },
    { icon: Users, label: 'Members', handler: showMembers },
    { icon: Folder, label: 'Files & Folders', handler: showPages },
  ]

  return (
    <div className="flex gap-2 md:gap-4">
      {buttons.map(({ icon: Icon, label, handler }) => (
        <button
          key={label}
          onClick={handler.toggle}
          className={`px-3 md:px-4 py-2 rounded-lg font-medium transition text-sm md:text-base ${
            handler.isOpen
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
          }`}
        >
          <span className="md:hidden"><Icon className="w-4 h-4" /></span>
          <span className="hidden md:inline flex items-center gap-2"><Icon className="w-4 h-4" /> {label}</span>
        </button>
      ))}
    </div>
  )
}
