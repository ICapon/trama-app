import { api } from "./client"
import type { GraphConfig, CreateGraphConfigBody, UpdateGraphConfigBody } from "@/types/graph-config"

const PREFIX = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_PREFIX ?? "")
  : "/api"

function base(investigationId: string) {
  return `${PREFIX}/investigations/${investigationId}/graph-configs`
}

export const graphConfigsApi = {
  list: (investigationId: string) =>
    api.get<GraphConfig[]>(base(investigationId)),

  create: (investigationId: string, body: CreateGraphConfigBody) =>
    api.post<GraphConfig>(base(investigationId), body),

  update: (investigationId: string, configId: string, body: UpdateGraphConfigBody) =>
    api.patch<GraphConfig>(`${base(investigationId)}/${configId}`, body),

  remove: (investigationId: string, configId: string) =>
    api.delete<void>(`${base(investigationId)}/${configId}`),
}
