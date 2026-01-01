import React, { useState } from 'react'
import { BoardPage } from '../types'

interface PageTreeProps {
  pages: BoardPage[]
  selectedPageId: string | null
  onSelectPage: (page: BoardPage | null) => void
  onCreatePage: (parentId: string | null) => void
  onCreateFolder: (parentId: string | null) => void
  onDeletePage: (page: BoardPage) => void
}

export function PageTree({
  pages,
  selectedPageId,
  onSelectPage,
  onCreatePage,
  onCreateFolder,
  onDeletePage,
}: PageTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter pages based on search
  const filteredPages = searchQuery.trim()
    ? pages.filter((page) => {
        const matchTitle = page.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchContent = page.content?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchTitle || matchContent
      })
    : pages

  // Build tree structure
  const buildTree = (parentId: string | null = null): BoardPage[] => {
    return filteredPages
      .filter((page) => page.parent_id === parentId)
      .sort((a, b) => a.position - b.position)
  }

  // Auto-expand folders when searching
  const autoExpandForSearch = () => {
    if (searchQuery.trim() && filteredPages.length > 0) {
      const folderIds = new Set<string>()
      filteredPages.forEach((page) => {
        let currentPage: BoardPage | undefined = page
        while (currentPage?.parent_id) {
          folderIds.add(currentPage.parent_id)
          currentPage = pages.find((p) => p.id === currentPage!.parent_id)
        }
      })
      setExpandedFolders(folderIds)
    }
  }

  // Trigger auto-expand when search changes
  React.useEffect(() => {
    autoExpandForSearch()
  }, [searchQuery])

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const renderTreeItem = (page: BoardPage, level: number = 0) => {
    const isFolder = page.type === 'folder'
    const isExpanded = expandedFolders.has(page.id)
    const isSelected = selectedPageId === page.id
    const children = isFolder ? buildTree(page.id) : []

    return (
      <div key={page.id}>
        {/* Page/Folder Item */}
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 group ${
            isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {/* Expand/Collapse Icon for folders */}
          {isFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(page.id)
              }}
              className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
              aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
            >
              <svg
                className={`w-3 h-3 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {!isFolder && <div className="w-4" />}

          {/* Icon */}
          <span className="text-sm flex-shrink-0">{isFolder ? '📁' : '📄'}</span>

          {/* Title */}
          <span
            onClick={() => !isFolder && onSelectPage(page)}
            className="flex-1 text-sm truncate"
          >
            {page.title}
          </span>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm(`Delete "${page.title}"?`)) {
                onDeletePage(page)
              }
            }}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        {/* Children (if folder is expanded) */}
        {isFolder && isExpanded && (
          <div>{children.map((child) => renderTreeItem(child, level + 1))}</div>
        )}
      </div>
    )
  }

  const rootPages = buildTree(null)

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Pages</h3>
          <div className="relative">
            <button
              onClick={() => setShowNewMenu(!showNewMenu)}
              className="p-1 hover:bg-gray-100 rounded transition"
              aria-label="New page or folder"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showNewMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNewMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <button
                    onClick={() => {
                      onCreatePage(null)
                      setShowNewMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>📄</span> New Page
                  </button>
                  <button
                    onClick={() => {
                      onCreateFolder(null)
                      setShowNewMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                  >
                    <span>📁</span> New Folder
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pages..."
            className="w-full px-3 py-1.5 pl-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-2 top-2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {searchQuery && rootPages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No results found</p>
            <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
          </div>
        ) : rootPages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No pages yet</p>
            <button
              onClick={() => onCreatePage(null)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700"
            >
              Create your first page
            </button>
          </div>
        ) : (
          <>
            {searchQuery && (
              <div className="mb-2 px-2 py-1 text-xs text-gray-500">
                {filteredPages.length} result{filteredPages.length !== 1 ? 's' : ''} found
              </div>
            )}
            {rootPages.map((page) => renderTreeItem(page))}
          </>
        )}
      </div>
    </div>
  )
}
