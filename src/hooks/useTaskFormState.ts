import { useState, useEffect, useRef } from 'react'
import { TaskPriority } from '../types'

export interface TaskFormData {
  title: string
  description: string
  priority: TaskPriority | null
  assigned_to: string | null
  due_date: string | null
  start_date: string | null
  labels: string[] | null
  estimated_time: number | null
  actual_time: number | null
}

interface UseTaskFormStateOptions {
  initialData?: Partial<TaskFormData> | null
  id?: string
  lastEditTimeRef?: React.MutableRefObject<number>
}

export function useTaskFormState({ initialData, id, lastEditTimeRef }: UseTaskFormStateOptions = {}) {
  // Track initial ID to detect when editing different item
  // PENTING: Mulai dari undefined biar first render dianggap "new item" dan sync data
  const initialIdRef = useRef<string | undefined>(undefined)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority | null>(null)
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [labelInput, setLabelInput] = useState('')
  const [labels, setLabels] = useState<string[]>([])
  const [estimatedTime, setEstimatedTime] = useState('')
  const [actualTime, setActualTime] = useState('')

  // Sync form state with initialData when it changes or new item is edited
  // Proteksi: Jangan overwrite jika user sedang mengetik (dalam 2 detik terakhir)
  useEffect(() => {
    const isNewItem = id !== initialIdRef.current
    if (isNewItem) {
      initialIdRef.current = id
    }

    // Cek apakah user sedang aktif mengetik
    const timeSinceLastEdit = lastEditTimeRef ? Date.now() - lastEditTimeRef.current : Infinity
    const isActivelyEditing = timeSinceLastEdit < 1000 // 1 detik proteksi (2x auto-save debounce)

    // Hanya sync jika: item baru dibuka ATAU user tidak sedang mengetik
    // Ini mencegah Realtime update menimpa input user
    if (isNewItem || !isActivelyEditing) {
      if (initialData) {
        setTitle(initialData.title || '')
        setDescription(initialData.description || '')
        setPriority(initialData.priority || null)
        setAssignedTo(initialData.assigned_to || '')
        setDueDate(initialData.due_date || '')
        setStartDate(initialData.start_date || '')
        setLabels(initialData.labels || [])
        setEstimatedTime(initialData.estimated_time?.toString() || '')
        setActualTime(initialData.actual_time?.toString() || '')
      } else if (isNewItem && !id) {
        // Reset form HANYA untuk create mode (tidak ada id)
        // Jangan reset saat buka existing task (ada id) walau initialData belum ready
        setTitle('')
        setDescription('')
        setPriority(null)
        setAssignedTo('')
        setDueDate('')
        setStartDate('')
        setLabels([])
        setEstimatedTime('')
        setActualTime('')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, initialData?.title, initialData?.description, initialData?.priority])

  // Label management
  const handleAddLabel = (onSave?: () => void) => {
    if (labelInput.trim() && !labels.includes(labelInput.trim())) {
      setLabels([...labels, labelInput.trim()])
      setLabelInput('')
      onSave?.()
    }
  }

  const handleRemoveLabel = (labelToRemove: string, onSave?: () => void) => {
    setLabels(labels.filter((l) => l !== labelToRemove))
    onSave?.()
  }

  // Get current form data
  const getFormData = (): TaskFormData => ({
    title,
    description,
    priority,
    assigned_to: assignedTo || null,
    due_date: dueDate || null,
    start_date: startDate || null,
    labels: labels.length > 0 ? labels : null,
    estimated_time: estimatedTime ? parseInt(estimatedTime) : null,
    actual_time: actualTime ? parseInt(actualTime) : null,
  })

  // Check if form has required data
  const isValid = () => title.trim().length > 0

  return {
    // State values
    title,
    description,
    priority,
    assignedTo,
    dueDate,
    startDate,
    labelInput,
    labels,
    estimatedTime,
    actualTime,

    // Setters
    setTitle,
    setDescription,
    setPriority,
    setAssignedTo,
    setDueDate,
    setStartDate,
    setLabelInput,
    setLabels,
    setEstimatedTime,
    setActualTime,

    // Helpers
    handleAddLabel,
    handleRemoveLabel,
    getFormData,
    isValid,
    initialIdRef,
  }
}
