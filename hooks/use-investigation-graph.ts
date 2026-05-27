'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GraphNode, GraphEdge } from 'reagraph'
import { investigationsApi } from '@/lib/api/investigations'
import { toReagraphNode, toReagraphEdge } from '@/lib/graph/adapters'
import type { GraphNodeResponse } from '@/lib/graph/types'

interface UseInvestigationGraphResult {
  nodes: GraphNode[]
  edges: GraphEdge[]
  rawNodes: Map<string, GraphNodeResponse>
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useInvestigationGraph(investigationId: string | null): UseInvestigationGraphResult {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [rawNodes, setRawNodes] = useState<Map<string, GraphNodeResponse>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!investigationId) return

    setLoading(true)
    setError(null)

    investigationsApi
      .getGraph(investigationId)
      .then(({ data }) => {
        const nodeMap = new Map(data.nodes.map((n) => [n.id, n]))
        setRawNodes(nodeMap)
        setNodes(data.nodes.map(toReagraphNode))
        setEdges(data.edges.map(toReagraphEdge))
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [investigationId, tick])

  return useMemo(
    () => ({ nodes, edges, rawNodes, loading, error, refetch }),
    [nodes, edges, rawNodes, loading, error, refetch],
  )
}
