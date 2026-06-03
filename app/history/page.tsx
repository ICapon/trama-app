"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api/client"
import type {
  ScrapeJob,
  ScrapeJobStatus,
  ScrapeStepLog,
  ScrapeStepExtractedData,
  ScrapeStepType,
  TramaProviderSeed,
} from "@/types/provider"

// ─── Status styles ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ScrapeJobStatus, string> = {
  pending:   "bg-zinc-100 dark:bg-zinc-800 text-zinc-500",
  running:   "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  failed:    "bg-red-500/10 text-red-600 dark:text-red-400",
}

const STATUS_DOT: Record<ScrapeJobStatus, string> = {
  pending:   "bg-zinc-400",
  running:   "bg-sky-500 animate-pulse",
  completed: "bg-emerald-500",
  failed:    "bg-red-500",
}

// ─── Step styles ──────────────────────────────────────────────────────────────

const STEP_STYLES: Record<ScrapeStepType, string> = {
  navigate:    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20",
  api_capture: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200/60 dark:border-violet-500/20",
  dom_scrape:  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20",
  login:       "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20",
  result:      "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200/60 dark:border-zinc-700/60",
}

const STEP_LABELS: Record<ScrapeStepType, string> = {
  navigate:    "Navigate",
  api_capture: "API",
  dom_scrape:  "DOM",
  login:       "Login",
  result:      "Result",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function calcDuration(start: string | null, end: string | null) {
  if (!start || !end) return "—"
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const SEED_LABELS: Record<keyof TramaProviderSeed, string> = {
  firstName: "First name",
  lastName:  "Last name",
  fullName:  "Full name",
  birthDate: "Birth date",
  email:     "Email",
  username:  "Username",
  socialUrl: "Social URL",
  curp:      "CURP",
  rfc:       "RFC",
}

function seedSummary(seed: TramaProviderSeed): string {
  return (seed.fullName ?? [seed.firstName, seed.lastName].filter(Boolean).join(" ")) || "—"
}

function truncateUrl(url: string | null, max = 80): string {
  if (!url) return "—"
  return url.length > max ? url.slice(0, max) + "…" : url
}

// ─── ExtractedData display ────────────────────────────────────────────────────

function ExtractedDataPanel({ data }: { data: ScrapeStepExtractedData }) {
  const hasSomething = data.fields || data.tags?.length || data.items || data.metrics || data.navigate

  if (!hasSomething) return null

  return (
    <div className="mt-2 flex flex-col gap-2.5">
      {/* Fields */}
      {data.fields && Object.keys(data.fields).length > 0 && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Fields</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1">
            {Object.entries(data.fields).map(([k, v]) => (
              <div key={k}>
                <span className="text-[9px] text-zinc-400">{k}</span>
                <p className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300 truncate">
                  {v === null ? "—" : String(v)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      {data.items && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Items <span className="font-mono text-zinc-500">({data.items.count})</span>
          </p>
          {data.items.samples && data.items.samples.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.items.samples.map((s) => (
                <span key={s} className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[9px] font-mono text-zinc-600 dark:text-zinc-400">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Tags</p>
          <div className="flex flex-wrap gap-1">
            {data.tags.map((t) => (
              <span key={t} className="rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-200/60 dark:border-violet-500/20 px-2 py-0.5 text-[9px] font-mono text-violet-600 dark:text-violet-400">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      {data.metrics && Object.keys(data.metrics).length > 0 && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Metrics</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.metrics).map(([k, v]) => (
              <span key={k} className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[9px] font-mono text-zinc-600 dark:text-zinc-400">
                {k}: <span className="font-bold text-zinc-700 dark:text-zinc-300">{v}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Navigate */}
      {data.navigate && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Navigation</p>
          <p className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 truncate">
            → {data.navigate.finalUrl}
          </p>
          {data.navigate.capturedEndpoints && data.navigate.capturedEndpoints.length > 0 && (
            <div className="mt-1 flex flex-col gap-0.5">
              {data.navigate.capturedEndpoints.map((ep) => (
                <p key={ep} className="text-[9px] font-mono text-zinc-400 truncate pl-3">⚡ {ep}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── StepRow ──────────────────────────────────────────────────────────────────

function StepRow({ step }: { step: ScrapeStepLog }) {
  const [open, setOpen] = useState(false)
  const hasData = step.extractedData && Object.values(step.extractedData).some(
    (v) => v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : typeof v === "object" ? Object.keys(v).length > 0 : true)
  )

  return (
    <div className={`rounded-lg border overflow-hidden transition-colors ${
      step.success
        ? "border-zinc-200 dark:border-zinc-700/60"
        : "border-red-200 dark:border-red-500/20"
    }`}>
      <button
        onClick={() => hasData && setOpen((o) => !o)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
          hasData ? "hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer" : "cursor-default"
        }`}
      >
        {/* Step type badge */}
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${STEP_STYLES[step.stepType]}`}>
          {STEP_LABELS[step.stepType]}
        </span>

        {/* URL */}
        <span className="flex-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-500 truncate min-w-0">
          {truncateUrl(step.url)}
        </span>

        {/* Nodes created */}
        {step.nodesCreated > 0 && (
          <span className="shrink-0 text-[9px] text-emerald-600 dark:text-emerald-500 font-mono whitespace-nowrap">
            +{step.nodesCreated}n
          </span>
        )}

        {/* Duration */}
        {step.durationMs !== null && (
          <span className="shrink-0 text-[10px] text-zinc-400 font-mono whitespace-nowrap">
            {step.durationMs < 1000 ? `${step.durationMs}ms` : `${(step.durationMs / 1000).toFixed(1)}s`}
          </span>
        )}

        {/* Success dot */}
        <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${step.success ? "bg-emerald-500" : "bg-red-500"}`} />

        {/* Chevron if expandable */}
        {hasData && (
          <svg
            className={`shrink-0 h-3 w-3 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Error */}
      {!step.success && step.errorMessage && (
        <p className="px-3 pb-2 text-[10px] text-red-500">{step.errorMessage}</p>
      )}

      {/* Extracted data panel */}
      {open && step.extractedData && (
        <div className="border-t border-zinc-200 dark:border-zinc-700/60 px-3 py-2.5 bg-zinc-50/70 dark:bg-zinc-900/50">
          <ExtractedDataPanel data={step.extractedData} />
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [jobs, setJobs]               = useState<ScrapeJob[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [expandedId, setExpandedId]   = useState<string | null>(null)
  const [stepsByJob, setStepsByJob]   = useState<Record<string, ScrapeStepLog[]>>({})
  const [loadingSteps, setLoadingSteps] = useState<string | null>(null)

  useEffect(() => {
    api.get<ScrapeJob[]>("/api/history")
      .then(({ data }) => setJobs(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Fetch step logs when a job is expanded
  useEffect(() => {
    if (!expandedId) return
    if (stepsByJob[expandedId] !== undefined) return // cached

    const job = jobs.find((j) => j.id === expandedId)
    if (!job?.entityId) {
      setStepsByJob((p) => ({ ...p, [expandedId]: [] }))
      return
    }

    setLoadingSteps(expandedId)
    api.get<ScrapeStepLog[]>("/api/history/steps", {
      params: { entityId: job.entityId, provider: job.source },
    })
      .then(({ data }) => setStepsByJob((p) => ({ ...p, [expandedId]: data })))
      .catch(() => setStepsByJob((p) => ({ ...p, [expandedId]: [] })))
      .finally(() => setLoadingSteps(null))
  }, [expandedId, jobs, stepsByJob])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-4">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Run History</h1>
          {!loading && (
            <p className="text-xs text-zinc-400 mt-0.5">{jobs.length} jobs</p>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <p className="text-sm text-zinc-400">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-zinc-400">No runs recorded yet.</p>
        ) : (
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
                  <th className="px-4 py-2.5 text-left font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">Provider</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">Target</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">Duration</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                {jobs.map((job) => {
                  const steps = stepsByJob[job.id]
                  const isExpanded = expandedId === job.id

                  return (
                    <>
                      <tr
                        key={job.id}
                        onClick={() => setExpandedId((prev) => (prev === job.id ? null : job.id))}
                        className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[job.status]}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[job.status]}`} />
                            {job.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">{job.source}</td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{seedSummary(job.seed)}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{calcDuration(job.startedAt, job.finishedAt)}</td>
                        <td className="px-4 py-3 text-zinc-500">{formatDate(job.startedAt)}</td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${job.id}-expanded`} className="bg-zinc-50 dark:bg-zinc-800/30">
                          <td colSpan={5} className="px-4 py-4">
                            <div className="flex flex-col gap-4">

                              {/* ── Seed ─────────────────────────────────── */}
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Seed</p>
                                <div className="flex flex-wrap gap-x-6 gap-y-2">
                                  {(Object.entries(job.seed) as [keyof TramaProviderSeed, string][])
                                    .filter(([, v]) => v)
                                    .map(([key, value]) => (
                                      <div key={key}>
                                        <p className="text-[10px] text-zinc-400">{SEED_LABELS[key]}</p>
                                        <p className="text-xs text-zinc-700 dark:text-zinc-300">{value}</p>
                                      </div>
                                    ))
                                  }
                                </div>
                              </div>

                              {/* ── Metadata ─────────────────────────────── */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Job ID</p>
                                  <p className="font-mono text-zinc-600 dark:text-zinc-400 text-[11px] truncate">{job.id}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Entity ID</p>
                                  <p className="font-mono text-zinc-600 dark:text-zinc-400 text-[11px] truncate">{job.entityId ?? "—"}</p>
                                </div>
                                {job.investigationId && (
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Investigation</p>
                                    <p className="font-mono text-zinc-600 dark:text-zinc-400 text-[11px] truncate">{job.investigationId}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Finished</p>
                                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">{formatDate(job.finishedAt)}</p>
                                </div>
                                {job.bullJobId && (
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Bull Job</p>
                                    <p className="font-mono text-zinc-600 dark:text-zinc-400 text-[11px]">{job.bullJobId}</p>
                                  </div>
                                )}
                              </div>

                              {job.config && Object.keys(job.config).length > 0 && (
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Config</p>
                                  <pre className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(job.config, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {job.errorMessage && (
                                <p className="rounded-md bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                                  {job.errorMessage}
                                </p>
                              )}

                              {/* ── Scrape Steps ─────────────────────────── */}
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Scrape Steps</p>
                                  {steps && steps.length > 0 && (
                                    <span className="rounded-full bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-[9px] font-mono text-zinc-500">
                                      {steps.length}
                                    </span>
                                  )}
                                </div>

                                {loadingSteps === job.id ? (
                                  <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
                                    <span className="h-3 w-3 rounded-full border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-500 animate-spin" />
                                    Loading steps…
                                  </div>
                                ) : !steps || steps.length === 0 ? (
                                  <p className="text-xs text-zinc-400 italic">
                                    {job.entityId
                                      ? "No step logs recorded for this job."
                                      : "Step logs require an entityId."}
                                  </p>
                                ) : (
                                  <div className="flex flex-col gap-1.5">
                                    {steps.map((step) => (
                                      <StepRow key={step.id} step={step} />
                                    ))}
                                  </div>
                                )}
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
