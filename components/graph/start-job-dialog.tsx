"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api/client"
import type { GraphNodeResponse } from "@/lib/graph/types"
import type { Provider } from "@/types/provider"

const PREFIX = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_PREFIX ?? "")
  : "/api"

// ─── Seed fields ──────────────────────────────────────────────────────────────

const SEED_FIELDS = [
  { key: "firstName", label: "First name",  max: undefined, wide: false },
  { key: "lastName",  label: "Last name",   max: undefined, wide: false },
  { key: "fullName",  label: "Full name",   max: undefined, wide: true  },
  { key: "birthDate", label: "Birth date",  max: undefined, wide: false },
  { key: "curp",      label: "CURP",        max: 18,        wide: false },
  { key: "rfc",       label: "RFC",         max: 13,        wide: false },
  { key: "email",     label: "Email",       max: undefined, wide: false },
  { key: "username",  label: "Username",    max: undefined, wide: false },
  { key: "socialUrl", label: "Social URL",  max: undefined, wide: true  },
] as const

type SeedKey = typeof SEED_FIELDS[number]["key"]
type SeedMap = Record<SeedKey, string>

// ─── Per-provider config schemas ──────────────────────────────────────────────

type FieldType =
  | { kind: "select"; options: readonly string[] }
  | { kind: "number"; min?: number; max?: number }
  | { kind: "tags"; placeholder?: string }
  | { kind: "text" }

interface ConfigFieldDef {
  key: string
  label: string
  type: FieldType
  hint?: string
}

const PROVIDER_CONFIGS: Record<string, ConfigFieldDef[]> = {
  "dork-search": [
    {
      key: "searchMode",
      label: "Search mode",
      type: { kind: "select", options: ["general", "identity", "documents"] as const },
      hint: "General finds broad results; identity focuses on profiles; documents looks for files.",
    },
    {
      key: "engine",
      label: "Engine",
      type: { kind: "select", options: ["auto", "brave", "searxng", "ddg-browser"] as const },
      hint: "auto lets the backend pick. Use ddg-browser as fallback.",
    },
    {
      key: "keywords",
      label: "Extra keywords",
      type: { kind: "tags", placeholder: "e.g. CEO, empresa, México" },
      hint: "Comma-separated terms appended to every query.",
    },
    {
      key: "platforms",
      label: "Platforms",
      type: { kind: "tags", placeholder: "e.g. linkedin.com, github.com" },
      hint: "Restrict results to these domains (site: operator).",
    },
    {
      key: "fileTypes",
      label: "File types",
      type: { kind: "tags", placeholder: "e.g. pdf, doc, xlsx" },
      hint: "Only applies when searchMode is documents.",
    },
    {
      key: "maxQueries",
      label: "Max queries",
      type: { kind: "number", min: 1, max: 20 },
      hint: "Maximum number of search queries to run (1–20).",
    },
  ],
}

// ─── Category badge colors ────────────────────────────────────────────────────

