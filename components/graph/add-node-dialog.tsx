"use client";

import { useState } from "react";
import type { TramaNodeCategory } from "@/lib/graph/types";
import { CATEGORY_LABELS } from "@/lib/graph/colors";

interface AddNodeDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (label: string, category: TramaNodeCategory) => void;
}

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [TramaNodeCategory, string][];

export function AddNodeDialog({ open, onClose, onAdd }: AddNodeDialogProps) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<TramaNodeCategory>("identity");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    onAdd(label.trim(), category);
    setLabel("");
    setCategory("identity");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-80 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Add Node</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Label</label>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Node label..."
              className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TramaNodeCategory)}
              className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            >
              {CATEGORIES.map(([value, cat]) => (
                <option key={value} value={value}>{cat}</option>
              ))}
            </select>
          </div>
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
              disabled={!label.trim()}
              className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Add Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
