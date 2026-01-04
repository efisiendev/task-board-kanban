import { ReactNode } from 'react'

interface SimplePageLayoutProps {
  children: ReactNode
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl'
}

export function SimplePageLayout({ children, maxWidth = '7xl' }: SimplePageLayoutProps) {
  const maxWidthClass = maxWidth === 'full' ? 'w-full' : `max-w-${maxWidth}`

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className={`${maxWidthClass} mx-auto px-4 py-6 md:py-8`}>
        {children}
      </div>
    </div>
  )
}

interface SplitPageLayoutProps {
  main: ReactNode
  sidebar?: ReactNode
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl'
}

export function SplitPageLayout({ main, sidebar, maxWidth = '7xl' }: SplitPageLayoutProps) {
  const maxWidthClass = maxWidth === 'full' ? 'w-full' : `max-w-${maxWidth}`

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className={`${maxWidthClass} mx-auto px-4 py-6 md:py-8`}>
          {main}
        </div>
      </div>
      {sidebar}
    </div>
  )
}