const CATEGORY_BADGE: Record<string, string> = {
  identity:       "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  social:         "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  financial:      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  legal:          "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  location:       "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  communications: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

// ─── Config field renderer ────────────────────────────────────────────────────

function ConfigField({
  def,
  value,
  onChange,
}: {
  def: ConfigFieldDef
  value: string
  onChange: (v: string) => void
}) {
  const base =
    "w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"

  return (
    <div>
      <label className="text-[10px] text-zinc-400 mb-1 block">{def.label}</label>
      {def.type.kind === "select" ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={base}>
          <option value="">— default —</option>
          {def.type.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : def.type.kind === "number" ? (
        <input
          type="number"
          value={value}
          min={def.type.min}
          max={def.type.max}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.type.min !== undefined ? `${def.type.min}–${def.type.max}` : ""}
          className={base}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={"placeholder" in def.type ? def.type.placeholder : ""}
          className={base}
        />
      )}
      {def.hint && <p className="text-[10px] text-zinc-400 mt-1">{def.hint}</p>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface StartJobDialogProps {
  node: GraphNodeResponse
  investigationId: string
  onClose: () => void
  onSuccess?: (jobs: { id: string; source: string }[]) => void
}

interface RunResult {
  jobs: { id: string; source: string; bullJobId?: string }[]
  message?: string
}

export function StartJobDialog({ node, investigationId, onClose, onSuccess }: StartJobDialogProps) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set())
  // Per-provider raw config values (string form for all inputs)
  const [providerConfigs, setProviderConfigs] = useState<Record<string, Record<string, string>>>({})
  const [expandedConfigs, setExpandedConfigs] = useState<Set<string>>(new Set())
  const [seed, setSeed] = useState<SeedMap>(() => {
    const p = node.properties
    return Object.fromEntries(
      SEED_FIELDS.map(({ key }) => [key, p[key] != null ? String(p[key]) : ""])
    ) as SeedMap
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<number | null>(null)

  useEffect(() => {
    api.get<Provider[]>(`${PREFIX}/providers`)
      .then(({ data }) => setProviders(data.filter((p) => p.isActive)))
      .catch(() => {})
      .finally(() => setLoadingProviders(false))
  }, [])

  function toggleSource(source: string) {
    setSelectedSources((prev) => {
      const next = new Set(prev)
      next.has(source) ? next.delete(source) : next.add(source)
      return next
    })
  }

  function toggleConfigExpanded(source: string) {
    setExpandedConfigs((prev) => {
      const next = new Set(prev)
      next.has(source) ? next.delete(source) : next.add(source)
      return next
    })
  }

  function setConfigValue(source: string, key: string, value: string) {
    setProviderConfigs((prev) => ({
      ...prev,
      [source]: { ...(prev[source] ?? {}), [key]: value },
    }))
  }

  const allSelected = providers.length > 0 && selectedSources.size === providers.length

  function toggleAll() {
    setSelectedSources(allSelected ? new Set() : new Set(providers.map((p) => p.source)))
  }

  function buildProviderConfig(source: string): Record<string, unknown> | undefined {
    const raw = providerConfigs[source]
    if (!raw) return undefined
    const fields = PROVIDER_CONFIGS[source]
    if (!fields) return undefined

    const result: Record<string, unknown> = {}
    for (const def of fields) {
      const v = raw[def.key]
      if (!v) continue
      if (def.type.kind === "number") {
        const n = Number(v)
        if (!isNaN(n)) result[def.key] = n
      } else if (def.type.kind === "tags") {
        const tags = v.split(",").map((s) => s.trim()).filter(Boolean)
        if (tags.length) result[def.key] = tags
      } else {
        result[def.key] = v
      }
    }
    return Object.keys(result).length ? result : undefined
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const seedPayload = Object.fromEntries(
        SEED_FIELDS.map(({ key }) => [key, seed[key]]).filter(([, v]) => v !== "")
      )

      // Build per-provider config for providers that have values set
      const configPayload: Record<string, Record<string, unknown>> = {}
      for (const p of providers) {
        const cfg = buildProviderConfig(p.source)
        if (cfg) configPayload[p.source] = cfg
      }

      const body: Record<string, unknown> = { investigationId }
      if (Object.keys(seedPayload).length) body.seed = seedPayload
      if (selectedSources.size > 0) body.sources = [...selectedSources]
      if (Object.keys(configPayload).length) body.config = configPayload

      const { data } = await api.post<RunResult>(
        `${PREFIX}/scraper/entity/${node.id}/run`,
        body,
        { params: { entityType: node.type } },
      )

      if (!data.jobs.length) {
        setError(data.message ?? "No providers could handle the given seed data.")
        return
      }

      setSuccess(data.jobs.length)
      onSuccess?.(data.jobs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start job.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Start Scraping Job</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{node.label} · {node.type}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
          >
            <XIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Providers */}
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Providers</p>
              {!loadingProviders && providers.length > 0 && (
                <button
                  onClick={toggleAll}
                  className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              )}
            </div>

            {loadingProviders ? (
              <div className="flex items-center gap-2 text-xs text-zinc-400"><SpinnerIcon /> Loading providers…</div>
            ) : providers.length === 0 ? (
              <p className="text-xs text-zinc-400">No active providers found.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {selectedSources.size === 0 && (
                  <p className="text-[10px] text-zinc-400 mb-1">No selection — all capable providers will run.</p>
                )}
                {providers.map((p) => {
                  const checked = selectedSources.has(p.source)
                  const badge = CATEGORY_BADGE[p.category] ?? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  const configFields = PROVIDER_CONFIGS[p.source]
                  const isExpanded = expandedConfigs.has(p.source)
                  const rawConfig = providerConfigs[p.source] ?? {}

                  return (
                    <div
                      key={p.source}
                      className={`rounded-lg border transition-colors ${
                        checked
                          ? "border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/80"
                          : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                      }`}
                    >
                      {/* Provider row */}
                      <label className="flex items-start gap-3 px-3 py-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSource(p.source)}
                          className="mt-0.5 flex-shrink-0 accent-zinc-700 dark:accent-zinc-300"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{p.name}</span>
                            <span className={`text-[10px] font-medium rounded-full px-1.5 py-0.5 ${badge}`}>
                              {p.category}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-zinc-400 mt-0.5">{p.source}</p>
                          {p.supportedInputs.length > 0 && (
                            <p className="text-[10px] text-zinc-400 mt-0.5">Needs: {p.supportedInputs.join(", ")}</p>
                          )}
                        </div>
                        {configFields && (
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); toggleConfigExpanded(p.source) }}
                            className="flex items-center gap-1 flex-shrink-0 mt-0.5 text-[10px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                          >
                            Config
                            <ChevronIcon open={isExpanded} />
                          </button>
                        )}
                      </label>

                      {/* Config section */}
                      {configFields && isExpanded && (
                        <div className="px-3 pb-3 border-t border-zinc-200 dark:border-zinc-700 pt-3 flex flex-col gap-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                            {p.name} config
                          </p>
                          <div className="grid grid-cols-2 gap-2.5">
                            {configFields.map((def) => (
                              <div key={def.key} className={def.type.kind === "tags" ? "col-span-2" : ""}>
                                <ConfigField
                                  def={def}
                                  value={rawConfig[def.key] ?? ""}
                                  onChange={(v) => setConfigValue(p.source, def.key, v)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Seed */}
          <div className="px-5 pt-1 pb-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">Seed Data</p>
            <div className="grid grid-cols-2 gap-2">
              {SEED_FIELDS.map(({ key, label, max, wide }) => (
                <div key={key} className={wide ? "col-span-2" : ""}>
                  <label className="text-[10px] text-zinc-400 mb-1 block">{label}</label>
                  <input
                    type="text"
                    value={seed[key]}
                    maxLength={max}
                    onChange={(e) => setSeed((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={max ? `Max ${max} chars` : ""}
                    className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex-1 min-w-0">
            {error && <p className="text-xs text-red-500 dark:text-red-400 truncate">{error}</p>}
            {success !== null && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {success} job{success !== 1 ? "s" : ""} started successfully.
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {success !== null ? "Close" : "Cancel"}
            </button>
            {success === null && (
              <button
                onClick={handleSubmit}
                disabled={submitting || loadingProviders}
                className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
              >
                {submitting && <SpinnerIcon />}
                {submitting ? "Starting…" : "Start Job"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
