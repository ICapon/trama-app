"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { investigationsApi } from "@/lib/api/investigations"
import { TramaGraph } from "@/components/graph/graph-canvas"
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

const NODE_TYPE_STYLES: Record<string, string> = {
  Person: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Organization: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Location: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function ChevronLeftIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export default function InvestigationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [investigation, setInvestigation] = useState<Investigation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    investigationsApi
      .get(id)
      .then(({ data }) => setInvestigation(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm text-zinc-400">Cargando investigación...</span>
      </div>
    )
  }

  if (error || !investigation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-sm text-zinc-500">No se encontró la investigación</p>
        <Link
          href="/"
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Left panel — metadata */}
      <aside className="w-72 flex-shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto">
        {/* Panel header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4 transition-colors"
          >
            <ChevronLeftIcon />
            Investigaciones
          </Link>

          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[investigation.status]}`}
            >
              {STATUS_LABELS[investigation.status]}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[investigation.priority]}`} />
              {PRIORITY_LABELS[investigation.priority]}
            </span>
          </div>

          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
            {investigation.title}
          </h1>
        </div>

        {/* Panel content */}
        <div className="flex flex-col gap-5 p-4 flex-1">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Creada
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                {formatDate(investigation.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Actualizada
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                {formatDate(investigation.updatedAt)}
              </p>
            </div>
          </div>

          {/* Description */}
          {investigation.description && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Descripción
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {investigation.description}
              </p>
            </div>
          )}

          {/* Hypothesis */}
          {investigation.hypothesis && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Hipótesis
              </p>
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
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Etiquetas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {investigation.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Targets */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Objetivos{" "}
              {investigation.targets.length > 0 && (
                <span className="font-normal normal-case">({investigation.targets.length})</span>
              )}
            </p>
            {investigation.targets.length === 0 ? (
              <p className="text-xs text-zinc-400">Sin objetivos definidos</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {investigation.targets.map((target) => (
                  <div
                    key={target.nodeId}
                    className="flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2"
                  >
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        NODE_TYPE_STYLES[target.nodeType] ?? "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {target.nodeType}
                    </span>
                    <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">
                      {target.nodeLabel}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Graph canvas */}
      <div className="relative flex-1 min-w-0">
        <TramaGraph />
      </div>
    </div>
  )
}
