"use client"

import { useEffect, useState } from "react"
import { cronJobsApi } from "@/lib/api/cron-jobs"
import { NewCronJobDialog } from "@/components/cron-jobs/new-cron-job-dialog"
import { useToast, Toaster } from "@/components/ui/toast"
import type { CronJob, CronJobStatus } from "@/types/cron-job"

const STATUS_STYLES: Record<CronJobStatus, string> = {
  active: "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20",
  paused: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—"
  const date = new Date(dateString)
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en", { month: "short", day: "numeric" })
}

function PauseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800/60 animate-pulse">
      {[120, 80, 100, 60, 70, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`h-4 rounded bg-zinc-100 dark:bg-zinc-800`} style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toasts, dismiss, toast } = useToast()

  useEffect(() => {
    cronJobsApi
      .list()
      .then(({ data }) => setJobs(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handleCreated(job: CronJob) {
    setJobs((prev) => [job, ...prev])
    setShowDialog(false)
    toast.success("Scheduled job created")
  }

  async function handleToggle(job: CronJob) {
    setActionLoading(job.id)
    try {
      const { data } = job.status === "active"
        ? await cronJobsApi.pause(job.id)
        : await cronJobsApi.resume(job.id)
      setJobs((prev) => prev.map((j) => (j.id === data.id ? data : j)))
      toast.success(data.status === "active" ? "Job resumed" : "Job paused")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(job: CronJob) {
    if (!confirm(`Delete "${job.name}"? This action cannot be undone.`)) return
    setActionLoading(job.id)
    try {
      await cronJobsApi.remove(job.id)
      setJobs((prev) => prev.filter((j) => j.id !== job.id))
      toast.success("Job deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Toaster toasts={toasts} onDismiss={dismiss} />

      <NewCronJobDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        onCreated={handleCreated}
      />

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm px-6 py-4">
        <div>
          <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Scheduled Jobs</h1>
          {!loading && !error && (
            <p className="text-xs text-zinc-400 mt-0.5">{jobs.length} total</p>
          )}
        </div>
        <button
          onClick={() => setShowDialog(true)}
          className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
        >
          + New
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto">
        {error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 dark:text-zinc-700">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-zinc-500">Could not load scheduled jobs</p>
            <p className="text-xs text-zinc-400 font-mono">{error}</p>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Schedule</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Last run</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-950">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-sm text-zinc-400">
                      No scheduled jobs yet
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => {
                    const busy = actionLoading === job.id
                    return (
                      <tr key={job.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                        {/* Name + description */}
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{job.name}</p>
                          {job.description && (
                            <p className="text-xs text-zinc-400 truncate mt-0.5">{job.description}</p>
                          )}
                        </td>

                        {/* Cron expression */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                            {job.cronExpression}
                          </span>
                        </td>

                        {/* Source */}
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">{job.source}</span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[job.status]}`}>
                            {job.status}
                          </span>
                        </td>

                        {/* Last run */}
                        <td className="px-4 py-3 text-xs text-zinc-400">
                          {formatDate(job.lastRunAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggle(job)}
                              disabled={busy}
                              title={job.status === "active" ? "Pause" : "Resume"}
                              className="rounded-md p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
                            >
                              {busy ? <SpinnerIcon /> : job.status === "active" ? <PauseIcon /> : <PlayIcon />}
                            </button>
                            <button
                              onClick={() => handleDelete(job)}
                              disabled={busy}
                              title="Delete"
                              className="rounded-md p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-40"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
