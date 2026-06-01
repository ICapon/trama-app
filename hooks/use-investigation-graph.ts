'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GraphNode, GraphEdge } from 'reagraph'
import { investigationsApi } from '@/lib/api/investigations'
import { toReagraphNode, toReagraphEdge } from '@/lib/graph/adapters'
import type { GraphNodeResponse, GraphEdgeResponse } from '@/lib/graph/types'

export interface GraphFilters {
  /** Only show edges of these relationship types. Empty = show all. */
  relationshipTypes: string[]
  // Extensible: add nodeTypes, dateRange, confidence, etc. here
}

interface UseInvestigationGraphResult {
  nodes: GraphNode[]
  edges: GraphEdge[]
  rawNodes: Map<string, GraphNodeResponse>
  /** All unique relationship types present in the full (unfiltered) graph. */
  availableRelTypes: string[]
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
      .getGraph(investigationId)
      .then(({ data }) => {
        setRawNodesList(data.nodes)
        setRawEdgesList(data.edges)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [investigationId, tick])

  const availableRelTypes = useMemo(() => {
    const types = new Set<string>()
    rawEdgesList.forEach((e) => { if (e.type) types.add(e.type) })
    return [...types].sort()
  }, [rawEdgesList])

  const activeRelTypes = filters?.relationshipTypes ?? []

  const filteredEdges = useMemo<GraphEdgeResponse[]>(() => {
    if (!activeRelTypes.length) return rawEdgesList
    return rawEdgesList.filter((e) => activeRelTypes.includes(e.type))
  }, [rawEdgesList, activeRelTypes])

  // When a filter is active, also hide nodes that have no visible edges
  // (but the caller may further override localNodes if needed)
  const visibleNodeIds = useMemo(() => {
    if (!activeRelTypes.length) return null // null = show all
    const ids = new Set<string>()
    filteredEdges.forEach((e) => { ids.add(e.source); ids.add(e.target) })
    return ids
  }, [filteredEdges, activeRelTypes])

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
    () => ({ nodes, edges, rawNodes, availableRelTypes, loading, error, refetch }),
    [nodes, edges, rawNodes, availableRelTypes, loading, error, refetch],
  )
}
