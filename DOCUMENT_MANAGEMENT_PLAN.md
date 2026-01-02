# 📚 Document Management - Complete Implementation Plan

## 🎯 Goal
Transform TaskFlow menjadi **all-in-one workspace** dengan document management lengkap seperti Notion/Confluence.

---

## ✅ Current State Analysis

### **Yang Sudah Ada:**

#### 1. **Board Pages** ✅
- Table: `board_pages`
- Features:
  - ✅ Folder & page structure (parent_id)
  - ✅ Rich text editor (Markdown)
  - ✅ Create/Read/Update/Delete
  - ✅ Realtime collaboration
  - ✅ RLS policies
- Location: Board sidebar
- Use case: Team wiki, documentation

#### 2. **Task Pages** ✅
- Table: `task_pages`
- Features:
  - ✅ Plain pages (no folders)
  - ✅ Rich text editor
  - ✅ Auto-save
  - ✅ Realtime sync
- Location: TaskModal → Pages tab
- Use case: Task documentation, requirements

### **Yang Belum Ada:** ❌

1. ❌ **File Attachments** (upload & display files)
2. ❌ **File Preview** (image, PDF, video dalam page)
3. ❌ **File Storage** (Supabase Storage setup)
4. ❌ **Search across pages**
5. ❌ **Page templates**
6. ❌ **Version history**
7. ❌ **Export/Import**
8. ❌ **Breadcrumb navigation**
9. ❌ **Page permissions** (granular)
10. ❌ **Emoji icons** untuk pages/folders

---

## 🚀 Implementation Plan

### **PHASE 1: File Attachments (PRIORITY)** 🔥

#### **A. Database Schema**

```sql
-- Migration 025: File Attachments
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic relation (bisa attach ke page atau task)
  entity_type TEXT NOT NULL CHECK (entity_type IN ('board_page', 'task_page', 'task', 'comment')),
  entity_id UUID NOT NULL,

  -- File info
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL, -- bytes
  file_type TEXT NOT NULL, -- MIME type (image/png, application/pdf, etc)
  storage_path TEXT NOT NULL UNIQUE, -- path di Supabase Storage

  -- Preview/thumbnail
  thumbnail_path TEXT, -- untuk image/video

  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Indexes
  CONSTRAINT attachments_entity_check CHECK (
    (entity_type = 'board_page' AND entity_id IN (SELECT id FROM board_pages)) OR
    (entity_type = 'task_page' AND entity_id IN (SELECT id FROM task_pages)) OR
    (entity_type = 'task' AND entity_id IN (SELECT id FROM tasks)) OR
    (entity_type = 'comment' AND entity_id IN (SELECT id FROM task_comments))
  )
);

CREATE INDEX idx_attachments_entity ON public.attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_uploaded_by ON public.attachments(uploaded_by);
CREATE INDEX idx_attachments_type ON public.attachments(file_type);

-- Enable RLS
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view attachments in their boards/tasks"
  ON public.attachments FOR SELECT
  USING (
    CASE entity_type
      WHEN 'board_page' THEN entity_id IN (
        SELECT bp.id FROM board_pages bp
        JOIN boards b ON bp.board_id = b.id
        LEFT JOIN board_members bm ON b.id = bm.board_id
        WHERE b.user_id = auth.uid() OR bm.user_id = auth.uid()
      )
      WHEN 'task_page' THEN entity_id IN (
        SELECT tp.id FROM task_pages tp
        JOIN tasks t ON tp.task_id = t.id
        JOIN boards b ON t.board_id = b.id
        LEFT JOIN board_members bm ON b.id = bm.board_id
        WHERE b.user_id = auth.uid() OR bm.user_id = auth.uid()
      )
      WHEN 'task' THEN entity_id IN (
        SELECT t.id FROM tasks t
        JOIN boards b ON t.board_id = b.id
        LEFT JOIN board_members bm ON b.id = bm.board_id
        WHERE b.user_id = auth.uid() OR bm.user_id = auth.uid()
      )
      ELSE false
    END
  );

CREATE POLICY "Users can upload attachments to their boards/tasks"
  ON public.attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    CASE entity_type
      WHEN 'board_page' THEN entity_id IN (
        SELECT bp.id FROM board_pages bp
        JOIN boards b ON bp.board_id = b.id
        LEFT JOIN board_members bm ON b.id = bm.board_id
        WHERE b.user_id = auth.uid() OR bm.user_id = auth.uid()
      )
      WHEN 'task_page' THEN entity_id IN (
        SELECT tp.id FROM task_pages tp
        JOIN tasks t ON tp.task_id = t.id
        JOIN boards b ON t.board_id = b.id
        LEFT JOIN board_members bm ON b.id = bm.board_id
        WHERE b.user_id = auth.uid() OR bm.user_id = auth.uid()
      )
      ELSE true
    END
  );

CREATE POLICY "Users can delete their own attachments"
  ON public.attachments FOR DELETE
  USING (uploaded_by = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.attachments;

GRANT ALL ON public.attachments TO authenticated;
GRANT ALL ON public.attachments TO service_role;
```

