import { api } from "./client"
import type { GraphNodeResponse, GraphEdgeResponse, TramaNodeType, NeighborResult } from "../graph/types"
import type { SocialAnalysis } from "@/types/social-analysis"

const PREFIX = process.env.NEXT_PUBLIC_API_URL ? "" : "/api"
const BASE = `${PREFIX}/graph`

export type CreateNodeBody = {
  type: TramaNodeType
  label: string
  properties?: Record<string, unknown>
}

export const graphApi = {
  getNode(id: string) {
    return api.get<GraphNodeResponse>(`${BASE}/node/${id}`)
  },
  getNeighbors(id: string, depth = 2) {
    return api.get<NeighborResult[]>(`${BASE}/node/${id}/neighbors`, {
      params: { depth },
    })
  },
  createNode({ label, properties, ...rest }: CreateNodeBody) {
    return api.post<GraphNodeResponse>(`${BASE}/node`, {
      ...rest,
      properties: { name: label, ...properties },
    })
  },
  updateNode(id: string, properties: Record<string, unknown>) {
    return api.patch<GraphNodeResponse>(`${BASE}/node/${id}`, { properties })
  },
  deleteNode(id: string) {
    return api.delete(`${BASE}/node/${id}`)
  },
  createRelationship(body: { fromId: string; toId: string; type: string; properties?: Record<string, unknown> }) {
    return api.post<GraphEdgeResponse>(`${BASE}/relationship`, body)
  },
  getSocialAnalysis(id: string) {
    return api.get<SocialAnalysis>(`${BASE}/node/${id}/social-analysis`)
  },
}

export type { GraphNodeResponse, GraphEdgeResponse }
