"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { cronJobsApi } from "@/lib/api/cron-jobs"
import type { CronJob, CronJobSeed, CronJobConfig } from "@/types/cron-job"

// ─── Cron presets ─────────────────────────────────────────────────────────────

const CRON_PRESETS = [
  { label: "Every hour",        value: "0 * * * *" },
  { label: "Every 6 hours",     value: "0 */6 * * *" },
  { label: "Every day at 8am",  value: "0 8 * * *" },
  { label: "Every Monday 8am",  value: "0 8 * * 1" },
  { label: "Custom…",           value: "custom" },
]

// ─── Provider seed config ─────────────────────────────────────────────────────

type SeedField = {
  key: keyof CronJobSeed
  label: string
  placeholder?: string
  hint?: string
  required?: boolean
  wide?: boolean // span both columns
}

type SeedGroup = {
  title: string | null
  fields: SeedField[]
}

type ConfigField = {
  key: keyof CronJobConfig
  label: string
  type: "text" | "select" | "number"
  placeholder?: string
  hint?: string
  options?: { value: string; label: string }[]
}

type ProviderConfig = {
  label: string
  description: string
  seedGroups: SeedGroup[]
  configFields?: ConfigField[]
  validateSeed?: (seed: Record<string, string>) => boolean
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  "curp-renapo": {
    label: "CURP / RENAPO",
    description: "Decodifica CURP y enriquece desde el registro nacional.",
    seedGroups: [
      {
        title: null,
        fields: [
          { key: "curp", label: "CURP", placeholder: "XXXX000000XXXXXX00", hint: "18 caracteres", required: true, wide: true },
        ],
      },
    ],
    validateSeed: (s) => !!s.curp?.trim(),
  },

  "sat-rfc": {
    label: "SAT RFC",
    description: "Consulta RFC y situación fiscal en el SAT.",
    seedGroups: [
      {
        title: null,
        fields: [
          { key: "rfc", label: "RFC", placeholder: "XXXX000000XXX", hint: "Persona física (13 chars) o moral (12 chars)", required: true, wide: true },
        ],
      },
    ],
    validateSeed: (s) => !!s.rfc?.trim(),
  },

  "x-social": {
    label: "X / Twitter",
    description: "Extrae perfil público y posts recientes de X.",
    seedGroups: [
      {
        title: null,
        fields: [
          { key: "username", label: "Username", placeholder: "handle (sin @)" },
          { key: "socialUrl", label: "URL del perfil", placeholder: "https://x.com/handle" },
        ],
      },
    ],
    validateSeed: (s) => !!(s.username?.trim() || s.socialUrl?.trim()),
  },

  "dork-search": {
    label: "Dork Search",
    description: "Búsqueda OSINT con dorks — persona, empresa, dominio, o cualquier término.",
    seedGroups: [
      {
        title: "Persona",
        fields: [
          { key: "fullName",  label: "Nombre completo", placeholder: "Juan García López" },
          { key: "firstName", label: "Nombre",           placeholder: "Juan" },
          { key: "lastName",  label: "Apellido(s)",      placeholder: "García López" },
          { key: "email",     label: "Email",            placeholder: "juan@example.com" },
          { key: "username",  label: "Username",         placeholder: "handle o @handle" },
        ],
      },
      {
        title: "Empresa / Organización",
        fields: [
          { key: "organization", label: "Nombre", placeholder: "ACME México S.A. de C.V.", wide: true },
        ],
      },
      {
        title: "Técnico",
        fields: [
          { key: "domain", label: "Dominio", placeholder: "empresa.com.mx" },
          { key: "phone",  label: "Teléfono", placeholder: "+52 55 1234 5678" },
        ],
      },
      {
        title: "Búsqueda libre",
        fields: [
          { key: "query", label: "Término / expresión", placeholder: "cualquier frase, nombre de proyecto, etc.", hint: "Se usa directamente como base de la búsqueda", wide: true },
        ],
      },
    ],
    configFields: [
      {
        key: "searchMode",
        label: "Modo",
        type: "select",
        options: [
          { value: "general",   label: "General" },
          { value: "identity",  label: "Identidad" },
          { value: "documents", label: "Documentos" },
        ],
      },
      { key: "platforms",  label: "Plataformas",   type: "text",   placeholder: "linkedin.com, github.com",  hint: "Separadas por coma" },
      { key: "keywords",   label: "Keywords",      type: "text",   placeholder: "fraude, escándalo",         hint: "Separadas por coma" },
      { key: "maxQueries", label: "Queries máx.",  type: "number", placeholder: "3",                        hint: "1–20" },
    ],
    validateSeed: (s) =>
      !!(s.fullName?.trim() || s.firstName?.trim() || s.organization?.trim() ||
         s.domain?.trim() || s.phone?.trim() || s.query?.trim() ||
         s.email?.trim() || s.username?.trim()),
  },
}

