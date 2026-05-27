"use client";

import { useState } from "react";
import type { GraphNodeResponse } from "@/lib/graph/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/graph/colors";

const SKIP_PROPS = new Set(["type", "createdAt", "updatedAt", "id"]);

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

  async function handleSave() {
    setSaving(true);
    try {
      const properties: Record<string, unknown> = {};
      for (const { key, value } of entries) {
        if (key) properties[key] = value;
      }
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

      {/* ID (read-only) */}
      <div className="px-4 pt-3 pb-1 flex-shrink-0">
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
          disabled={saving}
          className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
