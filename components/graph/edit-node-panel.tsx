"use client";

import { useRef, useState } from "react";
import type { GraphNodeResponse } from "@/lib/graph/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/graph/colors";
import { uploadFile } from "@/lib/api/uploads";

function proxiedUrl(url: string): string {
  if (url.startsWith("/")) return url;
  return `/api/uploads/proxy?url=${encodeURIComponent(url)}`;
}

const SKIP_PROPS = new Set(["type", "createdAt", "updatedAt", "id", "uploadUrl"]);

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

type PropEntry = { key: string; value: string };

function toEntries(properties: Record<string, unknown>): PropEntry[] {
  return Object.entries(properties)
    .filter(([k]) => !SKIP_PROPS.has(k))
    .map(([key, value]) => ({ key, value: value == null ? "" : String(value) }));
}

interface EditNodePanelProps {
  node: GraphNodeResponse;
  onClose: () => void;
  onSave: (nodeId: string, properties: Record<string, unknown>) => Promise<void>;
}

export function EditNodePanel({ node, onClose, onSave }: EditNodePanelProps) {
  const [entries, setEntries] = useState<PropEntry[]>(() => toEntries(node.properties));
  const [newKey, setNewKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string | null>(
    typeof node.properties?.uploadUrl === "string" ? node.properties.uploadUrl : null,
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const color = CATEGORY_COLORS[node.category] ?? "#71717a";
  const categoryLabel = CATEGORY_LABELS[node.category] ?? node.category;

  function updateValue(index: number, value: string) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, value } : e)));
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  const newKeyHasSpaces = /\s/.test(newKey);
  const newKeyDuplicate = entries.some((e) => e.key === newKey.trim());

  function addEntry() {
    const key = newKey.trim();
    if (!key || newKeyHasSpaces || newKeyDuplicate) return;
    setEntries((prev) => [...prev, { key, value: "" }]);
    setNewKey("");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const res = await uploadFile(file);
      setUploadUrl(res.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const properties: Record<string, unknown> = {};
      for (const { key, value } of entries) {
        if (key) properties[key] = value;
      }
      if (uploadUrl) properties.uploadUrl = uploadUrl;
      await onSave(node.id, properties);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="absolute left-4 top-4 z-20 w-72 flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl max-h-[calc(100%-2rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{categoryLabel}</span>
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{node.label}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{node.type}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
        >
          <XIcon />
        </button>
      </div>

      {/* Image upload */}
      <div className="px-4 pt-3 pb-1 flex-shrink-0 flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative group flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center transition-colors hover:border-zinc-400 dark:hover:border-zinc-500 disabled:opacity-60"
        >
          {uploadUrl ? (
            <>
              <img src={proxiedUrl(uploadUrl)} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white"><CameraIcon /></span>
              </div>
            </>
          ) : (
            <span className="text-zinc-400 group-hover:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors">
              <CameraIcon />
            </span>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
          )}
        </button>
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{node.label}</p>
          <p className="text-[10px] text-zinc-400">{uploadUrl ? "Click to change image" : "Click to upload image"}</p>
          {uploadError && <p className="text-[10px] text-red-500 dark:text-red-400">{uploadError}</p>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ID (read-only) */}
      <div className="px-4 pt-2 pb-1 flex-shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">ID</p>
        <p className="text-[11px] font-mono text-zinc-400 truncate">{node.id}</p>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-2.5 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Properties</p>

        {entries.length === 0 && (
          <p className="text-xs text-zinc-400">No properties. Add one below.</p>
        )}

        {entries.map((entry, i) => (
          <div key={entry.key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{entry.key}</label>
              <button
                onClick={() => removeEntry(i)}
                className="text-zinc-300 dark:text-zinc-600 hover:text-red-500 transition-colors p-0.5"
                title="Remove property"
              >
                <TrashIcon />
              </button>
            </div>
            <input
              type="text"
              value={entry.value}
              onChange={(e) => updateValue(i, e.target.value)}
              className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 w-full"
            />
          </div>
        ))}

        {/* Add new property */}
        <div className="flex flex-col gap-1 pt-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEntry()}
              placeholder="New property key…"
              className={`flex-1 rounded-md border border-dashed px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 placeholder:text-zinc-400 outline-none bg-transparent transition-colors ${
                newKeyHasSpaces
                  ? "border-red-400 dark:border-red-500 focus:border-red-500"
                  : "border-zinc-300 dark:border-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-500"
              }`}
            />
            <button
              onClick={addEntry}
              disabled={!newKey.trim() || newKeyHasSpaces || newKeyDuplicate}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              <PlusIcon />
            </button>
          </div>
          {newKeyHasSpaces && (
            <p className="text-[10px] text-red-500 dark:text-red-400">Property keys cannot contain spaces. Use camelCase or snake_case.</p>
          )}
          {!newKeyHasSpaces && newKeyDuplicate && newKey.trim() && (
            <p className="text-[10px] text-amber-500 dark:text-amber-400">A property with this key already exists.</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        <button
          onClick={onClose}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
