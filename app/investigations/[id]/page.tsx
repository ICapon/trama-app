"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { GraphNode, GraphEdge } from "reagraph"
import { investigationsApi } from "@/lib/api/investigations"
import { TramaGraph } from "@/components/graph/graph-canvas"
import type { GraphLayout } from "@/components/graph/graph-canvas"
import { NodeDetailPanel } from "@/components/graph/node-detail-panel"
import { EdgeDetailPanel } from "@/components/graph/edge-detail-panel"
import { AddNodeDialog } from "@/components/graph/add-node-dialog"
import { AddEdgeDialog } from "@/components/graph/add-edge-dialog"
import { EditNodePanel } from "@/components/graph/edit-node-panel"
import { useInvestigationGraph, type GraphFilters } from "@/hooks/use-investigation-graph"
import { GraphFilterToolbar } from "@/components/graph/graph-filter-toolbar"
import { GraphConfigPanel } from "@/components/graph/graph-config-panel"
import type { GraphConfig } from "@/types/graph-config"
import { useViewState } from "@/hooks/use-view-state"
import { toReagraphNode, toReagraphEdge } from "@/lib/graph/adapters"
import { graphApi } from "@/lib/api/graph"
import type { Investigation, InvestigationStatus, InvestigationPriority } from "@/types/investigation"
import type { GraphEdgeResponse, GraphNodeResponse, TramaNodeType } from "@/lib/graph/types"

// ─── Display maps ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<InvestigationStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  closed: "Closed",
  archived: "Archived",
}

const STATUS_STYLES: Record<InvestigationStatus, string> = {
  open: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  closed: "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20",
  archived: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
}

const PRIORITY_DOT: Record<InvestigationPriority, string> = {
  low: "bg-zinc-400",
  medium: "bg-sky-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
}

const PRIORITY_LABELS: Record<InvestigationPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
}

const NODE_TYPE_STYLES: Record<string, string> = {
  Person: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Organization: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Location: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function PlusCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

function ArrowsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M15 6l6 6-6 6" />
    </svg>
  )
}

function LayoutForceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <circle cx="4" cy="5" r="2" />
      <circle cx="20" cy="5" r="2" />
      <circle cx="4" cy="19" r="2" />
      <circle cx="20" cy="19" r="2" />
      <path d="M10 10 6 7M14 10l4-3M10 14l-4 3M14 14l4 3" />
    </svg>
  )
}

function LayoutHierarchicalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <rect x="2" y="10" width="6" height="4" rx="1" />
      <rect x="16" y="10" width="6" height="4" rx="1" />
      <rect x="9" y="18" width="6" height="4" rx="1" />
      <path d="M12 6v4M5 14v4M19 14v4M12 10H5M12 10h7" />
    </svg>
  )
}

function Trash2Icon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

// ─── Tool panel ───────────────────────────────────────────────────────────────

type ActiveTool = "node" | "edge" | "delete" | null

const TOOLS = [
  { id: "node"   as const, icon: <PlusCircleIcon />, label: "Node",     hint: "Click on the canvas to add a node" },
  { id: "edge"   as const, icon: <ArrowsIcon />,     label: "Relation", hint: "Connect two existing nodes" },
  { id: "delete" as const, icon: <Trash2Icon />,     label: "Delete Node", hint: "Click a node to delete it" },
]

interface ToolButtonProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  variant?: "default" | "destructive"
}

