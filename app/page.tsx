"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { investigationsApi } from "@/lib/api/investigations"
import type { Investigation, InvestigationStatus, InvestigationPriority } from "@/types/investigation"

const STATUS_LABELS: Record<InvestigationStatus, string> = {
  open: "Abierta",
  in_progress: "En progreso",
  closed: "Cerrada",
  archived: "Archivada",
}

const STATUS_STYLES: Record<InvestigationStatus, string> = {
  open: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  closed: "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20",
  archived: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20",
}

const PRIORITY_DOT: Record<InvestigationPriority, string> = {
  low: "bg-zinc-400",
  medium: "bg-sky-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
}

const PRIORITY_LABELS: Record<InvestigationPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
}

const PRIORITY_TEXT: Record<InvestigationPriority, string> = {
  low: "text-zinc-400",
  medium: "text-sky-500",
  high: "text-orange-500",
  critical: "text-red-500",
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  if (diffDays === 0) return "Hoy"
  if (diffDays === 1) return "Ayer"
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem.`
  return date.toLocaleDateString("es", { month: "short", day: "numeric" })
}

function InvestigationCard({ inv }: { inv: Investigation }) {
  return (
    <Link href={`/investigations/${inv.id}`} className="group block">
      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 h-full transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[inv.status]}`}
            >
              {STATUS_LABELS[inv.status]}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${PRIORITY_TEXT[inv.priority]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[inv.priority]}`} />
              {PRIORITY_LABELS[inv.priority]}
            </span>
          </div>
          <span className="text-xs text-zinc-400 shrink-0">{formatRelativeDate(inv.updatedAt)}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
          {inv.title}
        </h3>

        {/* Description */}
        {inv.description && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {inv.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {inv.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono"
              >
                {tag}
              </span>
            ))}
            {inv.tags.length > 3 && (
              <span className="text-xs text-zinc-400">+{inv.tags.length - 3}</span>
            )}
          </div>
          {inv.targets.length > 0 && (
            <span className="text-xs text-zinc-400 shrink-0">
              {inv.targets.length} obj.
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 animate-pulse">
      <div className="flex gap-2">
        <div className="h-5 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-5 w-14 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="h-5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-zinc-100 dark:bg-zinc-800/60" />
        <div className="h-4 w-4/5 rounded bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
      <div className="flex gap-1.5 pt-1">
        <div className="h-5 w-14 rounded-md bg-zinc-100 dark:bg-zinc-800/60" />
        <div className="h-5 w-10 rounded-md bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
    </div>
  )
}

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    investigationsApi
      .list()
      .then(({ data }) => setInvestigations(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm px-6 py-4">
        <div>
          <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Investigaciones
          </h1>
          {!loading && !error && (
            <p className="text-xs text-zinc-400 mt-0.5">{investigations.length} en total</p>
          )}
        </div>
        <button className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors">
          + Nueva
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 p-6">
        {error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-zinc-300 dark:text-zinc-700"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-zinc-500">No se pudo cargar las investigaciones</p>
            <p className="text-xs text-zinc-400 font-mono">{error}</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : investigations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <p className="text-sm text-zinc-500">No hay investigaciones todavía</p>
            <p className="text-xs text-zinc-400">Crea una nueva para comenzar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {investigations.map((inv) => (
              <InvestigationCard key={inv.id} inv={inv} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
