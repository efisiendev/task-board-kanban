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
  actual_time?: number | null
}

interface UseTaskFormStateOptions {
  initialData?: Partial<TaskFormData> | null
  id?: string
}

export function useTaskFormState({ initialData, id }: UseTaskFormStateOptions = {}) {
  // Track initial ID to detect when editing different item
  const initialIdRef = useRef(id)

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
  useEffect(() => {
    if (id !== initialIdRef.current) {
      initialIdRef.current = id
    }

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
    } else {
      // Reset form for new item
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
  }, [initialData, id])

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
