import { useState, useEffect, useRef, useCallback } from 'react'

interface UseAutoSaveOptions<T> {
  onSave: (data: T) => Promise<void>
  delay?: number
}

export function useAutoSave<T>({ onSave, delay = 500 }: UseAutoSaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const latestValuesRef = useRef<T>()
  const lastEditTimeRef = useRef<number>(Date.now())

  // Store latest values for debounced save
  const updateLatestValues = useCallback((values: T) => {
    latestValuesRef.current = values
    lastEditTimeRef.current = Date.now()
  }, [])

  // Auto-save function
  const autoSave = useCallback(
    async (data: T) => {
      setIsSaving(true)
      try {
        await onSave(data)
      } finally {
        setIsSaving(false)
      }
    },
    [onSave]
  )

  // Debounced auto-save
  const debouncedAutoSave = useCallback(
    (data: T) => {
      updateLatestValues(data)

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (latestValuesRef.current) {
          autoSave(latestValuesRef.current)
        }
      }, delay)
    },
    [autoSave, delay, updateLatestValues]
  )

  // Immediate auto-save (no debounce)
  const immediateAutoSave = useCallback(
    (data: T) => {
      updateLatestValues(data)
      autoSave(data)
    },
    [autoSave, updateLatestValues]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    isSaving,
    debouncedAutoSave,
    immediateAutoSave,
    lastEditTimeRef,
  }
}
