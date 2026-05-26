"use client";

import type { GraphEdgeResponse, GraphNodeResponse } from "@/lib/graph/types";

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M15 6l6 6-6 6" />
    </svg>
  );
}

interface EdgeDetailPanelProps {
  edge: GraphEdgeResponse;
  sourceNode?: GraphNodeResponse;
  targetNode?: GraphNodeResponse;
  onClose: () => void;
}

export function EdgeDetailPanel({ edge, sourceNode, targetNode, onClose }: EdgeDetailPanelProps) {
  const extraProps = edge.properties
    ? Object.entries(edge.properties).filter(([, v]) => v !== null && v !== undefined && v !== "")
    : [];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">Relation</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {edge.label ?? edge.type}
          </p>
          {edge.label && edge.label !== edge.type && (
            <p className="text-xs text-zinc-400 mt-0.5">{edge.type}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
        >
          <XIcon />
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Connection */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Connection</p>
          <div className="flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2.5">
            <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate flex-1 text-right">
              {sourceNode?.label ?? edge.source}
            </span>
            <span className="text-zinc-400 flex-shrink-0"><ArrowRightIcon /></span>
            <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate flex-1">
              {targetNode?.label ?? edge.target}
            </span>
          </div>
        </div>

        {/* Extra properties */}
        {extraProps.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Properties</p>
            {extraProps.map(([key, value]) => (
              <div key={key}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">{key}</p>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 break-all">{String(value)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