function ToolButton({ icon, label, active, onClick, variant = "default" }: ToolButtonProps) {
  const base = "flex items-center gap-2.5 w-full rounded-md px-3 py-2.5 text-xs font-medium transition-colors text-left"
  const style =
    variant === "destructive"
      ? active
        ? "bg-red-500 text-white"
        : "text-zinc-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-500/8"
      : active
        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
  return (
    <button onClick={onClick} className={`${base} ${style}`}>
      {icon}
      {label}
    </button>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvestigationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [investigation, setInvestigation] = useState<Investigation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTool, setActiveTool] = useState<ActiveTool>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNodeResponse | null>(null)
  const [localNodes, setLocalNodes] = useState<GraphNode[]>([])
  const [localEdges, setLocalEdges] = useState<GraphEdge[]>([])
  const [showAddNodeDialog, setShowAddNodeDialog] = useState(false)
  const [graphLayout, setGraphLayout] = useState<GraphLayout>("force")
  const [selectedEdge, setSelectedEdge] = useState<GraphEdgeResponse | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [edgeFromNode, setEdgeFromNode] = useState<GraphNodeResponse | null>(null)
  const [edgeToNode, setEdgeToNode] = useState<GraphNodeResponse | null>(null)
  const [editingNode, setEditingNode] = useState<GraphNodeResponse | null>(null)
  const [graphFilters, setGraphFilters] = useState<GraphFilters>({ relationshipTypes: [], nodeTypes: [], depth: 2, direction: 'both' })
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null)

  useEffect(() => {
    investigationsApi
      .get(id)
      .then(({ data }) => setInvestigation(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const { nodes: graphNodes, edges: graphEdges, rawNodes, availableRelTypes, availableNodeTypes, loading: graphLoading, error: graphError, refetch: refetchGraph } =
    useInvestigationGraph(id, graphFilters)

  const { viewState, updatePinnedPositions, toggleBookmark, setNote, updateLayout, flushSave, isBookmarked, getNoteForNode } =
    useViewState(investigation)

  useEffect(() => {
    const saved = investigation?.viewState?.graph?.layout
    if (saved) setGraphLayout(saved)
  }, [investigation])

  useEffect(() => { setLocalNodes(graphNodes) }, [graphNodes])
  useEffect(() => { setLocalEdges(graphEdges) }, [graphEdges])

  async function handleDeleteInvestigation() {
    try {
      await investigationsApi.remove(id)
      router.push("/")
    } catch (err) {
      console.error("Failed to delete investigation:", err)
    }
  }

  function resetEdgeState() {
    setEdgeFromNode(null)
    setEdgeToNode(null)
  }

  function applyGraphConfig(config: GraphConfig) {
    setGraphFilters((prev) => ({ ...prev, relationshipTypes: config.filters.relationshipTypes }))
    setGraphLayout(config.layout)
    setActiveConfigId(config.id)
  }

  function resetGraphView() {
    setGraphFilters((prev) => ({ ...prev, relationshipTypes: [], nodeTypes: [], direction: 'both' }))
    setGraphLayout("force")
    setActiveConfigId(null)
  }

  function handleFiltersChange(filters: GraphFilters) {
    setGraphFilters(filters)
    setActiveConfigId(null)
  }

  function handleLayoutChange(layout: "force" | "radial") {
    setGraphLayout(layout)
    setActiveConfigId(null)
  }

  function handleExitEdit() {
    updateLayout(graphLayout)
    flushSave()
    setIsEditing(false)
    setActiveTool(null)
    setEditingNode(null)
    resetEdgeState()
  }

  function toggleTool(tool: Exclude<ActiveTool, null>) {
    setActiveTool((prev) => {
      if (prev !== "edge" || tool !== "edge") resetEdgeState()
      return prev === tool ? null : tool
    })
  }

  function handleNodeClick(node: GraphNodeResponse) {
    if (activeTool === "delete") {
      handleDeleteNode(node.id)
      return
    }
    if (activeTool === "edge") {
      if (!edgeFromNode) {
        setEdgeFromNode(node)
      } else if (edgeFromNode.id === node.id) {
        setEdgeFromNode(null)
      } else {
        setEdgeToNode(node)
      }
      return
    }
    setSelectedEdge(null)
    if (isEditing) {
      setEditingNode((prev) => (prev?.id === node.id ? null : node))
    } else {
      setSelectedNode((prev) => (prev?.id === node.id ? null : node))
    }
  }

  async function handleCreateEdge(type: string) {
    if (!edgeFromNode || !edgeToNode) return
    try {
      const { data: newEdge } = await graphApi.createRelationship({
        fromId: edgeFromNode.id,
        toId: edgeToNode.id,
        type,
      })
      setLocalEdges((prev) => [...prev, toReagraphEdge(newEdge)])
    } catch (err) {
      console.error("Failed to create relationship:", err)
    } finally {
      resetEdgeState()
      setActiveTool(null)
      refetchGraph()
    }
  }

  async function handleDeleteNode(nodeId: string) {
    try {
      await graphApi.deleteNode(nodeId)
      setLocalNodes((prev) => prev.filter((n) => n.id !== nodeId))
      setLocalEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId))
      if (selectedNode?.id === nodeId) setSelectedNode(null)
    } catch (err) {
      console.error("Failed to delete node:", err)
    }
  }

  function handleEdgeClick(edge: GraphEdgeResponse) {
    setSelectedNode(null)
    setSelectedEdge((prev) => (prev?.id === edge.id ? null : edge))
  }

  function handleCanvasClick() {
    if (activeTool === "node") setShowAddNodeDialog(true)
  }

  async function handleSaveNodeProperties(nodeId: string, properties: Record<string, unknown>) {
    const { data: updated } = await graphApi.updateNode(nodeId, properties)
    setLocalNodes((prev) => prev.map((n) => n.id === nodeId ? { ...n, data: updated } : n))
    refetchGraph()
  }

  async function handleAddNode(label: string, type: TramaNodeType) {
    try {
      const { data: newNode } = await graphApi.createNode({ type, label })
      setLocalNodes((prev) => [...prev, toReagraphNode(newNode)])
      if (investigation) {
        await investigationsApi.addTarget(investigation.id, {
          nodeId: newNode.id,
          nodeLabel: newNode.label,
          nodeType: newNode.type,
        })
      }
    } catch (err) {
      console.error("Failed to create node:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm text-zinc-400">Loading...</span>
      </div>
    )
  }

  if (error || !investigation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-sm text-zinc-500">Investigation not found</p>
        <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-600 underline">
          Go back
        </Link>
      </div>
    )
  }

  const activeToolData = TOOLS.find((t) => t.id === activeTool)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5">
        <Link
          href="/"
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 shrink-0 transition-colors"
        >
          <ChevronLeftIcon />
          Investigations
        </Link>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 shrink-0" />

        <h1 className="flex-1 min-w-0 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {investigation.title}
        </h1>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[investigation.status]}`}>
            {STATUS_LABELS[investigation.status]}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
            <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[investigation.priority]}`} />
            {PRIORITY_LABELS[investigation.priority]}
          </span>
        </div>

        {/* Graph stats */}
        {!graphLoading && graphNodes.length > 0 && (
          <span className="hidden sm:inline text-xs text-zinc-400 shrink-0">
            {graphNodes.length} nodes · {graphEdges.length} edges
          </span>
        )}

        {/* Saved views */}
        {investigation && (
          <GraphConfigPanel
            investigationId={investigation.id}
            currentFilters={graphFilters}
            currentLayout={graphLayout}
            activeConfigId={activeConfigId}
            onApply={applyGraphConfig}
            onReset={resetGraphView}
          />
        )}

        {/* Relationship filter */}
        <GraphFilterToolbar
          filters={graphFilters}
          availableRelTypes={availableRelTypes}
          availableNodeTypes={availableNodeTypes}
          onChange={handleFiltersChange}
          loading={graphLoading}
        />

        {/* Layout toggle */}
        <div className="hidden sm:flex items-center rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0">
          <button
            onClick={() => handleLayoutChange("force")}
            title="Force layout"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors ${
              graphLayout === "force"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            <LayoutForceIcon />
            Force
          </button>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
          <button
            onClick={() => handleLayoutChange("radial")}
            title="Radial layout"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors ${
              graphLayout === "radial"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            <LayoutHierarchicalIcon />
            Radial
          </button>
        </div>

        {isEditing ? (
          <button
            onClick={handleExitEdit}
            className="flex items-center gap-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors shrink-0"
          >
            <CheckIcon />
            Done
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 rounded-md border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2Icon />
              Delete
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <PencilIcon />
              Edit
            </button>
          </div>
        )}
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Left panel — metadata / node detail */}
        {!isEditing && (
          <aside className="w-72 flex-shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {selectedEdge ? (
              <EdgeDetailPanel
                edge={selectedEdge}
                sourceNode={rawNodes.get(selectedEdge.source)}
                targetNode={rawNodes.get(selectedEdge.target)}
                onClose={() => setSelectedEdge(null)}
              />
            ) : selectedNode ? (
              <NodeDetailPanel
                node={selectedNode}
                isBookmarked={isBookmarked(selectedNode.id)}
                note={getNoteForNode(selectedNode.id)}
                onClose={() => setSelectedNode(null)}
                onToggleBookmark={() => toggleBookmark(selectedNode.id)}
                onNoteChange={(note) => setNote(selectedNode.id, note)}
              />
            ) : (
              <div className="flex flex-col gap-5 p-4 overflow-y-auto">
                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">Created</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">{formatDate(investigation.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">Updated</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">{formatDate(investigation.updatedAt)}</p>
                  </div>
                </div>

                {investigation.description && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Description</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{investigation.description}</p>
                  </div>
                )}

                {investigation.hypothesis && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Hypothesis</p>
                    <div className="rounded-md border-l-2 border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-500/5 pl-3 pr-2 py-2.5">
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed italic">
                        {investigation.hypothesis}
                      </p>
                    </div>
                  </div>
                )}

                {investigation.tags.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {investigation.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Targets{investigation?.targets && investigation.targets.length > 0 && (
                      <span className="font-normal normal-case ml-1">({investigation.targets.length})</span>
                    )}
                  </p>
                  {!investigation.targets?.length ? (
                    <p className="text-xs text-zinc-400">No targets defined</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {investigation.targets.map((target) => {
                        const node = rawNodes.get(target.nodeId)
                        return (
                          <button
                            key={target.nodeId}
                            onClick={() => node && setSelectedNode(node)}
                            disabled={!node}
                            title={node ? "Ver nodo" : "Nodo no visible con el depth actual"}
                            className="flex items-center gap-2 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 text-left transition-colors hover:border-zinc-400 dark:hover:border-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold shrink-0 ${NODE_TYPE_STYLES[target.nodeType] ?? "bg-zinc-100 text-zinc-500"}`}>
                              {target.nodeType}
                            </span>
                            <span className="text-xs truncate text-zinc-700 dark:text-zinc-300">
                              {target.nodeLabel}
                            </span>
                            {node && (
                              <span className="ml-auto shrink-0 text-[10px] text-zinc-400">→</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Graph error */}
                {graphError && (
                  <div className="rounded-md bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 px-3 py-2">
                    <p className="text-xs text-red-600 dark:text-red-400">Graph error: {graphError}</p>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}

        {/* Graph canvas */}
        <div className="relative flex-1 min-w-0">
          {graphLoading ? (
            <div className="flex flex-1 h-full items-center justify-center">
              <span className="text-sm text-zinc-400">Loading graph…</span>
            </div>
          ) : (
            <TramaGraph
              nodes={localNodes}
              edges={localEdges}
              readonly={!isEditing}
              selectedNodeId={activeTool === "edge" ? edgeFromNode?.id : isEditing ? editingNode?.id : selectedNode?.id}
              layout={graphLayout}
              initialPinnedPositions={viewState.graph?.pinnedPositions}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onPositionsChange={updatePinnedPositions}
              onCanvasClick={isEditing ? handleCanvasClick : undefined}
            />
          )}

          {isEditing && editingNode && !activeTool && (
            <EditNodePanel
              node={editingNode}
              investigationId={id}
              onClose={() => setEditingNode(null)}
              onSave={handleSaveNodeProperties}
            />
          )}

          <AddNodeDialog
            open={showAddNodeDialog}
            onClose={() => { setShowAddNodeDialog(false); setActiveTool(null); }}
            onAdd={handleAddNode}
          />

          {edgeFromNode && edgeToNode && (
            <AddEdgeDialog
              fromNode={edgeFromNode}
              toNode={edgeToNode}
              onClose={resetEdgeState}
              onAdd={handleCreateEdge}
            />
          )}

          {isEditing && activeToolData && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-4 py-2 shadow-sm pointer-events-none">
              <span className="text-zinc-500 dark:text-zinc-400">{activeToolData.icon}</span>
              <span className="text-xs text-zinc-600 dark:text-zinc-300">
                {activeTool === "edge"
                  ? edgeFromNode
                    ? `"${edgeFromNode.label}" selected — now click the target node`
                    : "Step 1: Click the source node"
                  : activeToolData.hint}
              </span>
            </div>
          )}
        </div>

        {/* Tools panel — edit mode only */}
        {isEditing && (
          <aside className="flex w-40 flex-shrink-0 flex-col border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
            <div className="flex-1 p-2">
              <p className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                Add
              </p>
              <div className="flex flex-col gap-0.5">
                {TOOLS.filter((t) => t.id !== "delete").map((tool) => (
                  <ToolButton
                    key={tool.id}
                    icon={tool.icon}
                    label={tool.label}
                    active={activeTool === tool.id}
                    onClick={() => toggleTool(tool.id)}
                  />
                ))}
              </div>
            </div>
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-2">
              <ToolButton
                icon={<Trash2Icon />}
                label="Delete Node"
                active={activeTool === "delete"}
                onClick={() => toggleTool("delete")}
                variant="destructive"
              />
            </div>
          </aside>
        )}
      </div>

      {/* Delete investigation confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative z-10 w-80 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Delete investigation?</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
              This will permanently delete <span className="font-medium text-zinc-700 dark:text-zinc-300">{investigation.title}</span> and all its data. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteInvestigation}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Delete investigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
