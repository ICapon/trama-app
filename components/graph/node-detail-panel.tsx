"use client";

import { useState } from "react";
import type { GraphEdge } from "reagraph";
import type { GraphNodeResponse, GraphEdgeResponse } from "@/lib/graph/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/graph/colors";
import { isUrl } from "@/components/graph/url-preview-dialog";
import { SocialAnalysisPanel } from "@/components/graph/SocialAnalysisPanel";

const SKIP_PROPS = new Set(["type", "createdAt", "updatedAt", "id"]);

const LOCATION_PROPS = new Set(["declaredLocation", "location", "address", "place"]);

function isLocationProp(key: string) {
  return LOCATION_PROPS.has(key) || key.toLowerCase().includes("location") || key.toLowerCase().includes("address");
}

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

function GlobeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

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

function ChevronRightIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

interface EdgesListProps {
  nodeId: string;
  edges: GraphEdge[];
  rawNodes?: Map<string, GraphNodeResponse>;
  onEdgeClick?: (edge: GraphEdgeResponse) => void;
}

function EdgesList({ nodeId, edges, rawNodes, onEdgeClick }: EdgesListProps) {
  return (
    <div className="flex flex-col gap-1 px-3 py-3 overflow-y-auto">
      {edges.map((edge) => {
        const isOutgoing = edge.source === nodeId;
        const otherId = isOutgoing ? edge.target : edge.source;
        const otherNode = rawNodes?.get(otherId);
        const edgeData = edge.data as GraphEdgeResponse | undefined;
        const relType = edgeData?.type ?? edge.label ?? "—";
        const otherDot = otherNode ? (CATEGORY_COLORS[otherNode.category] ?? "#71717a") : "#71717a";

        return (
          <button
            key={edge.id}
            onClick={() => edgeData && onEdgeClick?.(edgeData)}
            disabled={!edgeData || !onEdgeClick}
            className="flex items-center gap-2 w-full rounded-md border border-transparent px-2.5 py-2 text-left hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors disabled:cursor-default group"
          >
            {/* Direction arrow */}
            <span className={`text-[10px] font-bold flex-shrink-0 w-4 text-center ${isOutgoing ? "text-sky-500" : "text-violet-500"}`}>
              {isOutgoing ? "→" : "←"}
            </span>

            {/* Relation type */}
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 w-28 truncate flex-shrink-0">
              {relType}
            </span>

            {/* Other node */}
            <span className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: otherDot }} />
              <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">
                {otherNode?.label ?? otherId.slice(0, 14) + "…"}
              </span>
            </span>

            {/* Chevron */}
            <span className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 flex-shrink-0 transition-colors">
              <ChevronRightIcon />
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface NodeDetailPanelProps {
  node: GraphNodeResponse;
  isBookmarked: boolean;
  note: string;
  onClose: () => void;
  onToggleBookmark: () => void;
  onNoteChange: (note: string) => void;
  connectedEdges?: GraphEdge[];
  rawNodes?: Map<string, GraphNodeResponse>;
  onEdgeClick?: (edge: GraphEdgeResponse) => void;
}

export function NodeDetailPanel({
  node,
  isBookmarked,
  note,
  onClose,
  onToggleBookmark,
  onNoteChange,
  connectedEdges = [],
  rawNodes,
  onEdgeClick,
}: NodeDetailPanelProps) {
  const [localNote, setLocalNote] = useState(note);
  const [activeTab, setActiveTab] = useState<"props" | "edges" | "analysis">("props");
  const isSocialProfile = node.type === "SocialProfile";
  const color = CATEGORY_COLORS[node.category] ?? "#71717a";
  const categoryLabel = CATEGORY_LABELS[node.category] ?? node.category;

  const knownProps = Object.entries(node.properties).filter(
    ([k, v]) => !SKIP_PROPS.has(k) && v !== null && v !== undefined && v !== "" && !Array.isArray(v),
  );

  const locationProps = knownProps.filter(([k]) => isLocationProp(k));
  const otherProps = knownProps.filter(([k]) => !isLocationProp(k));

  function handleNoteBlur() {
    if (localNote !== note) onNoteChange(localNote);
  }

  return (
    <>
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

      {/* Tabs — always visible when there are edges, analysis only for SocialProfile */}
      {(connectedEdges.length > 0 || isSocialProfile) && (
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4">
          <button
            onClick={() => setActiveTab("props")}
            className={`pb-2 pt-1 mr-4 text-xs font-medium border-b-2 transition-colors ${activeTab === "props" ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100" : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
          >
            Propiedades
          </button>
          {connectedEdges.length > 0 && (
            <button
              onClick={() => setActiveTab("edges")}
              className={`pb-2 pt-1 mr-4 text-xs font-medium border-b-2 transition-colors ${activeTab === "edges" ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100" : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
            >
              Edges <span className="ml-0.5 text-zinc-400 font-normal">({connectedEdges.length})</span>
            </button>
          )}
          {isSocialProfile && (
            <button
              onClick={() => setActiveTab("analysis")}
              className={`pb-2 pt-1 mr-4 text-xs font-medium border-b-2 transition-colors ${activeTab === "analysis" ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100" : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
            >
              Análisis
            </button>
          )}
        </div>
      )}

      {/* Edges tab */}
      {activeTab === "edges" && connectedEdges.length > 0 && (
        <EdgesList
          nodeId={node.id}
          edges={connectedEdges}
          rawNodes={rawNodes}
          onEdgeClick={onEdgeClick}
        />
      )}

      {/* Analysis tab */}
      {isSocialProfile && activeTab === "analysis" && (
        <SocialAnalysisPanel nodeId={node.id} />
      )}

      {/* Properties */}
      {(!isSocialProfile || activeTab === "props") && (
      <div className="flex flex-col gap-4 p-4">
        {knownProps.length === 0 ? (
          <p className="text-xs text-zinc-400">No additional properties</p>
        ) : (
          <>
            {/* Location section — shown first if present */}
            {locationProps.length > 0 && (
              <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <MapPinIcon />
                  <p className="text-[10px] font-semibold uppercase tracking-wider">Ubicación</p>
                </div>
                {locationProps.map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mb-0.5">{PROP_LABELS[key] ?? key}</p>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 break-all">{String(value)}</p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(String(value))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Buscar en Google Maps"
                      className="flex-shrink-0 p-1 rounded-md text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 transition-colors mt-3"
                    >
                      <GlobeIcon />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Rest of properties */}
            {otherProps.map(([key, value]) => (
              <div key={key}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  {PROP_LABELS[key] ?? key}
                </p>
                {key === "confidence" && typeof value === "number" ? (
                  <ConfidenceBar value={value} />
                ) : key === "riskScore" && typeof value === "number" ? (
                  <RiskBadge value={value} />
                ) : isUrl(value) ? (
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 break-all min-w-0 flex-1">{String(value)}</p>
                    <a href={String(value)} target="_blank" rel="noopener noreferrer" title="Open in new tab" className="flex-shrink-0 p-1 rounded-md text-zinc-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors">
                      <GlobeIcon />
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 break-all">{String(value)}</p>
                )}
              </div>
            ))}
          </>
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

      )}

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

</>
  );
}