#### **B. Supabase Storage Setup**

```sql
-- Storage bucket untuk attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false);

-- Storage policies
CREATE POLICY "Users can upload to attachments bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view attachments in their boards"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'attachments' AND
    owner = auth.uid()
  );
```

#### **C. React Hooks**

```typescript
// src/hooks/useAttachments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type EntityType = 'board_page' | 'task_page' | 'task' | 'comment'

export interface Attachment {
  id: string
  entity_type: EntityType
  entity_id: string
  file_name: string
  file_size: number
  file_type: string
  storage_path: string
  thumbnail_path?: string
  uploaded_by: string
  uploaded_at: string
}

// Fetch attachments
export function useAttachments(entityType: EntityType, entityId: string) {
  return useQuery({
    queryKey: ['attachments', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      return data as Attachment[]
    },
  })
}

// Upload attachment
export function useUploadAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      entityType,
      entityId,
    }: {
      file: File
      entityType: EntityType
      entityId: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${entityType}/${entityId}/${fileName}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Create attachment record
      const { data, error: dbError } = await supabase
        .from('attachments')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: filePath,
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (dbError) throw dbError
      return data as Attachment
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['attachments', variables.entityType, variables.entityId],
      })
    },
  })
}

// Delete attachment
export function useDeleteAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attachment: Attachment) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('attachments')
        .remove([attachment.storage_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachment.id)

      if (dbError) throw dbError
    },
    onSuccess: (_data, attachment) => {
      queryClient.invalidateQueries({
        queryKey: ['attachments', attachment.entity_type, attachment.entity_id],
      })
    },
  })
}

// Get download URL
export async function getAttachmentUrl(storagePath: string): Promise<string> {
  const { data } = await supabase.storage
    .from('attachments')
    .createSignedUrl(storagePath, 3600) // 1 hour

  if (!data) throw new Error('Failed to get URL')
  return data.signedUrl
}

// Get public URL (untuk images di editor)
export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from('attachments')
    .getPublicUrl(storagePath)

  return data.publicUrl
}
```

#### **D. UI Components**

##### **1. AttachmentUploader Component**

```tsx
// src/components/AttachmentUploader.tsx
import { useState } from 'react'
import { useUploadAttachment, EntityType } from '../hooks/useAttachments'

interface AttachmentUploaderProps {
  entityType: EntityType
  entityId: string
  onUploadComplete?: () => void
}

export function AttachmentUploader({
  entityType,
  entityId,
  onUploadComplete,
}: AttachmentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const uploadMutation = useUploadAttachment()

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      try {
        await uploadMutation.mutateAsync({
          file,
          entityType,
          entityId,
        })
      } catch (error) {
        console.error('Upload failed:', error)
        alert(`Failed to upload ${file.name}`)
      }
    }

    onUploadComplete?.()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer flex flex-col items-center gap-2"
      >
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-blue-600">Click to upload</span> or
          drag and drop
        </div>
        <p className="text-xs text-gray-500">
          PNG, JPG, PDF, DOCX up to 10MB
        </p>
      </label>

      {uploadMutation.isPending && (
        <div className="mt-4">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Uploading...</span>
          </div>
        </div>
      )}
    </div>
  )
}
```

