"use client"

import { useState, useCallback } from "react"

type ToastType = "success" | "error"

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const add = useCallback(
    (type: ToastType, message: string) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  return {
    toasts,
    dismiss,
    toast: {
      success: (message: string) => add("success", message),
      error: (message: string) => add("error", message),
    },
  }
}

function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function XCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

interface ToasterProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export function Toaster({ toasts, onDismiss }: ToasterProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm font-medium min-w-64 max-w-sm backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
            t.type === "success"
              ? "bg-white dark:bg-zinc-900 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
              : "bg-white dark:bg-zinc-900 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
          }`}
        >
          <span className="shrink-0">
            {t.type === "success" ? <CheckCircleIcon /> : <XCircleIcon />}
          </span>
          <span className="flex-1 text-zinc-800 dark:text-zinc-200">{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <XIcon />
          </button>
        </div>
      ))}
    </div>
  )
}
