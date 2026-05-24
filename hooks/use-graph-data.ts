'use client'

import { useEffect, useMemo, useState } from 'react'
import type { GraphNode, GraphEdge } from 'reagraph'
import { graphApi } from '@/lib/api/graph'
import { toReagraphNode, toReagraphEdge } from '@/lib/graph/adapters'
import type { GraphNodeResponse } from '@/lib/graph/types'

interface UseGraphDataResult {
  nodes: GraphNode[]
  edges: GraphEdge[]
  rawNodes: Map<string, GraphNodeResponse>
  loading: boolean
  error: string | null
}

export function useGraphData(targetNodeIds: string[]): UseGraphDataResult {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [rawNodes, setRawNodes] = useState<Map<string, GraphNodeResponse>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const key = targetNodeIds.join(',')

  useEffect(() => {
    if (!targetNodeIds.length) return

    setLoading(true)
    setError(null)

    Promise.all(
      targetNodeIds.flatMap((id) => [graphApi.getNode(id), graphApi.getNeighbors(id, 2)]),
    )
      .then((results) => {
        const nodeMap = new Map<string, GraphNodeResponse>()
        const edgeMap = new Map<string, GraphEdge>()

        for (let i = 0; i < results.length; i += 2) {
          const { data: rootNode } = results[i] as { data: GraphNodeResponse }
          const { data: neighbors } = results[i + 1] as { data: NeighborResultRaw[] }

          nodeMap.set(rootNode.id, rootNode)

          for (const { neighbor, edge } of neighbors) {
            nodeMap.set(neighbor.id, neighbor)
            const reagraphEdge = toReagraphEdge(edge)
            edgeMap.set(reagraphEdge.id, reagraphEdge)
          }
        }

        setRawNodes(nodeMap)
        setNodes([...nodeMap.values()].map(toReagraphNode))
        setEdges([...edgeMap.values()])
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return useMemo(
    () => ({ nodes, edges, rawNodes, loading, error }),
    [nodes, edges, rawNodes, loading, error],
  )
}

// Internal type matching the backend NeighborResult shape
interface NeighborResultRaw {
  neighbor: GraphNodeResponse
  edge: import('@/lib/graph/types').GraphEdgeResponse
}
