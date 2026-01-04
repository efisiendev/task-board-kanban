import {
  FileText,
  File,
  Image,
  Video,
  Music,
  FileSpreadsheet,
  Presentation,
  Paperclip,
  Folder,
  Link2,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Calendar,
  Search,
  Users,
  LogOut,
  Edit,
  Trash2,
  AlertTriangle,
  Sparkles,
  CheckCircle,
  RotateCcw,
  User,
  Ban,
  ShieldBan,
  ArrowRight,
  Clock,
  Type,
  Pin,
  Kanban,
  Table2,
  List,
  LucideIcon,
} from 'lucide-react'

// File type icons
export const fileTypeIcons: Record<string, LucideIcon> = {
  image: Image,
  pdf: FileText,
  spreadsheet: FileSpreadsheet,
  document: FileText,
  presentation: Presentation,
  video: Video,
  audio: Music,
  attachment: Paperclip,
  file: File,
}

// Activity type icons
export const activityIcons: Record<string, LucideIcon> = {
  created: Sparkles,
  commented: MessageSquare,
  assigned: User,
  updated: Edit,
  moved: ArrowRight,
  completed: CheckCircle,
  reopened: RotateCcw,
  default: Pin,
}

// Relation type icons
export const relationIcons: Record<string, LucideIcon> = {
  blocks: Ban,
  blocked_by: ShieldBan,
  relates_to: Link2,
  duplicates: File,
  duplicate_of: FileText,
}

// View type icons
export const viewIcons = {
  kanban: Kanban,
  table: Table2,
  list: List,
  calendar: Calendar,
}

// Section icons
export const sectionIcons = {
  subtasks: CheckSquare,
  pages: FileText,
  relations: Link2,
  comments: MessageSquare,
  activity: BarChart3,
  folder: Folder,
}

// Action icons
export const actionIcons = {
  edit: Edit,
  delete: Trash2,
  filter: Search,
  members: Users,
  logout: LogOut,
  warning: AlertTriangle,
  link: Link2,
  calendar: Calendar,
  time: Clock,
  markdown: Type,
}

// Helper function to get file type icon
export function getFileTypeIcon(mimeType: string): LucideIcon {
  if (mimeType.startsWith('image/')) return fileTypeIcons.image
  if (mimeType.startsWith('video/')) return fileTypeIcons.video
  if (mimeType.startsWith('audio/')) return fileTypeIcons.audio
  if (mimeType === 'application/pdf') return fileTypeIcons.pdf
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return fileTypeIcons.spreadsheet
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return fileTypeIcons.presentation
  if (mimeType.includes('document') || mimeType.includes('word')) return fileTypeIcons.document
  return fileTypeIcons.file
}

// Re-export commonly used icons
export {
  FileText,
  File,
  Image,
  Video,
  Music,
  FileSpreadsheet,
  Presentation,
  Paperclip,
  Folder,
  Link2,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Calendar,
  Search,
  Users,
  LogOut,
  Edit,
  Trash2,
  AlertTriangle,
  Sparkles,
  CheckCircle,
  RotateCcw,
  User,
  Ban,
  ShieldBan,
  ArrowRight,
  Clock,
  Type,
  Pin,
  Kanban,
  Table2,
  List,
}
