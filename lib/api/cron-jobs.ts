import { api } from "./client"
import type { CronJob, CreateCronJobBody, UpdateCronJobBody } from "@/types/cron-job"

const PREFIX = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_PREFIX ?? "")
  : "/api"
const BASE = `${PREFIX}/cron-jobs`

export const cronJobsApi = {
  list: () =>
    api.get<CronJob[]>(BASE),

  get: (id: string) =>
    api.get<CronJob>(`${BASE}/${id}`),

  create: (body: CreateCronJobBody) =>
    api.post<CronJob>(BASE, body),

  update: (id: string, body: UpdateCronJobBody) =>
    api.patch<CronJob>(`${BASE}/${id}`, body),

  remove: (id: string) =>
    api.delete<void>(`${BASE}/${id}`),

  pause: (id: string) =>
    api.post<CronJob>(`${BASE}/${id}/pause`),

  resume: (id: string) =>
    api.post<CronJob>(`${BASE}/${id}/resume`),
}
