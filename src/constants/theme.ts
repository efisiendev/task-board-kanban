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