##### **2. AttachmentList Component**

```tsx
// src/components/AttachmentList.tsx
import { useAttachments, useDeleteAttachment, getAttachmentUrl, EntityType } from '../hooks/useAttachments'
import { formatBytes } from '../utils/format'
import { useState } from 'react'

interface AttachmentListProps {
  entityType: EntityType
  entityId: string
}

export function AttachmentList({ entityType, entityId }: AttachmentListProps) {
  const { data: attachments = [], isLoading } = useAttachments(entityType, entityId)
  const deleteMutation = useDeleteAttachment()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownload = async (attachment: Attachment) => {
    try {
      setDownloadingId(attachment.id)
      const url = await getAttachmentUrl(attachment.storage_path)

      // Download file
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.file_name
      a.click()
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download file')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm(`Delete ${attachment.file_name}?`)) return

    try {
      await deleteMutation.mutateAsync(attachment)
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete file')
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    if (fileType.includes('zip') || fileType.includes('archive')) return '📦'
    return '📎'
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading attachments...</div>
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        <p className="text-sm">No attachments yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition group"
        >
          {/* File icon */}
          <span className="text-2xl flex-shrink-0">
            {getFileIcon(attachment.file_type)}
          </span>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {attachment.file_name}
            </p>
            <p className="text-xs text-gray-500">
              {formatBytes(attachment.file_size)} • {new Date(attachment.uploaded_at).toLocaleDateString()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => handleDownload(attachment)}
              disabled={downloadingId === attachment.id}
              className="p-1.5 hover:bg-gray-100 rounded transition"
              title="Download"
            >
              {downloadingId === attachment.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
            </button>

            <button
              onClick={() => handleDelete(attachment)}
              disabled={deleteMutation.isPending}
              className="p-1.5 hover:bg-red-50 rounded transition"
              title="Delete"
            >
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

##### **3. Image Preview in Editor (Tiptap Extension)**

```typescript
// src/components/RichTextEditor.tsx
// Add image upload handler

const editor = useEditor({
  extensions: [
    // ... existing extensions
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg cursor-pointer',
      },
    }),
  ],
  // ... existing config
})

// Add image upload button in toolbar
<button
  onClick={async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(`images/${Math.random()}.${file.name.split('.').pop()}`, file)

      if (error) {
        alert('Failed to upload image')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(data.path)

      // Insert image in editor
      editor.chain().focus().setImage({ src: publicUrl }).run()
    }
    input.click()
  }}
  className="p-2 rounded hover:bg-gray-200 transition"
  title="Add Image"
>
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
  </svg>
</button>
```

---

### **PHASE 2: File Preview & Gallery**

#### Features:
1. **Image Gallery**
   - Lightbox untuk view images
   - Zoom in/out
   - Navigate between images

2. **PDF Viewer**
   - Inline PDF preview
   - Page navigation
   - Download option

3. **Video Player**
   - Inline video player
   - Controls
   - Thumbnail generation

4. **Document Preview**
   - Office files (DOCX, XLSX, PPTX)
   - Preview with Google Docs Viewer

---

### **PHASE 3: Enhanced Navigation**

#### Features:
1. **Breadcrumb Navigation**
2. **Page Tree Sidebar** (collapsible folders)
3. **Quick Search** (Cmd+K)
4. **Recent Pages**
5. **Favorites/Bookmarks**

---

## 📊 Timeline Estimate

| Phase | Features | Effort | Priority |
|-------|----------|--------|----------|
| **Phase 1** | File Upload/Download/Delete | 1-2 hari | 🔴 HIGH |
| **Phase 2** | File Preview & Gallery | 1 hari | 🟡 MEDIUM |
| **Phase 3** | Enhanced Navigation | 1 hari | 🟢 LOW |

**Total:** 3-4 hari kerja

---

## 🎯 Success Metrics

- ✅ Users can upload files to pages/tasks
- ✅ Files display dengan preview (images)
- ✅ Download & delete files works
- ✅ File size limits enforced (10MB)
- ✅ Storage quota management
- ✅ Performance: Upload <5s for 5MB file

---

Mau mulai implement Phase 1 (File Attachments) sekarang?
