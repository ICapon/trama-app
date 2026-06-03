import { api } from "./client"
import type {
  Investigation,
  CreateInvestigationBody,
  UpdateInvestigationBody,
  AddTargetBody,
  InvestigationViewState,
} from "@/types/investigation"
import type { GraphNodeResponse, GraphEdgeResponse } from "@/lib/graph/types"

export interface InvestigationGraphResponse {
  nodes: GraphNodeResponse[]
  edges: GraphEdgeResponse[]
}

// When NEXT_PUBLIC_API_URL is set (external backend), prefix defaults to ""
// When using Next.js mock routes locally, prefix is "/api"
const PREFIX = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_PREFIX ?? "")
  : "/api"
const BASE = `${PREFIX}/investigations`

export const investigationsApi = {
  list: (params?: { ownerId?: string }) =>
    api.get<Investigation[]>(BASE, { params }),

  get: (id: string) =>
    api.get<Investigation>(`${BASE}/${id}`),

  create: (body: CreateInvestigationBody) =>
    api.post<Investigation>(BASE, body),

  update: (id: string, body: UpdateInvestigationBody) =>
    api.put<Investigation>(`${BASE}/${id}`, body),

  remove: (id: string) =>
    api.delete<void>(`${BASE}/${id}`),

  addTarget: (id: string, target: AddTargetBody) =>
    api.post<void>(`${BASE}/${id}/targets`, target),

  removeTarget: (id: string, nodeId: string) =>
    api.delete<void>(`${BASE}/${id}/targets/${nodeId}`),

  patchViewState: (id: string, viewState: InvestigationViewState) =>
    api.patch<void>(`${BASE}/${id}/view-state`, viewState),

  getGraph: (id: string, filters?: { relTypes?: string[]; depth?: number; direction?: string }) =>
    api.get<InvestigationGraphResponse>(`${BASE}/${id}/graph`, {
      params: {
        ...(filters?.relTypes?.length                    ? { relTypes:   filters.relTypes.join(',') } : {}),
        ...(filters?.depth && filters.depth !== 1        ? { depth:      filters.depth              } : {}),
        ...(filters?.direction && filters.direction !== 'both' ? { direction: filters.direction     } : {}),
      },
    }),
}
