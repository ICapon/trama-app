"use client";

import { useState } from "react";
import type { GraphNodeResponse } from "@/lib/graph/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/graph/colors";

const SKIP_PROPS = new Set(["type", "createdAt", "updatedAt", "id"]);

const PROP_LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  secondLastName: "Second last name",
  fullName: "Full name",
  birthDate: "Birth date",
  gender: "Gender",
  nationality: "Nationality",
  occupation: "Occupation",
  confidence: "Confidence",
  riskScore: "Risk score",
  scrapeStatus: "Status",
  source: "Source",
  value: "Value",
  normalizedValue: "Normalized",
  description: "Description",
  notes: "Notes",
};

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-zinc-500">{pct}%</span>
    </div>
  );
}

function RiskBadge({ value }: { value: number }) {
  const color =
    value >= 70 ? "bg-red-500/10 text-red-600 dark:text-red-400" :
    value >= 40 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{value}/100</span>
  );
}

interface NodeDetailPanelProps {
  node: GraphNodeResponse;
  isBookmarked: boolean;
  note: string;
  onClose: () => void;
  onToggleBookmark: () => void;
  onNoteChange: (note: string) => void;
}

export function NodeDetailPanel({
  node,
  isBookmarked,
  note,
  onClose,
  onToggleBookmark,
  onNoteChange,
}: NodeDetailPanelProps) {
  const [localNote, setLocalNote] = useState(note);
  const color = CATEGORY_COLORS[node.category] ?? "#71717a";
  const categoryLabel = CATEGORY_LABELS[node.category] ?? node.category;

  const knownProps = Object.entries(node.properties).filter(
    ([k, v]) => !SKIP_PROPS.has(k) && v !== null && v !== undefined && v !== "",
  );

  function handleNoteBlur() {
    if (localNote !== note) onNoteChange(localNote);
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              {categoryLabel}
            </span>
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{node.label}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{node.type}</p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggleBookmark}
            title={isBookmarked ? "Remove bookmark" : "Bookmark node"}
            className={`p-1.5 rounded-md transition-colors ${
              isBookmarked
                ? "text-amber-500 bg-amber-500/10"
                : "text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <BookmarkIcon filled={isBookmarked} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <XIcon />
          </button>
        </div>
      </div>

      {/* Properties */}
      <div className="flex flex-col gap-4 p-4">
        {knownProps.length === 0 ? (
          <p className="text-xs text-zinc-400">No additional properties</p>
        ) : (
          knownProps.map(([key, value]) => (
            <div key={key}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                {PROP_LABELS[key] ?? key}
              </p>
              {key === "confidence" && typeof value === "number" ? (
                <ConfidenceBar value={value} />
              ) : key === "riskScore" && typeof value === "number" ? (
                <RiskBadge value={value} />
              ) : (
                <p className="text-xs text-zinc-700 dark:text-zinc-300 break-all">{String(value)}</p>
              )}
            </div>
          ))
        )}

        {/* Analyst note */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
            Analyst note
          </p>
          <textarea
            value={localNote}
            onChange={(e) => setLocalNote(e.target.value)}
            onBlur={handleNoteBlur}
            rows={3}
            placeholder="Add a note…"
            className="w-full resize-none rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-2.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />
        </div>
      </div>

      {/* Footer timestamps */}
      <div className="mt-auto border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Created</p>
          <p className="text-xs text-zinc-500">{new Date(node.createdAt).toLocaleDateString("es-MX")}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Updated</p>
          <p className="text-xs text-zinc-500">{new Date(node.updatedAt).toLocaleDateString("es-MX")}</p>
        </div>
      </div>
    </div>
  );
}
