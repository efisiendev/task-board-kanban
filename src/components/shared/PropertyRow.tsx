import { ReactNode } from 'react'

interface PropertyRowProps {
  label: string
  children: ReactNode
  onClick?: () => void
}

export function PropertyRow({ label, children, onClick }: PropertyRowProps) {
  return (
    <div
      className="flex items-center hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded cursor-pointer transition"
      onClick={onClick}
    >
      <div className="w-32 text-sm text-gray-600 flex-shrink-0">{label}</div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
