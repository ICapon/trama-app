'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GraphNode, GraphEdge } from 'reagraph'
import { investigationsApi } from '@/lib/api/investigations'
import { toReagraphNode, toReagraphEdge } from '@/lib/graph/adapters'
import type { GraphNodeResponse, GraphEdgeResponse } from '@/lib/graph/types'

export type RelDirection = 'both' | 'outgoing' | 'incoming'

export interface GraphFilters {
  /** Only show edges of these relationship types. Empty = show all. */
  relationshipTypes: string[]
  /** Only show nodes of these types. Empty = show all. */
  nodeTypes: string[]
  /** How many hops to expand from root nodes. 1–3. Default: 1. */
  depth: number
  /** Direction to traverse from root nodes. Default: 'both'. */
  direction: RelDirection
}

interface UseInvestigationGraphResult {
  nodes: GraphNode[]
  edges: GraphEdge[]
  rawNodes: Map<string, GraphNodeResponse>
  /** All unique relationship types present in the full (unfiltered) graph. */
  availableRelTypes: string[]
  /** All unique node types present in the full (unfiltered) graph. */
  availableNodeTypes: string[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useInvestigationGraph(
  investigationId: string | null,
  filters?: GraphFilters,
): UseInvestigationGraphResult {
  const [rawNodesList, setRawNodesList] = useState<GraphNodeResponse[]>([])
  const [rawEdgesList, setRawEdgesList] = useState<GraphEdgeResponse[]>([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [tick, setTick]                 = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!investigationId) return

    setLoading(true)
    setError(null)

    investigationsApi
      .getGraph(investigationId, { relTypes: filters?.relationshipTypes, depth: filters?.depth, direction: filters?.direction })
      .then(({ data }) => {
        setRawNodesList(data.nodes)
        setRawEdgesList(data.edges)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [investigationId, tick, filters?.depth, filters?.direction])

  const availableRelTypes = useMemo(() => {
    const types = new Set<string>()
    rawEdgesList.forEach((e) => { if (e.type) types.add(e.type) })
    return [...types].sort()
  }, [rawEdgesList])

  const availableNodeTypes = useMemo(() => {
    const types = new Set<string>()
    rawNodesList.forEach((n) => { if (n.type) types.add(n.type) })
    return [...types].sort()
  }, [rawNodesList])

  const activeRelTypes  = filters?.relationshipTypes ?? []
  const activeNodeTypes = filters?.nodeTypes ?? []

  const filteredEdges = useMemo<GraphEdgeResponse[]>(() => {
    if (!activeRelTypes.length) return rawEdgesList
    return rawEdgesList.filter((e) => activeRelTypes.includes(e.type))
  }, [rawEdgesList, activeRelTypes])

  // Nodes visible after applying both node-type and rel-type filters
  const visibleNodeIds = useMemo(() => {
    const byRel = activeRelTypes.length
      ? new Set(filteredEdges.flatMap((e) => [e.source, e.target]))
      : null

    if (!activeNodeTypes.length && !byRel) return null // show all

    return new Set(
      rawNodesList
        .filter((n) => {
          const passesType = !activeNodeTypes.length || activeNodeTypes.includes(n.type)
          const passesRel  = !byRel || byRel.has(n.id)
          return passesType && passesRel
        })
        .map((n) => n.id),
    )
  }, [filteredEdges, activeRelTypes, activeNodeTypes, rawNodesList])

  const nodes = useMemo<GraphNode[]>(() => {
    const list = visibleNodeIds
      ? rawNodesList.filter((n) => visibleNodeIds.has(n.id))
      : rawNodesList
    return list.map(toReagraphNode)
  }, [rawNodesList, visibleNodeIds])

  const edges = useMemo<GraphEdge[]>(
    () => filteredEdges.map(toReagraphEdge),
    [filteredEdges],
  )

  const rawNodes = useMemo(
    () => new Map(rawNodesList.map((n) => [n.id, n])),
    [rawNodesList],
  )

  return useMemo(
    () => ({ nodes, edges, rawNodes, availableRelTypes, availableNodeTypes, loading, error, refetch }),
    [nodes, edges, rawNodes, availableRelTypes, availableNodeTypes, loading, error, refetch],
  )
}
