import type { GraphNode, GraphEdge } from 'reagraph'
import type { GraphNodeResponse, GraphEdgeResponse } from './types'
import { CATEGORY_COLORS, DEFAULT_COLOR } from './colors'

export function toReagraphNode(node: GraphNodeResponse): GraphNode {
  return {
    id: node.id,
    label: node.label,
    fill: CATEGORY_COLORS[node.category] ?? DEFAULT_COLOR,
    data: node,
  }
}

export function toReagraphEdge(edge: GraphEdgeResponse): GraphEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
  }
}
