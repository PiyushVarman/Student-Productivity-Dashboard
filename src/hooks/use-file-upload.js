import { useState, useRef, useCallback } from "react"

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export function useFileUpload({
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024,
  accept = "*",
  multiple = true,
  initialFiles = [],
  onFilesChange,
} = {}) {
  const [files, setFiles] = useState(
    initialFiles.map((file) => ({
      ...file,
      file: { name: file.name, size: file.size, type: file.type },
      preview: file.url,
    }))
  )
  const [errors, setErrors] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const validateFiles = (incomingFiles) => {
    const newErrors = []
    const validFiles = []

    if (files.length + incomingFiles.length > maxFiles) {
      newErrors.push(`You can only upload a maximum of ${maxFiles} files.`)
      return { validFiles: [], errors: newErrors }
    }

    for (const file of incomingFiles) {
      if (file.size > maxSize) {
        newErrors.push(`File "${file.name}" exceeds the maximum size of ${formatBytes(maxSize)}.`)
        continue
      }
      validFiles.push({
        id: crypto.randomUUID(),
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      })
    }

    return { validFiles, errors: newErrors }
  }

  const addFiles = (incomingFiles) => {
    const { validFiles, errors: validationErrors } = validateFiles(Array.from(incomingFiles))
    setErrors(validationErrors)

    if (validFiles.length > 0) {
      const updated = multiple ? [...files, ...validFiles] : validFiles
      setFiles(updated)
      onFilesChange?.(updated)
    }
  }

  const removeFile = (id) => {
    const updated = files.filter((f) => f.id !== id)
    setFiles(updated)
    onFilesChange?.(updated)
  }

  const clearFiles = () => {
    setFiles([])
    setErrors([])
    onFilesChange?.([])
  }

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }, [files])

  const openFileDialog = () => {
    if (inputRef.current) {
      inputRef.current.click()
    }
  }

  const getInputProps = () => ({
    type: "file",
    ref: inputRef,
    accept,
    multiple,
    onChange: (e) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files)
      }
    },
  })

  return {
    isDragging,
    errors,
    files,
    removeFile,
    clearFiles,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    openFileDialog,
    getInputProps,
  }
}