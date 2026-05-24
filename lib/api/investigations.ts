import { api } from "./client"
import type {
  Investigation,
  CreateInvestigationBody,
  UpdateInvestigationBody,
  AddTargetBody,
} from "@/types/investigation"

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
}
