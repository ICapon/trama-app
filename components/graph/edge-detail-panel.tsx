"use client";

import type { GraphEdgeResponse, GraphNodeResponse } from "@/lib/graph/types";
import { CATEGORY_COLORS } from "@/lib/graph/colors";

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

function ChevronRightIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

interface NodeChipProps {
  node?: GraphNodeResponse;
  fallbackId: string;
  onClick?: (node: GraphNodeResponse) => void;
}

function NodeChip({ node, fallbackId, onClick }: NodeChipProps) {
  const dot = node ? (CATEGORY_COLORS[node.category] ?? "#71717a") : "#71717a";

  if (!node) {
    return (
      <span className="flex-1 min-w-0 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-2.5 py-1.5">
        <span className="text-[10px] text-zinc-400 font-mono truncate block">{fallbackId.slice(0, 16)}…</span>
      </span>
    );
  }

  return (
    <button
      onClick={() => onClick?.(node)}
      title="Abrir nodo"
      className="flex-1 min-w-0 flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-left hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors group"
    >
      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
      <span className="flex-1 min-w-0">
        <span className="text-[10px] font-semibold text-zinc-400">{node.type}</span>
        <span className="block text-xs text-zinc-700 dark:text-zinc-300 truncate">{node.label}</span>
      </span>
      <ChevronRightIcon />
    </button>
  );
}

interface EdgeDetailPanelProps {
  edge: GraphEdgeResponse;
  sourceNode?: GraphNodeResponse;
  targetNode?: GraphNodeResponse;
  onClose: () => void;
  onNodeClick?: (node: GraphNodeResponse) => void;
}

export function EdgeDetailPanel({ edge, sourceNode, targetNode, onClose, onNodeClick }: EdgeDetailPanelProps) {
  const extraProps = edge.properties
    ? Object.entries(edge.properties).filter(([, v]) => v !== null && v !== undefined && v !== "")
    : [];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">Relación</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {edge.label ?? edge.type}
          </p>
          {edge.label && edge.label !== edge.type && (
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{edge.type}</p>
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
        {/* Connection — now clickable */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Nodos conectados</p>
          <div className="flex items-center gap-2">
            <NodeChip node={sourceNode} fallbackId={edge.source} onClick={onNodeClick} />
            <span className="text-zinc-400 flex-shrink-0"><ArrowRightIcon /></span>
            <NodeChip node={targetNode} fallbackId={edge.target} onClick={onNodeClick} />
          </div>
        </div>

        {/* Extra properties */}
        {extraProps.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Propiedades</p>
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
