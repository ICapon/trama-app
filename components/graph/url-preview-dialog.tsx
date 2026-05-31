"use client"

import { useState } from "react"

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}

interface UrlPreviewDialogProps {
  url: string
  label?: string
  onClose: () => void
}

export function UrlPreviewDialog({ url, label, onClose }: UrlPreviewDialogProps) {
  const [copied, setCopied] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [loading, setLoading] = useState(true)

  async function handleCopy() {
    await navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleReload() {
    setLoading(true)
    setIframeKey((k) => k + 1)
  }

  const displayUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "")

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-4xl flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
        style={{ height: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 bg-zinc-50 dark:bg-zinc-900/80">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={onClose}
              className="h-3 w-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors"
              title="Close"
            />
            <div className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>

          {/* URL bar */}
          <div className="flex-1 flex items-center gap-2 min-w-0 bg-white dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1.5">
            {loading && (
              <svg className="animate-spin flex-shrink-0" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            )}
            {label && (
              <span className="text-[10px] font-medium text-zinc-400 flex-shrink-0">{label} ·</span>
            )}
            <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate font-mono">{displayUrl}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleReload}
              title="Reload"
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <RefreshIcon />
            </button>
            <button
              onClick={handleCopy}
              title={copied ? "Copied!" : "Copy URL"}
              className={`p-1.5 rounded-md transition-colors ${copied ? "text-emerald-500" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
            >
              <CopyIcon />
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ExternalLinkIcon />
            </a>
            <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <XIcon />
            </button>
          </div>
        </div>

        {/* Iframe */}
        <div className="relative flex-1 bg-white">
          <iframe
            key={iframeKey}
            src={url}
            title={label ?? url}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
          {/* Fallback overlay — shown only when iframe can't load due to X-Frame-Options.
              We can't detect this reliably, so we just show a subtle open-in-tab nudge. */}
          <noscript>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">Preview not available</p>
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-sky-600 dark:text-sky-400 underline">
                Open in new tab
              </a>
            </div>
          </noscript>
        </div>
      </div>
    </div>
  )
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export function isUrl(value: unknown): value is string {
  if (typeof value !== "string") return false
  try {
    const u = new URL(value)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}
