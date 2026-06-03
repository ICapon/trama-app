"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api/client"
import { CredentialDialog } from "@/components/providers/CredentialDialog"
import type { Provider, TramaProviderCategory } from "@/types/provider"

// ─── Display maps ─────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: TramaProviderCategory; label: string }[] = [
  { value: "identity",       label: "Identity" },
  { value: "social",         label: "Social" },
  { value: "financial",      label: "Financial" },
  { value: "legal",          label: "Legal" },
  { value: "location",       label: "Location" },
  { value: "communications", label: "Communications" },
]

const CATEGORY_STYLES: Record<TramaProviderCategory, string> = {
  identity:       "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  social:         "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  financial:      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  legal:          "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  location:       "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  communications: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(ms: number | null) {
  if (ms === null) return "—"
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function successRate(p: Provider) {
  if (p.totalRuns === 0) return null
  return Math.round((p.successCount / p.totalRuns) * 100)
}

function splitTags(value: string) {
  return value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function KeyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  )
}

// ─── Create dialog ────────────────────────────────────────────────────────────

interface CreateDialogProps {
  onClose: () => void
  onCreated: (p: Provider) => void
}

const EMPTY_FORM = {
  source: "",
  name: "",
  description: "",
  category: "identity" as TramaProviderCategory,
  countries: "",
  supportedInputs: "",
  outputNodeTypes: "",
  isActive: true,
}

function CreateProviderDialog({ onClose, onCreated }: CreateDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof typeof EMPTY_FORM, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { data } = await api.post<Provider>("/api/providers", {
        source:          form.source.trim(),
        name:            form.name.trim(),
        description:     form.description.trim(),
        category:        form.category,
        countries:       splitTags(form.countries),
        supportedInputs: form.supportedInputs.split(",").map((s) => s.trim()).filter(Boolean),
        outputNodeTypes: form.outputNodeTypes.split(",").map((s) => s.trim()).filter(Boolean),
        isActive:        form.isActive,
      })
      onCreated(data)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating provider")
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
  const labelClass = "text-xs font-medium text-zinc-500 dark:text-zinc-400"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[480px] max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">New Provider</h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Source <span className="text-red-500">*</span></label>
              <input
                autoFocus
                required
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
                placeholder="mx-curp"
                className={inputClass}
              />
              <p className="text-[10px] text-zinc-400">Unique slug, e.g. mx-curp</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Name <span className="text-red-500">*</span></label>
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="CURP Lookup"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Description <span className="text-red-500">*</span></label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What does this provider do?"
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Category <span className="text-red-500">*</span></label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={inputClass}
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Countries</label>
              <input
                value={form.countries}
                onChange={(e) => set("countries", e.target.value)}
                placeholder="MX, US"
                className={inputClass}
              />
              <p className="text-[10px] text-zinc-400">2-letter codes, comma-separated</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Supported inputs</label>
            <input
              value={form.supportedInputs}
              onChange={(e) => set("supportedInputs", e.target.value)}
              placeholder="curp, fullName"
              className={inputClass}
            />
            <p className="text-[10px] text-zinc-400">Comma-separated</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Output node types</label>
            <input
              value={form.outputNodeTypes}
              onChange={(e) => set("outputNodeTypes", e.target.value)}
              placeholder="Person, IdentityDocument"
              className={inputClass}
            />
            <p className="text-[10px] text-zinc-400">Comma-separated</p>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 dark:accent-zinc-100"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Active</span>
          </label>

          {error && (
            <p className="rounded-md bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
            >
              {saving ? "Creating…" : "Create Provider"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface ProviderCardProps {
  provider: Provider
  onDeleted: (source: string) => void
}

function ProviderCard({ provider: initial, onDeleted }: ProviderCardProps) {
  const [provider, setProvider] = useState(initial)
  const [toggling, setToggling] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)

  async function handleToggle() {
    setToggling(true)
    try {
      await api.patch(`/api/providers/${provider.source}/active`, { isActive: !provider.isActive })
      setProvider((p) => ({ ...p, isActive: !p.isActive }))
    } finally {
      setToggling(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/api/providers/${provider.source}`)
      onDeleted(provider.source)
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const rate = successRate(provider)

  return (
    <div className={`flex flex-col gap-4 rounded-xl border bg-white dark:bg-zinc-900 p-5 transition-opacity ${!provider.isActive ? "opacity-60" : ""} border-zinc-200 dark:border-zinc-800`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CATEGORY_STYLES[provider.category]}`}>
              {CATEGORY_OPTIONS.find((o) => o.value === provider.category)?.label ?? provider.category}
            </span>
            {provider.countries.map((c) => (
              <span key={c} className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
                {c}
              </span>
            ))}
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{provider.name}</p>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">{provider.source} · v{provider.version}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Credentials */}
          <button
            onClick={() => setShowCredentials(true)}
            title="Manage credentials"
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <KeyIcon />
          </button>

          {/* Active toggle */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            title={provider.isActive ? "Deactivate" : "Activate"}
            className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
              provider.isActive ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${provider.isActive ? "translate-x-4" : ""}`} />
          </button>

          {/* Delete button */}
          <button
            onClick={() => setConfirmDelete(true)}
            title="Delete provider"
            className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-500/8 transition-colors"
          >
            <TrashIcon />
          </button>
        </div>

        {showCredentials && (
          <CredentialDialog
            providerSource={provider.source}
            providerName={provider.name}
            onClose={() => setShowCredentials(false)}
          />
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{provider.description}</p>

      {/* I/O */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Inputs</p>
          <div className="flex flex-wrap gap-1">
            {provider.supportedInputs.length > 0
              ? provider.supportedInputs.map((i) => (
                  <span key={i} className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">{i}</span>
                ))
              : <span className="text-[10px] text-zinc-400">—</span>
            }
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Output nodes</p>
          <div className="flex flex-wrap gap-1">
            {provider.outputNodeTypes.length > 0
              ? provider.outputNodeTypes.map((t) => (
                  <span key={t} className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">{t}</span>
                ))
              : <span className="text-[10px] text-zinc-400">—</span>
            }
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Runs</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{provider.totalRuns}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Success</p>
          <p className={`text-sm font-semibold ${rate === null ? "text-zinc-400" : rate >= 90 ? "text-emerald-600 dark:text-emerald-400" : rate >= 70 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
            {rate === null ? "—" : `${rate}%`}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Avg time</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatDuration(provider.avgDurationMs)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Last run</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(provider.lastRunAt)}</p>
        </div>
      </div>

      {provider.lastError && (
        <p className="rounded-md bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          Last error: {provider.lastError}
        </p>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-3 flex flex-col gap-2">
          <p className="text-xs text-red-700 dark:text-red-400 font-medium">Delete <span className="font-semibold">{provider.name}</span>? This cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    api.get<Provider[]>("/api/providers")
      .then(({ data }) => setProviders(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handleCreated(p: Provider) {
    setProviders((prev) => [...prev, p])
  }

  function handleDeleted(source: string) {
    setProviders((prev) => prev.filter((p) => p.source !== source))
  }

  const active = providers.filter((p) => p.isActive).length

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-4">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Providers</h1>
          {!loading && (
            <p className="text-xs text-zinc-400 mt-0.5">
              {providers.length} registered · {active} active
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
        >
          <PlusIcon />
          New Provider
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <p className="text-sm text-zinc-400">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : providers.length === 0 ? (
          <p className="text-sm text-zinc-400">No providers registered.</p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-5xl">
            {providers.map((p) => (
              <ProviderCard key={p.source} provider={p} onDeleted={handleDeleted} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateProviderDialog
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
