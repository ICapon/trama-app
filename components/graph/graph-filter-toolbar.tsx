"use client"

import { useEffect, useRef, useState } from "react"
import type { GraphFilters } from "@/hooks/use-investigation-graph"

function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
      <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

function NodeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
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
  availableNodeTypes: string[]
  onChange: (filters: GraphFilters) => void
  loading?: boolean
  anchoredNodeId?: string | null
  anchoredNodeLabel?: string
  onUnanchor?: () => void
}

export function GraphFilterToolbar({ filters, availableRelTypes, availableNodeTypes, onChange, loading, anchoredNodeId, anchoredNodeLabel, onUnanchor }: Props) {
  const [openRel, setOpenRel]   = useState(false)
  const [openNode, setOpenNode] = useState(false)
  const [searchRel, setSearchRel]   = useState("")
  const [searchNode, setSearchNode] = useState("")
  const relRef  = useRef<HTMLDivElement>(null)
  const nodeRef = useRef<HTMLDivElement>(null)
  const searchRelRef  = useRef<HTMLInputElement>(null)
  const searchNodeRef = useRef<HTMLInputElement>(null)

  const activeRelCount  = filters.relationshipTypes.length
  const activeNodeCount = filters.nodeTypes.length

  const visibleRelTypes  = searchRel.trim()  ? availableRelTypes.filter((t) => t.toLowerCase().includes(searchRel.trim().toLowerCase()))  : availableRelTypes
  const visibleNodeTypes = searchNode.trim() ? availableNodeTypes.filter((t) => t.toLowerCase().includes(searchNode.trim().toLowerCase())) : availableNodeTypes

  function useCloseOnOutsideClick(ref: React.RefObject<HTMLDivElement | null>, open: boolean, setOpen: (v: boolean) => void) {
    useEffect(() => {
      if (!open) return
      function onMouseDown(e: MouseEvent) {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
      }
      document.addEventListener("mousedown", onMouseDown)
      return () => document.removeEventListener("mousedown", onMouseDown)
    }, [open])
  }

  useCloseOnOutsideClick(relRef, openRel, setOpenRel)
  useCloseOnOutsideClick(nodeRef, openNode, setOpenNode)

  useEffect(() => { if (openRel) { setTimeout(() => searchRelRef.current?.focus(), 50) } else { setSearchRel("") } }, [openRel])
  useEffect(() => { if (openNode) { setTimeout(() => searchNodeRef.current?.focus(), 50) } else { setSearchNode("") } }, [openNode])

  function toggleRel(type: string) {
    const next = filters.relationshipTypes.includes(type)
      ? filters.relationshipTypes.filter((t) => t !== type)
      : [...filters.relationshipTypes, type]
    onChange({ ...filters, relationshipTypes: next })
  }

  function toggleNode(type: string) {
    const next = filters.nodeTypes.includes(type)
      ? filters.nodeTypes.filter((t) => t !== type)
      : [...filters.nodeTypes, type]
    onChange({ ...filters, nodeTypes: next })
  }

  const DEPTH_OPTIONS  = [1, 2, 3] as const
  type DirOption = { value: 'both' | 'outgoing' | 'incoming'; label: string; title: string }
  const DIR_OPTIONS: DirOption[] = [
    { value: 'incoming', label: '←', title: 'Solo relaciones entrantes' },
    { value: 'both',     label: '↔', title: 'Ambas direcciones (default)' },
    { value: 'outgoing', label: '→', title: 'Solo relaciones salientes' },
  ]

  const btnBase = "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
  const btnActive = "border-zinc-900 dark:border-zinc-200 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
  const btnIdle = "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
  const countBadge = "rounded-full bg-white/20 dark:bg-zinc-900/20 px-1.5 py-px text-[10px] font-bold leading-none"

  return (
    <div className="flex items-center gap-2 shrink-0">

      {/* Anchor chip */}
      {anchoredNodeId && (
        <div className="flex items-center gap-1.5 rounded-md border border-sky-400 dark:border-sky-600 bg-sky-50 dark:bg-sky-500/10 px-2.5 py-1.5 text-xs font-medium text-sky-600 dark:text-sky-400">
          <PinIcon />
          <span className="max-w-[120px] truncate">{anchoredNodeLabel ?? "Nodo anclado"}</span>
          <button
            onClick={onUnanchor}
            title="Quitar ancla"
            className="ml-0.5 text-sky-400 hover:text-sky-700 dark:hover:text-sky-200 transition-colors"
          >
            <XIcon />
          </button>
        </div>
      )}

      {/* Depth */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 select-none">Depth</span>
        <div className="flex rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {DEPTH_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => onChange({ ...filters, depth: d })}
              disabled={loading}
              className={`px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                filters.depth === d
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Direction */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 select-none">Dir</span>
        <div className="flex rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {DIR_OPTIONS.map(({ value, label, title }) => (
            <button
              key={value}
              onClick={() => onChange({ ...filters, direction: value })}
              disabled={loading}
              title={title}
              className={`px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                filters.direction === value
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Node type filter */}
      <div ref={nodeRef} className="relative shrink-0">
        <button
          onClick={() => { setOpenNode((v) => !v); setOpenRel(false) }}
          disabled={!availableNodeTypes.length}
          title="Filtrar por tipo de nodo"
          className={`${btnBase} ${activeNodeCount > 0 ? btnActive : btnIdle}`}
        >
          <NodeIcon />
          Nodos
          {activeNodeCount > 0 && <span className={countBadge}>{activeNodeCount}</span>}
        </button>

        {openNode && (
          <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-3 py-2.5">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Tipos de nodo
                <span className="ml-1.5 text-zinc-400 font-normal">({availableNodeTypes.length})</span>
              </span>
              {activeNodeCount > 0 && (
                <button onClick={() => onChange({ ...filters, nodeTypes: [] })} className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                  <XIcon /> Clear
                </button>
              )}
            </div>
            <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
              <input ref={searchNodeRef} type="text" value={searchNode} onChange={(e) => setSearchNode(e.target.value)} placeholder="Buscar tipos…" className="w-full rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100" />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {visibleNodeTypes.length === 0 ? (
                <p className="px-3 py-4 text-xs text-zinc-400 text-center">{searchNode ? "Sin coincidencias" : "No hay tipos en este grafo"}</p>
              ) : (
                <ul className="py-1">
                  {visibleNodeTypes.map((type) => (
                    <li key={type}>
                      <label className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
                        <input type="checkbox" checked={filters.nodeTypes.includes(type)} onChange={() => toggleNode(type)} className="h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-600 accent-zinc-900 dark:accent-zinc-100" />
                        <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">{type}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {activeNodeCount > 0 && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 px-3 py-2">
                <p className="text-[11px] text-zinc-400">Mostrando {activeNodeCount} de {availableNodeTypes.length} tipo{availableNodeTypes.length !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Relationship type filter */}
      <div ref={relRef} className="relative shrink-0">
        <button
          onClick={() => { setOpenRel((v) => !v); setOpenNode(false) }}
          disabled={!availableRelTypes.length}
          title="Filtrar por tipo de relación"
          className={`${btnBase} ${activeRelCount > 0 ? btnActive : btnIdle}`}
        >
          <FilterIcon />
          Relaciones
          {activeRelCount > 0 && <span className={countBadge}>{activeRelCount}</span>}
        </button>

        {openRel && (
          <div className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-3 py-2.5">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Tipos de relación
                {availableRelTypes.length > 0 && <span className="ml-1.5 text-zinc-400 font-normal">({availableRelTypes.length})</span>}
              </span>
              {activeRelCount > 0 && (
                <button onClick={() => onChange({ ...filters, relationshipTypes: [] })} className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                  <XIcon /> Clear
                </button>
              )}
            </div>
            <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
              <input ref={searchRelRef} type="text" value={searchRel} onChange={(e) => setSearchRel(e.target.value)} placeholder="Buscar tipos…" className="w-full rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100" />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {visibleRelTypes.length === 0 ? (
                <p className="px-3 py-4 text-xs text-zinc-400 text-center">{searchRel ? "Sin coincidencias" : "No hay tipos de relación en este grafo"}</p>
              ) : (
                <ul className="py-1">
                  {visibleRelTypes.map((type) => (
                    <li key={type}>
                      <label className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
                        <input type="checkbox" checked={filters.relationshipTypes.includes(type)} onChange={() => toggleRel(type)} className="h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-600 accent-zinc-900 dark:accent-zinc-100" />
                        <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">{type}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {activeRelCount > 0 && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 px-3 py-2">
                <p className="text-[11px] text-zinc-400">Mostrando {activeRelCount} de {availableRelTypes.length} tipo{availableRelTypes.length !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
