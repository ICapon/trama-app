"use client"

import { useEffect, useRef, useState } from "react"
import type { GraphFilters } from "@/hooks/use-investigation-graph"

function FilterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

interface Props {
  filters: GraphFilters
  availableRelTypes: string[]
  onChange: (filters: GraphFilters) => void
}

export function GraphFilterToolbar({ filters, availableRelTypes, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const activeCount = filters.relationshipTypes.length
  const hasAvailable = availableRelTypes.length > 0

  const visibleTypes = search.trim()
    ? availableRelTypes.filter((t) =>
        t.toLowerCase().includes(search.trim().toLowerCase())
      )
    : availableRelTypes

  // Close on outside click
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

  // Focus search when opening
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
    else setSearch("")
  }, [open])

  function toggleType(type: string) {
    const current = filters.relationshipTypes
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    onChange({ ...filters, relationshipTypes: next })
  }

  function clearAll() {
    onChange({ ...filters, relationshipTypes: [] })
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={!hasAvailable}
        title="Filter by relationship type"
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          activeCount > 0
            ? "border-zinc-900 dark:border-zinc-200 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
            : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
      >
        <FilterIcon />
        Filters
        {activeCount > 0 && (
          <span className="rounded-full bg-white/20 dark:bg-zinc-900/20 px-1.5 py-px text-[10px] font-bold leading-none">
            {activeCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-3 py-2.5">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Relationship types
              {availableRelTypes.length > 0 && (
                <span className="ml-1.5 text-zinc-400 font-normal">
                  ({availableRelTypes.length})
                </span>
              )}
            </span>
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                <XIcon />
                Clear
              </button>
            )}
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search types…"
              className="w-full rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          {/* Checkbox list */}
          <div className="max-h-64 overflow-y-auto">
            {visibleTypes.length === 0 ? (
              <p className="px-3 py-4 text-xs text-zinc-400 text-center">
                {search ? "No matches" : "No relationship types in this graph"}
              </p>
            ) : (
              <ul className="py-1">
                {visibleTypes.map((type) => {
                  const checked = filters.relationshipTypes.includes(type)
                  return (
                    <li key={type}>
                      <label className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleType(type)}
                          className="h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-600 accent-zinc-900 dark:accent-zinc-100"
                        />
                        <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">
                          {type}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer hint */}
          {activeCount > 0 && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 px-3 py-2">
              <p className="text-[11px] text-zinc-400">
                Showing {activeCount} of {availableRelTypes.length} type{availableRelTypes.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
