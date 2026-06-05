"use client"

import { use, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { GraphNode, GraphEdge } from "reagraph"
import { investigationsApi } from "@/lib/api/investigations"
import { TramaGraph } from "@/components/graph/graph-canvas"
import type { GraphLayout, TramaGraphRef } from "@/components/graph/graph-canvas"
import { NodeDetailPanel } from "@/components/graph/node-detail-panel"
import { EdgeDetailPanel } from "@/components/graph/edge-detail-panel"
import { AddNodeDialog } from "@/components/graph/add-node-dialog"
import { AddEdgeDialog } from "@/components/graph/add-edge-dialog"
import { EditNodePanel } from "@/components/graph/edit-node-panel"
import { LinkNodeDialog, type LinkNodeResult } from "@/components/graph/link-node-dialog"
import { useInvestigationGraph, type GraphFilters } from "@/hooks/use-investigation-graph"
import { GraphFilterToolbar } from "@/components/graph/graph-filter-toolbar"
import { GraphConfigPanel } from "@/components/graph/graph-config-panel"
import type { GraphConfig } from "@/types/graph-config"
import { useViewState } from "@/hooks/use-view-state"
import { toReagraphNode, toReagraphEdge } from "@/lib/graph/adapters"
import { graphApi } from "@/lib/api/graph"
import type { Investigation, InvestigationStatus, InvestigationPriority } from "@/types/investigation"
import type { GraphEdgeResponse, GraphNodeResponse, TramaNodeType } from "@/lib/graph/types"
import type { TramaExportBundle } from "@/types/export-bundle"

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

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
    </svg>
  )
}

function SelectionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3h4v4H3zM17 3h4v4h-4zM3 17h4v4H3zM17 17h4v4h-4z" /><path d="M7 5h10M5 7v10M7 19h10M19 7v10" strokeDasharray="2 2"/>
    </svg>
  )
}

// ─── Tool panel ───────────────────────────────────────────────────────────────

type ActiveTool = "node" | "edge" | "delete" | "select" | null

