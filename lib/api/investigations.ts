import { api } from "./client"
import type {
  Investigation,
  CreateInvestigationBody,
  UpdateInvestigationBody,
  AddTargetBody,
} from "@/types/investigation"

const BASE = "/api/investigations"

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
