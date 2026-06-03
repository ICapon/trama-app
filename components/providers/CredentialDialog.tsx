"use client"

import { useEffect, useState } from "react"
import { providerCredentialsApi } from "@/lib/api/provider-credentials"
import type { ProviderCredential } from "@/types/provider-credential"

interface Props {
  providerSource: string
  providerName: string
  onClose: () => void
}

const EMPTY_FORM = { key: "", label: "", value: "", isActive: true, expiresAt: "" }

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
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

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function CredentialDialog({ providerSource, providerName, onClose }: Props) {
  const [credentials, setCredentials] = useState<ProviderCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    providerCredentialsApi.list(providerSource)
      .then(({ data }) => setCredentials(data))
      .finally(() => setLoading(false))
  }, [providerSource])

  function setField(field: keyof typeof EMPTY_FORM, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { data } = await providerCredentialsApi.create({
        providerSource,
        key: form.key.trim(),
        label: form.label.trim(),
        value: form.value,
        isActive: form.isActive,
        expiresAt: form.expiresAt || undefined,
      })
      setCredentials((prev) => [...prev, data])
      setForm(EMPTY_FORM)
      setShowAdd(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving credential")
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateValue(id: string) {
    if (!editValue.trim()) return
    setSaving(true)
    try {
      const { data } = await providerCredentialsApi.update(id, { value: editValue })
      setCredentials((prev) => prev.map((c) => (c.id === id ? data : c)))
      setEditingId(null)
      setEditValue("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error updating credential")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(credential: ProviderCredential) {
    const { data } = await providerCredentialsApi.update(credential.id, { isActive: !credential.isActive })
    setCredentials((prev) => prev.map((c) => (c.id === credential.id ? data : c)))
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await providerCredentialsApi.remove(id)
      setCredentials((prev) => prev.filter((c) => c.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const inputClass = "w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
  const labelClass = "text-xs font-medium text-zinc-500 dark:text-zinc-400"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[520px] max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Credentials</h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{providerSource}</p>
          </div>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
          >
            <PlusIcon />
            Add
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* Add form */}
          {showAdd && (
            <form onSubmit={handleCreate} className="flex flex-col gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4">
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">New credential</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Key <span className="text-red-500">*</span></label>
                  <input required value={form.key} onChange={(e) => setField("key", e.target.value)} placeholder="bearer_token" className={inputClass} />
                  <p className="text-[10px] text-zinc-400">Slug técnico (sin espacios)</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Label <span className="text-red-500">*</span></label>
                  <input required value={form.label} onChange={(e) => setField("label", e.target.value)} placeholder="Bearer Token" className={inputClass} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Value <span className="text-red-500">*</span></label>
                <input required type="password" value={form.value} onChange={(e) => setField("value", e.target.value)} placeholder="••••••••••••" className={inputClass} autoComplete="new-password" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Expires at (optional)</label>
                <input type="datetime-local" value={form.expiresAt} onChange={(e) => setField("expiresAt", e.target.value)} className={inputClass} />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setField("isActive", e.target.checked)} className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 dark:accent-zinc-100" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Active</span>
              </label>
              {error && (
                <p className="rounded-md bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); setError(null) }} className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors">
                  {saving ? "Saving…" : "Save credential"}
                </button>
              </div>
            </form>
          )}

          {/* Credentials list */}
          {loading ? (
            <p className="text-sm text-zinc-400">Loading...</p>
          ) : credentials.length === 0 ? (
            <p className="text-sm text-zinc-400">No credentials configured for {providerName}.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {credentials.map((cred) => (
                <div key={cred.id} className={`rounded-lg border px-4 py-3 flex flex-col gap-2 ${!cred.isActive ? "opacity-60" : ""} border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{cred.label}</p>
                      <p className="text-[10px] font-mono text-zinc-400">{cred.key}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Toggle */}
                      <button
                        onClick={() => handleToggle(cred)}
                        title={cred.isActive ? "Deactivate" : "Activate"}
                        className={`relative w-8 h-4 rounded-full transition-colors focus:outline-none ${cred.isActive ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${cred.isActive ? "translate-x-3.5" : ""}`} />
                      </button>
                      {/* Reveal/hide value */}
                      <button
                        onClick={() => setRevealedIds((s) => { const n = new Set(s); n.has(cred.id) ? n.delete(cred.id) : n.add(cred.id); return n })}
                        title={revealedIds.has(cred.id) ? "Hide" : "Show edit field"}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <EyeIcon visible={revealedIds.has(cred.id)} />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(cred.id)}
                        disabled={deletingId === cred.id}
                        title="Delete"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-500/8 transition-colors disabled:opacity-50"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>

                  {/* Edit value inline */}
                  {revealedIds.has(cred.id) && (
                    <div className="flex gap-2">
                      <input
                        type={editingId === cred.id ? "text" : "password"}
                        placeholder="New value…"
                        value={editingId === cred.id ? editValue : ""}
                        onFocus={() => { setEditingId(cred.id); setEditValue("") }}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                        autoComplete="new-password"
                      />
                      {editingId === cred.id && editValue && (
                        <button
                          onClick={() => handleUpdateValue(cred.id)}
                          disabled={saving}
                          className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                        >
                          {saving ? "…" : "Update"}
                        </button>
                      )}
                    </div>
                  )}

                  {cred.expiresAt && (
                    <p className="text-[10px] text-zinc-400">
                      Expires: {new Date(cred.expiresAt).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
