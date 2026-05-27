"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api/client"
import type { ScrapeJob, ScrapeJobStatus, TramaProviderSeed } from "@/types/provider"

// ─── Display maps ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ScrapeJobStatus, string> = {
  pending: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500",
  running: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  failed: "bg-red-500/10 text-red-600 dark:text-red-400",
}

const STATUS_DOT: Record<ScrapeJobStatus, string> = {
  pending: "bg-zinc-400",
  running: "bg-sky-500 animate-pulse",
  completed: "bg-emerald-500",
  failed: "bg-red-500",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  firstName:  "First name",
  lastName:   "Last name",
  fullName:   "Full name",
  birthDate:  "Birth date",
  email:      "Email",
  username:   "Username",
  socialUrl:  "Social URL",
}

function seedSummary(seed?: TramaProviderSeed): string {
  if (!seed) return "—"
  return (seed.fullName ?? [seed.firstName, seed.lastName].filter(Boolean).join(" ")) || "—"
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    api.get<ScrapeJob[]>("/api/history")
      .then(({ data }) => setJobs(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

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
                  <th className="px-4 py-2.5 text-left font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">Nodes</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">Duration</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                {jobs.map((job) => (
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
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {job.createdNodeIds.length > 0 ? job.createdNodeIds.length : <span className="text-zinc-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{calcDuration(job.startedAt, job.finishedAt)}</td>
                      <td className="px-4 py-3 text-zinc-500">{formatDate(job.startedAt)}</td>
                    </tr>

                    {expandedId === job.id && (
                      <tr key={`${job.id}-expanded`} className="bg-zinc-50 dark:bg-zinc-800/30">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="flex flex-col gap-3">
                            {/* Seed */}
                            {job.seed && (
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
                            )}

                            {/* Metadata */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Job ID</p>
                                <p className="font-mono text-zinc-600 dark:text-zinc-400 text-[11px] truncate">{job.id}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Person ID</p>
                                <p className="font-mono text-zinc-600 dark:text-zinc-400 text-[11px] truncate">{job.personId}</p>
                              </div>
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

                            {job.errorMessage && (
                              <p className="rounded-md bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                                {job.errorMessage}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
