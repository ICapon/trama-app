import type { GraphNode, GraphEdge } from 'reagraph'
import type { GraphNodeResponse, GraphEdgeResponse } from './types'
import { CATEGORY_COLORS, DEFAULT_COLOR } from './colors'
import { CATEGORY_ICONS } from './node-icons'

function proxiedUrl(url: string): string {
  if (url.startsWith("/")) return url
  return `/api/uploads/proxy?url=${encodeURIComponent(url)}`
}

export function toReagraphNode(node: GraphNodeResponse): GraphNode {
  const uploadUrl = typeof node.properties?.uploadUrl === "string" ? node.properties.uploadUrl : undefined
  return {
    id: node.id,
    label: node.label,
    fill: CATEGORY_COLORS[node.category] ?? DEFAULT_COLOR,
    icon: uploadUrl ? proxiedUrl(uploadUrl) : CATEGORY_ICONS[node.category],
    data: node,
  }
}

export function toReagraphEdge(edge: GraphEdgeResponse): GraphEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label ?? edge.type.toLowerCase().replace(/_/g, " "),
    data: edge,
  }
}
