"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { investigationsApi } from "@/lib/api/investigations"
import { TramaGraph } from "@/components/graph/graph-canvas"
import type { Investigation, InvestigationStatus, InvestigationPriority } from "@/types/investigation"

// ─── Display maps ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<InvestigationStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  closed: "Closed",
  archived: "Archived",
}

const STATUS_STYLES: Record<InvestigationStatus, string> = {
  open: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  closed: "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20",
  archived: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
}

const PRIORITY_DOT: Record<InvestigationPriority, string> = {
  low: "bg-zinc-400",
  medium: "bg-sky-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
}

const PRIORITY_LABELS: Record<InvestigationPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
}

const NODE_TYPE_STYLES: Record<string, string> = {
  Person: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Organization: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Location: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function PlusCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

function ArrowsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M15 6l6 6-6 6" />
    </svg>
  )
}

function Trash2Icon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

// ─── Tool panel ───────────────────────────────────────────────────────────────

type ActiveTool = "node" | "edge" | "delete" | null

const TOOLS = [
  { id: "node" as const, icon: <PlusCircleIcon />, label: "Node",     hint: "Click on the canvas to add a node" },
  { id: "edge" as const, icon: <ArrowsIcon />,     label: "Relation", hint: "Connect two existing nodes" },
]

interface ToolButtonProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  variant?: "default" | "destructive"
}

function ToolButton({ icon, label, active, onClick, variant = "default" }: ToolButtonProps) {
  const base = "flex items-center gap-2.5 w-full rounded-md px-3 py-2.5 text-xs font-medium transition-colors text-left"
  const style =
    variant === "destructive"
      ? active
        ? "bg-red-500 text-white"
        : "text-zinc-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-500/8"
      : active
        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
  return (
    <button onClick={onClick} className={`${base} ${style}`}>
      {icon}
      {label}
    </button>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvestigationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [investigation, setInvestigation] = useState<Investigation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTool, setActiveTool] = useState<ActiveTool>(null)

  useEffect(() => {
    investigationsApi
      .get(id)
      .then(({ data }) => setInvestigation(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function handleExitEdit() {
    setIsEditing(false)
    setActiveTool(null)
  }

  function toggleTool(tool: Exclude<ActiveTool, null>) {
    setActiveTool((prev) => (prev === tool ? null : tool))
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm text-zinc-400">Loading...</span>
      </div>
    )
  }

  if (error || !investigation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-sm text-zinc-500">Investigation not found</p>
        <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-600 underline">
          Go back
        </Link>
      </div>
    )
  }

  const activeToolData = TOOLS.find((t) => t.id === activeTool)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5">
        <Link
          href="/"
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 shrink-0 transition-colors"
        >
          <ChevronLeftIcon />
          Investigations
        </Link>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 shrink-0" />

        <h1 className="flex-1 min-w-0 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {investigation.title}
        </h1>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[investigation.status]}`}>
            {STATUS_LABELS[investigation.status]}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
            <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[investigation.priority]}`} />
            {PRIORITY_LABELS[investigation.priority]}
          </span>
        </div>

        {isEditing ? (
          <button
            onClick={handleExitEdit}
            className="flex items-center gap-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors shrink-0"
          >
            <CheckIcon />
            Done
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shrink-0"
          >
            <PencilIcon />
            Edit
          </button>
        )}
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Metadata panel — view mode only */}
        {!isEditing && (
          <aside className="w-72 flex-shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto">
            <div className="flex flex-col gap-5 p-4">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">Created</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">{formatDate(investigation.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">Updated</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">{formatDate(investigation.updatedAt)}</p>
                </div>
              </div>

              {/* Description */}
              {investigation.description && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Description</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{investigation.description}</p>
                </div>
              )}

              {/* Hypothesis */}
              {investigation.hypothesis && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Hypothesis</p>
                  <div className="rounded-md border-l-2 border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-500/5 pl-3 pr-2 py-2.5">
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed italic">
                      {investigation.hypothesis}
                    </p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {investigation.tags.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {investigation.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Targets */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Targets{investigation.targets.length > 0 && <span className="font-normal normal-case ml-1">({investigation.targets.length})</span>}
                </p>
                {investigation.targets.length === 0 ? (
                  <p className="text-xs text-zinc-400">No targets defined</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {investigation.targets.map((target) => (
                      <div key={target.nodeId} className="flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${NODE_TYPE_STYLES[target.nodeType] ?? "bg-zinc-100 text-zinc-500"}`}>
                          {target.nodeType}
                        </span>
                        <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">{target.nodeLabel}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Graph */}
        <div className="relative flex-1 min-w-0">
          <TramaGraph readonly={!isEditing} />

          {/* Active tool hint */}
          {isEditing && activeToolData && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-4 py-2 shadow-sm pointer-events-none">
              <span className="text-zinc-500 dark:text-zinc-400">{activeToolData.icon}</span>
              <span className="text-xs text-zinc-600 dark:text-zinc-300">{activeToolData.hint}</span>
            </div>
          )}
        </div>

        {/* Tools panel — edit mode only */}
        {isEditing && (
          <aside className="flex w-40 flex-shrink-0 flex-col border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
            <div className="flex-1 p-2">
              <p className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                Add
              </p>
              <div className="flex flex-col gap-0.5">
                {TOOLS.map((tool) => (
                  <ToolButton
                    key={tool.id}
                    icon={tool.icon}
                    label={tool.label}
                    active={activeTool === tool.id}
                    onClick={() => toggleTool(tool.id)}
                  />
                ))}
              </div>
            </div>
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-2">
              <ToolButton
                icon={<Trash2Icon />}
                label="Delete"
                active={activeTool === "delete"}
                onClick={() => toggleTool("delete")}
                variant="destructive"
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
