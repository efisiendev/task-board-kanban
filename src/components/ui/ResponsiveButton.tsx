interface ResponsiveButtonProps {
  icon: string
  label: string
  onClick: () => void
  active?: boolean
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md'
}

const variantClasses = {
  primary: {
    active: 'bg-blue-500 text-white border-blue-600',
    inactive: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300',
  },
  secondary: {
    active: 'bg-blue-100 text-blue-700 border-blue-300',
    inactive: 'bg-gray-200 hover:bg-gray-300 text-gray-900 border-gray-300',
  },
}

const sizeClasses = {
  sm: 'px-2 md:px-3 py-1.5 text-xs md:text-sm',
  md: 'px-3 md:px-4 py-2 text-sm md:text-base',
}

export function ResponsiveButton({
  icon,
  label,
  onClick,
  active = false,
  variant = 'secondary',
  size = 'md',
}: ResponsiveButtonProps) {
  const variantClass = active ? variantClasses[variant].active : variantClasses[variant].inactive

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} ${variantClass} rounded-lg font-medium transition whitespace-nowrap border`}
    >
      <span className="md:hidden">{icon}</span>
      <span className="hidden md:inline">{icon} {label}</span>
    </button>
  )
}
