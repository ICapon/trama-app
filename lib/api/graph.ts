import { api } from "./client"
import type { GraphNodeResponse, GraphEdgeResponse, TramaNodeCategory, NeighborResult } from "../graph/types"

const PREFIX = process.env.NEXT_PUBLIC_API_URL ? "" : "/api"
const BASE = `${PREFIX}/graph`

export type CreateNodeBody = {
  type: string
  category: TramaNodeCategory
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
  createNode(body: CreateNodeBody) {
    return api.post<GraphNodeResponse>(`${BASE}/node`, body)
  },
}

export type { GraphNodeResponse, GraphEdgeResponse }