const SOURCE_OPTIONS = [
  ...Object.entries(PROVIDER_CONFIGS).map(([value, cfg]) => ({ value, label: cfg.label })),
  { value: "custom", label: "Custom / Otro" },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseCommaList(val: string): string[] {
  return val.split(",").map((s) => s.trim()).filter(Boolean)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (job: CronJob) => void
}

export function NewCronJobDialog({ open, onClose, onCreated }: Props) {
  const [name, setName]               = useState("")
  const [description, setDescription] = useState("")
  const [cronPreset, setCronPreset]   = useState(CRON_PRESETS[2].value)
  const [cronCustom, setCronCustom]   = useState("")
  const [source, setSource]           = useState<string>("dork-search")
  const [entityId, setEntityId]       = useState("")
  const [investigationId, setInvestigationId] = useState("")
  // Dynamic seed/config values keyed by field key
  const [seedValues, setSeedValues]   = useState<Record<string, string>>({})
  const [configValues, setConfigValues] = useState<Record<string, string>>({})
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const nameRef = useRef<HTMLInputElement>(null)

  const isCustomCron    = cronPreset === "custom"
  const cronExpression  = isCustomCron ? cronCustom : cronPreset
  const providerConfig  = source !== "custom" ? PROVIDER_CONFIGS[source] : null

  // Reset dynamic fields when source changes
  function handleSourceChange(val: string) {
    setSource(val)
    setSeedValues({})
    setConfigValues({})
  }

  useEffect(() => {
    if (open) {
      setName(""); setDescription(""); setCronPreset(CRON_PRESETS[2].value)
      setCronCustom(""); setSource("dork-search"); setEntityId("")
      setInvestigationId(""); setSeedValues({}); setConfigValues({})
      setError(null)
      setTimeout(() => nameRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  function setSeed(key: string, value: string) {
    setSeedValues((prev) => ({ ...prev, [key]: value }))
  }

  function setConfig(key: string, value: string) {
    setConfigValues((prev) => ({ ...prev, [key]: value }))
  }

  function buildSeed(): CronJobSeed | undefined {
    const entries = Object.entries(seedValues).filter(([, v]) => v.trim())
    if (!entries.length) return undefined
    return Object.fromEntries(entries) as CronJobSeed
  }

  function buildConfig(): CronJobConfig | undefined {
    if (!providerConfig?.configFields) return undefined
    const result: Record<string, unknown> = {}
    for (const field of providerConfig.configFields) {
      const raw = configValues[field.key]?.trim()
      if (!raw) continue
      if (field.key === "platforms" || field.key === "keywords" || field.key === "fileTypes") {
        result[field.key] = parseCommaList(raw)
      } else if (field.key === "maxQueries") {
        const n = parseInt(raw, 10)
        if (!isNaN(n)) result[field.key] = n
      } else {
        result[field.key] = raw
      }
    }
    return Object.keys(result).length ? (result as CronJobConfig) : undefined
  }

  function isSeedValid(): boolean {
    if (!providerConfig) return true // custom — no seed validation
    return providerConfig.validateSeed ? providerConfig.validateSeed(seedValues) : true
  }

  const canSubmit =
    !loading &&
    name.trim() &&
    cronExpression.trim() &&
    entityId.trim() &&
    investigationId.trim() &&
    isSeedValid()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setError(null)
    try {
      const { data } = await cronJobsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        cronExpression: cronExpression.trim(),
        source: source === "custom" ? "" : source,
        entityId: entityId.trim(),
        investigationId: investigationId.trim(),
        seed: buildSeed(),
        config: buildConfig(),
      })
      onCreated(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 py-4 shrink-0">
          <h2 id="dialog-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            New Scheduled Job
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5 overflow-y-auto">

          {/* Name + Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cj-name" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              id="cj-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekly RFC check"
              required
              disabled={loading}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cj-desc" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Description</label>
            <textarea
              id="cj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              disabled={loading}
              className="w-full resize-none rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50"
            />
          </div>

          {/* Schedule */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Schedule <span className="text-red-500">*</span>
            </label>
            <select
              value={cronPreset}
              onChange={(e) => setCronPreset(e.target.value)}
              disabled={loading}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50"
            >
              {CRON_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            {isCustomCron ? (
              <input
                type="text"
                value={cronCustom}
                onChange={(e) => setCronCustom(e.target.value)}
                placeholder="0 8 * * 1"
                required
                disabled={loading}
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50"
              />
            ) : (
              <p className="text-xs text-zinc-400 font-mono">{cronPreset}</p>
            )}
          </div>

          {/* Source */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Source <span className="text-red-500">*</span>
            </label>
            <select
              value={source}
              onChange={(e) => handleSourceChange(e.target.value)}
              disabled={loading}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50"
            >
              {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {providerConfig && (
              <p className="text-xs text-zinc-400">{providerConfig.description}</p>
            )}
          </div>

          {/* ── Contextual seed section ────────────────────────────────────── */}
          {providerConfig && (
            <div className="flex flex-col gap-4">
              {providerConfig.seedGroups.map((group, gi) => (
                <div key={gi} className="flex flex-col gap-2">
                  {group.title && (
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                      {group.title}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {group.fields.map((field) => (
                      <div key={field.key} className={`flex flex-col gap-1 ${field.wide ? "col-span-2" : ""}`}>
                        <label htmlFor={`cj-seed-${field.key}`} className="text-xs text-zinc-600 dark:text-zinc-400">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        <input
                          id={`cj-seed-${field.key}`}
                          type="text"
                          value={seedValues[field.key] ?? ""}
                          onChange={(e) => setSeed(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          disabled={loading}
                          className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50"
                        />
                        {field.hint && (
                          <p className="text-[11px] text-zinc-400">{field.hint}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Config fields (dork) */}
              {providerConfig.configFields && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                    Opciones de búsqueda
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {providerConfig.configFields.map((field) => (
                      <div key={field.key} className="flex flex-col gap-1">
                        <label htmlFor={`cj-cfg-${field.key}`} className="text-xs text-zinc-600 dark:text-zinc-400">
                          {field.label}
                        </label>
                        {field.type === "select" ? (
                          <select
                            id={`cj-cfg-${field.key}`}
                            value={configValues[field.key] ?? ""}
                            onChange={(e) => setConfig(field.key, e.target.value)}
                            disabled={loading}
                            className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50"
                          >
                            <option value="">Default</option>
                            {field.options?.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id={`cj-cfg-${field.key}`}
                            type={field.type === "number" ? "number" : "text"}
                            value={configValues[field.key] ?? ""}
                            onChange={(e) => setConfig(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            disabled={loading}
                            min={field.key === "maxQueries" ? 1 : undefined}
                            max={field.key === "maxQueries" ? 20 : undefined}
                            className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50"
                          />
                        )}
                        {field.hint && (
                          <p className="text-[11px] text-zinc-400">{field.hint}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Entity + Investigation */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cj-entity" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Entity ID <span className="text-red-500">*</span>
              </label>
              <input
                id="cj-entity"
                type="text"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="Neo4j node UUID"
                required
                disabled={loading}
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cj-inv" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Investigation ID <span className="text-red-500">*</span>
              </label>
              <input
                id="cj-inv"
                type="text"
                value={investigationId}
                onChange={(e) => setInvestigationId(e.target.value)}
                placeholder="Investigation UUID"
                required
                disabled={loading}
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-md bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center gap-2 rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <SpinnerIcon />}
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