const TOOLS = [
  { id: "node"   as const, icon: <PlusCircleIcon />,  label: "Node",     hint: "Click on the canvas to add a node" },
  { id: "edge"   as const, icon: <ArrowsIcon />,      label: "Relation", hint: "Connect two existing nodes" },
  { id: "select" as const, icon: <SelectionIcon />,   label: "Select",   hint: "Drag to select multiple nodes, then drag any selected node to move all" },
  { id: "delete" as const, icon: <Trash2Icon />,      label: "Delete Node", hint: "Click a node to delete it" },
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
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState("")
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [activeTool, setActiveTool] = useState<ActiveTool>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNodeResponse | null>(null)
  const [localNodes, setLocalNodes] = useState<GraphNode[]>([])
  const [localEdges, setLocalEdges] = useState<GraphEdge[]>([])
  const [showAddNodeDialog, setShowAddNodeDialog] = useState(false)
  const [pendingClickPosition, setPendingClickPosition] = useState<{ x: number; y: number; z: number } | null>(null)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [showLinkNodeDialog, setShowLinkNodeDialog] = useState(false)
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
  const [nodeSearch, setNodeSearch] = useState("")
  const [focusNodeId, setFocusNodeId] = useState<string | undefined>()
  const actionsMenuRef = useRef<HTMLDivElement>(null)
  const tramaGraphRef = useRef<TramaGraphRef>(null)

  useEffect(() => {
    if (!showActionsMenu) return
    function handleClickOutside(e: MouseEvent) {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setShowActionsMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showActionsMenu])
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

  const knownNodeIdsRef = useRef<Set<string>>(new Set())
  const initialLoadDoneRef = useRef(false)

  useEffect(() => {
    if (!graphNodes.length) return

    if (!initialLoadDoneRef.current) {
      // First load — just sync, no positioning needed
      initialLoadDoneRef.current = true
      knownNodeIdsRef.current = new Set(graphNodes.map((n) => n.id))
      setLocalNodes(graphNodes)
      return
    }

    const newNodes = graphNodes.filter((n) => !knownNodeIdsRef.current.has(n.id))
    knownNodeIdsRef.current = new Set(graphNodes.map((n) => n.id))

    if (newNodes.length === 0) {
      setLocalNodes(graphNodes)
      return
    }

    // Get root position from the first investigation target
    const rootId = investigation?.targets?.[0]?.nodeId
    const rootPos = rootId ? (tramaGraphRef.current?.getNodePosition(rootId) ?? null) : null
    const cx = rootPos?.x ?? 0
    const cy = rootPos?.y ?? 0
    const cz = rootPos?.z ?? 0

    // Distribute new nodes in concentric rings around root
    const INNER_RADIUS = 150
    const OUTER_RADIUS = 280
    const MAX_INNER = 8
    const newNodeIdSet = new Set(newNodes.map((n) => n.id))

    const positionedNew = newNodes.map((node, i) => {
      const ring = i < MAX_INNER ? 0 : 1
      const countInRing = ring === 0 ? Math.min(newNodes.length, MAX_INNER) : newNodes.length - MAX_INNER
      const indexInRing = ring === 0 ? i : i - MAX_INNER
      const radius = ring === 0 ? INNER_RADIUS : OUTER_RADIUS
      const angle = (2 * Math.PI * indexInRing) / countInRing
      return {
        ...node,
        fx: cx + radius * Math.cos(angle),
        fy: cy + radius * Math.sin(angle),
        fz: cz,
      }
    })

    setLocalNodes([
      ...graphNodes.filter((n) => !newNodeIdSet.has(n.id)),
      ...positionedNew,
    ])
  }, [graphNodes])
  useEffect(() => { setLocalEdges(graphEdges) }, [graphEdges])

  const searchResults = useMemo(() => {
    const q = nodeSearch.trim().toLowerCase()
    if (!q) return []
    return [...rawNodes.values()].filter(
      (n) => n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)
    )
  }, [nodeSearch, rawNodes])

  function startEditingTitle() {
    if (!investigation) return
    setTitleDraft(investigation.title)
    setIsEditingTitle(true)
    setTimeout(() => titleInputRef.current?.select(), 0)
  }

  async function handleSaveTitle() {
    const trimmed = titleDraft.trim()
    if (!trimmed || trimmed === investigation?.title) {
      setIsEditingTitle(false)
      return
    }
    try {
      const { data: updated } = await investigationsApi.update(id, { title: trimmed })
      setInvestigation(updated)
    } catch (err) {
      console.error("Failed to update title:", err)
    } finally {
      setIsEditingTitle(false)
    }
  }

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
    setSelectedNodeIds([])
    resetEdgeState()
  }

  function toggleTool(tool: Exclude<ActiveTool, null>) {
    setSelectedEdge(null)
    if (tool !== "select") setSelectedNodeIds([])
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
    setSelectedNodeIds([])
    if (isEditing) {
      setEditingNode((prev) => (prev?.id === node.id ? null : node))
    } else {
      setSelectedNode((prev) => (prev?.id === node.id ? null : node))
      setFocusNodeId(node.id)
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

  function handleExport() {
    if (!investigation) return
    const bundle: TramaExportBundle = {
      version: "1",
      exportedAt: new Date().toISOString(),
      investigation: {
        title: investigation.title,
        description: investigation.description ?? null,
        status: investigation.status,
        priority: investigation.priority,
        hypothesis: investigation.hypothesis ?? null,
        tags: investigation.tags ?? [],
        viewState: viewState ?? null,
        targets: (investigation.targets ?? []).map((t) => ({ nodeId: t.nodeId, nodeLabel: t.nodeLabel, nodeType: t.nodeType })),
      },
      graph: {
        nodes: localNodes.map((n) => {
          const data = (n as any).data
          return { id: n.id, type: data?.type ?? "", label: n.label ?? "", properties: data?.properties ?? {} }
        }),
        edges: localEdges.map((e) => {
          const data = (e as any).data
          return { source: e.source, target: e.target, type: data?.type ?? "", properties: data?.properties }
        }),
      },
    }
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${investigation.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.trama.json`
    a.click()
    URL.revokeObjectURL(url)
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
    if (activeTool === "delete") {
      handleDeleteEdge(edge.id)
      return
    }
    setSelectedNode(null)
    setEditingNode(null)
    setSelectedEdge((prev) => (prev?.id === edge.id ? null : edge))
  }

  async function handleDeleteEdge(edgeId: string) {
    try {
      await graphApi.deleteRelationship(edgeId)
      setLocalEdges((prev) => prev.filter((e) => e.id !== edgeId))
      if (selectedEdge?.id === edgeId) setSelectedEdge(null)
    } catch (err) {
      console.error("Failed to delete relationship:", err)
    }
  }

  function handleCanvasClick(pos: { x: number; y: number; z: number }) {
    setSelectedNodeIds([])
    if (activeTool === "node") {
      setPendingClickPosition(pos)
      setShowAddNodeDialog(true)
    }
  }

  async function handleLinkNode(result: LinkNodeResult) {
    if (!editingNode) return
    const res = await fetch(`/api/graph/node/${editingNode.id}/linked-node`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    })
    if (!res.ok) throw new Error(`Failed to create linked node: ${res.status}`)
    const { node: newNode, edge: newEdge } = await res.json()
    const reagraphNode = toReagraphNode(newNode)
    const anchorPos = tramaGraphRef.current?.getNodePosition(editingNode.id)
    if (anchorPos) {
      reagraphNode.fx = anchorPos.x + 80
      reagraphNode.fy = anchorPos.y + 80
      reagraphNode.fz = anchorPos.z
    }
    setLocalNodes((prev) => [...prev, reagraphNode])
    setLocalEdges((prev) => [...prev, toReagraphEdge(newEdge)])
  }

  async function handleSaveNodeProperties(nodeId: string, properties: Record<string, unknown>) {
    const { data: updated } = await graphApi.updateNode(nodeId, properties)
    setLocalNodes((prev) => prev.map((n) => n.id === nodeId ? { ...n, data: updated } : n))
    refetchGraph()
  }

  async function handleAddNode(label: string, type: TramaNodeType) {
    try {
      const { data: newNode } = await graphApi.createNode({ type, label })
      const reagraphNode = toReagraphNode(newNode)
      if (pendingClickPosition) {
        reagraphNode.fx = pendingClickPosition.x
        reagraphNode.fy = pendingClickPosition.y
        reagraphNode.fz = pendingClickPosition.z
        setPendingClickPosition(null)
      }
      setLocalNodes((prev) => [...prev, reagraphNode])
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
      <header className="flex flex-shrink-0 flex-col border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Link
          href="/"
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 shrink-0 transition-colors"
        >
          <ChevronLeftIcon />
          Investigations
        </Link>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 shrink-0" />

        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.currentTarget.blur() }
              if (e.key === "Escape") { setIsEditingTitle(false) }
            }}
            className="flex-1 min-w-0 text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-zinc-400 dark:border-zinc-500 focus:outline-none focus:border-zinc-700 dark:focus:border-zinc-300 px-0.5"
          />
        ) : (
          <button
            onClick={startEditingTitle}
            title="Edit title"
            className="flex-1 min-w-0 text-left group flex items-center gap-1.5"
          >
            <h1 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {investigation.title}
            </h1>
            <span className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 dark:text-zinc-500">
              <PencilIcon />
            </span>
          </button>
        )}

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

        {isEditing ? (
          <button
            onClick={handleExitEdit}
            className="flex items-center gap-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors shrink-0"
          >
            <CheckIcon />
            Done
          </button>
        ) : (
          <div ref={actionsMenuRef} className="relative shrink-0">
            <button
              onClick={() => setShowActionsMenu((v) => !v)}
              className="flex items-center justify-center w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              title="Actions"
            >
              <DotsIcon />
            </button>

            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg py-1 overflow-hidden">
                <button
                  onClick={() => { setIsEditing(true); setShowActionsMenu(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <PencilIcon />
                  Edit graph
                </button>
                <button
                  onClick={() => { handleExport(); setShowActionsMenu(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <DownloadIcon />
                  Export
                </button>
                <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                <button
                  onClick={() => { setShowDeleteConfirm(true); setShowActionsMenu(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2Icon />
                  Delete investigation
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Second row: filters + layout ──────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
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
        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 shrink-0" />
        <GraphFilterToolbar
          filters={graphFilters}
          availableRelTypes={availableRelTypes}
          availableNodeTypes={availableNodeTypes}
          onChange={handleFiltersChange}
          loading={graphLoading}
        />
        <div className="ml-auto flex items-center rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0">
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
      </div>

      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Left panel — metadata / node detail */}
        {!isEditing && (
          <aside className="w-72 flex-shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 overflow-hidden">

            {/* Search bar */}
            <div className="flex-shrink-0 px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-zinc-400 pointer-events-none">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  value={nodeSearch}
                  onChange={(e) => { setNodeSearch(e.target.value); setSelectedNode(null); setSelectedEdge(null) }}
                  placeholder="Search nodes…"
                  className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 pl-7 pr-7 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-colors"
                />
                {nodeSearch && (
                  <button
                    onClick={() => setNodeSearch("")}
                    className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Search results */}
            {nodeSearch.trim() ? (
              <div className="flex flex-col flex-1 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="px-4 py-6 text-xs text-zinc-400 text-center">No nodes found</p>
                ) : (
                  <div className="flex flex-col gap-1 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                    </p>
                    {searchResults.map((node) => (
                      <button
                        key={node.id}
                        onClick={() => { setSelectedNode(node); setFocusNodeId(node.id); setNodeSearch("") }}
                        className="flex items-center gap-2 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 text-left transition-colors hover:border-zinc-400 dark:hover:border-zinc-600"
                      >
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold shrink-0 ${NODE_TYPE_STYLES[node.type] ?? "bg-zinc-100 text-zinc-500"}`}>
                          {node.type}
                        </span>
                        <span className="text-xs truncate text-zinc-700 dark:text-zinc-300">
                          {node.label}
                        </span>
                        <span className="ml-auto shrink-0 text-[10px] text-zinc-400">→</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : selectedEdge ? (
              <EdgeDetailPanel
                edge={selectedEdge}
                sourceNode={rawNodes.get(selectedEdge.source)}
                targetNode={rawNodes.get(selectedEdge.target)}
                onClose={() => setSelectedEdge(null)}
                onNodeClick={(node) => { setSelectedEdge(null); setSelectedNode(node) }}
              />
            ) : selectedNode ? (
              <NodeDetailPanel
                node={selectedNode}
                isBookmarked={isBookmarked(selectedNode.id)}
                note={getNoteForNode(selectedNode.id)}
                onClose={() => setSelectedNode(null)}
                onToggleBookmark={() => toggleBookmark(selectedNode.id)}
                onNoteChange={(note) => setNote(selectedNode.id, note)}
                connectedEdges={localEdges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)}
                rawNodes={rawNodes}
                onEdgeClick={(edge) => { setSelectedNode(null); setSelectedEdge(edge) }}
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
                            onClick={() => { if (node) { setSelectedNode(node); setFocusNodeId(node.id) } }}
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
              ref={tramaGraphRef}
              nodes={localNodes}
              edges={localEdges}
              readonly={!isEditing}
              selectedNodeId={activeTool === "edge" ? edgeFromNode?.id : isEditing ? editingNode?.id : selectedNode?.id}
              layout={graphLayout}
              initialPinnedPositions={viewState.graph?.pinnedPositions}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onPositionsChange={updatePinnedPositions}
              onCanvasClick={isEditing && activeTool !== "select" ? handleCanvasClick : () => { setSelectedNodeIds([]); setSelectedNode(null); setSelectedEdge(null) }}
              focusNodeId={focusNodeId}
              lassoActive={isEditing && activeTool === "select"}
              selectedNodeIds={selectedNodeIds}
              onLassoEnd={setSelectedNodeIds}
            />
          )}

          {isEditing && editingNode && !activeTool && (
            <EditNodePanel
              node={editingNode}
              investigationId={id}
              onClose={() => setEditingNode(null)}
              onSave={handleSaveNodeProperties}
              onLinkNode={() => setShowLinkNodeDialog(true)}
              onJobComplete={refetchGraph}
            />
          )}

          {showLinkNodeDialog && editingNode && (
            <LinkNodeDialog
              anchorNode={editingNode}
              onClose={() => setShowLinkNodeDialog(false)}
              onAdd={handleLinkNode}
            />
          )}

          {isEditing && selectedEdge && !activeTool && (
            <div className="absolute left-4 top-4 z-20 w-72 flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl max-h-[calc(100%-2rem)] overflow-hidden">
              <EdgeDetailPanel
                edge={selectedEdge}
                sourceNode={rawNodes.get(selectedEdge.source)}
                targetNode={rawNodes.get(selectedEdge.target)}
                onClose={() => setSelectedEdge(null)}
                onNodeClick={(node) => { setSelectedEdge(null); setEditingNode(node) }}
                onDelete={() => handleDeleteEdge(selectedEdge.id)}
              />
            </div>
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
                  : activeTool === "select" && selectedNodeIds.length > 0
                    ? `${selectedNodeIds.length} nodes selected — drag any to move all`
                    : activeToolData.hint}
              </span>
            </div>
          )}
        </div>

        {/* Tools panel — edit mode only */}
        {isEditing && (
          <aside className="flex w-52 flex-shrink-0 flex-col border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
            <div className="flex-1 p-2">
              <p className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                Tools
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
