import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function MarkdownEditor({ content, onChange, placeholder = 'Start writing markdown...' }: MarkdownEditorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      {/* Left: Markdown Input */}
      <div className="border-r border-gray-200">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700">📝 Markdown Editor</h4>
          <p className="text-xs text-gray-500 mt-1">
            Use markdown syntax: **bold**, *italic*, # heading, - list, [link](url)
          </p>
        </div>
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-[calc(100%-60px)] p-4 text-base text-gray-700 border-none outline-none focus:ring-0 resize-none font-mono"
          placeholder={placeholder}
        />
      </div>

      {/* Right: Live Preview */}
      <div className="overflow-y-auto">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700">👁️ Live Preview</h4>
        </div>
        <div className="prose prose-slate max-w-none p-4">
          {content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          ) : (
            <p className="text-gray-400 italic">Preview will appear here...</p>
          )}
        </div>
      </div>
    </div>
  )
}
