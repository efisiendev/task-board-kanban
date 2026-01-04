export const COLORS = {
  primary: '#3B82F6',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  teal: '#14B8A6',
} as const

export const COLOR_PALETTE = [
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Orange', hex: '#F59E0B' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Teal', hex: '#14B8A6' },
] as const

export const SPACING = {
  page: {
    x: 'px-4 md:px-6',
    y: 'py-6 md:py-8',
    xy: 'px-4 md:px-6 py-6 md:py-8',
  },
  section: {
    x: 'px-6',
    y: 'py-4',
    xy: 'px-6 py-4',
  },
  card: {
    x: 'px-4',
    y: 'py-3',
    xy: 'px-4 py-3',
  },
} as const

export const GRID_COLS = {
  projects: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  tasks: 'grid-cols-1 md:grid-cols-2',
} as const

export const DEFAULTS = {
  boardColor: COLORS.primary,
  eventColor: COLORS.primary,
} as const

export const PRIORITY_COLORS = {
  low: 'bg-blue-200 text-blue-900',
  medium: 'bg-yellow-200 text-yellow-900',
  high: 'bg-orange-200 text-orange-900',
  urgent: 'bg-red-200 text-red-900',
} as const

export const PRIORITY_COLORS_TABLE = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
} as const

// Priority icons are now in src/lib/icons.tsx
// Use priorityIcons from there with appropriate color classes

export const STATUS_COLOR_OPTIONS = [
  { value: 'gray', label: 'Gray', class: 'bg-gray-500' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
] as const
