"use client"

import { useEffect, useRef, useState } from "react"
import { graphConfigsApi } from "@/lib/api/graph-configs"
import type { GraphConfig } from "@/types/graph-config"
import type { GraphFilters } from "@/hooks/use-investigation-graph"

// ─── Icons ────────────────────────────────────────────────────────────────────

function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  investigationId: string
  currentFilters: GraphFilters
  currentLayout: "force" | "radial"
  activeConfigId: string | null
  onApply: (config: GraphConfig) => void
  onReset: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GraphConfigPanel({
  investigationId,
  currentFilters,
  currentLayout,
  activeConfigId,
  onApply,
  onReset,
}: Props) {
  const [open, setOpen]               = useState(false)
  const [configs, setConfigs]         = useState<GraphConfig[]>([])
  const [loadingList, setLoadingList] = useState(false)

  // Save form
  const [saveName, setSaveName]         = useState("")
  const [saving, setSaving]             = useState(false)
  const [saveError, setSaveError]       = useState<string | null>(null)
  const saveInputRef = useRef<HTMLInputElement>(null)

  // Inline rename
  const [editingId, setEditingId]       = useState<string | null>(null)
  const [editName, setEditName]         = useState("")
  const [renaming, setRenaming]         = useState(false)
  const [renameError, setRenameError]   = useState<string | null>(null)

  // Delete confirm
  const [deletingId, setDeletingId]     = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // ── Load configs when panel opens ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    setLoadingList(true)
    graphConfigsApi
      .list(investigationId)
      .then(({ data }) => setConfigs(data))
      .catch(console.error)
      .finally(() => setLoadingList(false))
  }, [open, investigationId])

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [open])

  // Focus save input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => saveInputRef.current?.focus(), 80)
  }, [open])

  // ── Save current view ─────────────────────────────────────────────────────
  async function handleSave() {
    const name = saveName.trim()
    if (!name) return
    setSaving(true)
    setSaveError(null)
    try {
      const { data } = await graphConfigsApi.create(investigationId, {
        name,
        filters: currentFilters,
        layout: currentLayout,
      })
      setConfigs((prev) => [...prev, data])
      setSaveName("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save"
      setSaveError(msg.includes("already exists") ? `"${name}" already exists` : msg)
    } finally {
      setSaving(false)
    }
  }

  // ── Rename ────────────────────────────────────────────────────────────────
  function startEdit(config: GraphConfig) {
    setEditingId(config.id)
    setEditName(config.name)
    setRenameError(null)
  }

  async function commitRename(config: GraphConfig) {
    const name = editName.trim()
    if (!name || name === config.name) { setEditingId(null); return }
    setRenaming(true)
    setRenameError(null)
    try {
      const { data } = await graphConfigsApi.update(investigationId, config.id, { name })
      setConfigs((prev) => prev.map((c) => (c.id === data.id ? data : c)))
      setEditingId(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to rename"
      setRenameError(msg.includes("already exists") ? `"${name}" already exists` : msg)
    } finally {
      setRenaming(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await graphConfigsApi.remove(investigationId, id)
      setConfigs((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isCurrentDirty =
    activeConfigId !== null &&
    (() => {
      const active = configs.find((c) => c.id === activeConfigId)
      if (!active) return false
      return (
        active.layout !== currentLayout ||
        JSON.stringify([...active.filters.relationshipTypes].sort()) !==
          JSON.stringify([...currentFilters.relationshipTypes].sort())
      )
    })()

  const configCount = configs.length

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Saved views"
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
          activeConfigId
            ? "border-zinc-900 dark:border-zinc-200 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
            : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
      >
        <BookmarkIcon filled={!!activeConfigId} />
        Views
        {configCount > 0 && (
          <span className={`rounded-full px-1.5 py-px text-[10px] font-bold leading-none ${
            activeConfigId
              ? "bg-white/20 dark:bg-zinc-900/20"
              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
          }`}>
            {configCount}
          </span>
        )}
        {isCurrentDirty && (
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Unsaved changes" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-80 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-3 py-2.5">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Saved views
            </span>
            <span className="text-[11px] text-zinc-400">
              {currentFilters.relationshipTypes.length > 0
                ? `${currentFilters.relationshipTypes.length} filter${currentFilters.relationshipTypes.length !== 1 ? "s" : ""} · ${currentLayout}`
                : `Full graph · ${currentLayout}`}
            </span>
          </div>

          {/* Config list */}
          <div className="max-h-56 overflow-y-auto">
            {loadingList ? (
              <div className="flex items-center justify-center py-6">
                <SpinnerIcon />
              </div>
            ) : configs.length === 0 ? (
              <p className="px-3 py-4 text-xs text-zinc-400 text-center">
                No saved views yet
              </p>
            ) : (
              <ul className="py-1 divide-y divide-zinc-50 dark:divide-zinc-900">
                {configs.map((cfg) => {
                  const isActive = cfg.id === activeConfigId
                  const isDeleting = deletingId === cfg.id
                  const isEditing = editingId === cfg.id
                  const relCount = cfg.filters.relationshipTypes.length

                  return (
                    <li key={cfg.id}>
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 px-3 py-2">
                          <input
                            autoFocus
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitRename(cfg)
                              if (e.key === "Escape") setEditingId(null)
                            }}
                            onBlur={() => commitRename(cfg)}
                            disabled={renaming}
                            className="flex-1 min-w-0 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                          />
                          {renaming ? <SpinnerIcon /> : (
                            <button onClick={() => commitRename(cfg)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                              <CheckIcon />
                            </button>
                          )}
                          {renameError && (
                            <span className="text-[10px] text-red-500 truncate">{renameError}</span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => onApply(cfg)}
                          disabled={isDeleting}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors group ${
                            isActive
                              ? "bg-zinc-50 dark:bg-zinc-900/60"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                          }`}
                        >
                          {/* Active indicator */}
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                            isActive ? "bg-zinc-900 dark:bg-zinc-100" : "bg-transparent"
                          }`} />

                          {/* Name + meta */}
                          <span className="flex-1 min-w-0">
                            <span className={`block text-xs font-medium truncate ${
                              isActive
                                ? "text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-700 dark:text-zinc-300"
                            }`}>
                              {cfg.name}
                            </span>
                            <span className="block text-[10px] text-zinc-400 mt-px">
                              {relCount === 0 ? "All relations" : `${relCount} rel type${relCount !== 1 ? "s" : ""}`}
                              {" · "}{cfg.layout}
                            </span>
                          </span>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => startEdit(cfg)}
                              title="Rename"
                              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <PencilIcon />
                            </button>
                            <button
                              onClick={() => handleDelete(cfg.id)}
                              disabled={isDeleting}
                              title="Delete"
                              className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-40"
                            >
                              {isDeleting ? <SpinnerIcon /> : <TrashIcon />}
                            </button>
                          </div>
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-100 dark:border-zinc-800" />

          {/* Save current view */}
          <div className="px-3 py-2.5 flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Save current view
            </p>
            <div className="flex items-center gap-1.5">
              <input
                ref={saveInputRef}
                type="text"
                value={saveName}
                onChange={(e) => { setSaveName(e.target.value); setSaveError(null) }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave() }}
                placeholder="View name…"
                disabled={saving}
                className="flex-1 min-w-0 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50"
              />
              <button
                onClick={handleSave}
                disabled={saving || !saveName.trim()}
                className="flex items-center gap-1 rounded-md bg-zinc-900 dark:bg-zinc-100 px-2.5 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {saving ? <SpinnerIcon /> : null}
                Save
              </button>
            </div>
            {saveError && (
              <p className="text-[11px] text-red-500">{saveError}</p>
            )}
          </div>

          {/* Reset */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 px-3 py-2">
            <button
              onClick={() => { onReset(); setOpen(false) }}
              className="flex items-center gap-1.5 w-full text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors py-0.5"
            >
              <ResetIcon />
              Reset to full graph
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
