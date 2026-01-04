import { BoardPage } from '../../../types'
import { getFileTypeIcon } from '../../../lib/icons'

interface FilePreviewModalProps {
  file: BoardPage
  onClose: () => void
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  // Convert Google Drive URL to embed URL
  const getEmbedUrl = (url: string): string => {
    // Handle different Google Drive URL formats
    // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    // https://drive.google.com/open?id=FILE_ID
    // Convert to: https://drive.google.com/file/d/FILE_ID/preview

    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/)

    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1]
      return `https://drive.google.com/file/d/${fileId}/preview`
    }

    // If not a Google Drive URL, return as-is
    return url
  }

  const embedUrl = file.storage_path ? getEmbedUrl(file.storage_path) : ''

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {(() => {
              const Icon = getFileTypeIcon(file.mime_type || '')
              return <Icon className="w-6 h-6 text-gray-600 flex-shrink-0" />
            })()}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-900 truncate">{file.title}</h2>
              {file.mime_type && (
                <p className="text-xs text-gray-500">{file.mime_type}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Open in Google Drive */}
            {file.storage_path && (
              <a
                href={file.storage_path}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                Open in Drive
              </a>
            )}
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              allow="autoplay"
              title={file.title}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500">No preview available</p>
                {file.storage_path && (
                  <a
                    href={file.storage_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-blue-600 hover:text-blue-700"
                  >
                    Open file externally
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
