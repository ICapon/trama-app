export type CronJobStatus = "active" | "paused"

export interface CronJob {
  id: string
  name: string
  description: string | null
  cronExpression: string
  source: string
  entityId: string
  investigationId: string
  seed: Record<string, string> | null
  config: Record<string, unknown> | null
  status: CronJobStatus
  schedulerKey: string | null
  lastRunAt: string | null
  createdAt: string
  updatedAt: string
}

export type CronJobSeed = {
  // Person
  firstName?: string
  lastName?: string
  fullName?: string
  birthDate?: string
  email?: string
  username?: string
  socialUrl?: string
  // MX identifiers
  curp?: string
  rfc?: string
  // Organization / entity
  organization?: string
  // Technical
  domain?: string
  phone?: string
  // Generic free-form
  query?: string
}

export type CronJobConfig = {
  searchMode?: "general" | "identity" | "documents"
  engine?: "auto" | "brave" | "brave-browser" | "searxng" | "ddg-browser"
  platforms?: string[]
  keywords?: string[]
  fileTypes?: string[]
  maxQueries?: number
}

export type CreateCronJobBody = {
  name: string
  description?: string
  cronExpression: string
  source: string
  entityId: string
  investigationId: string
  seed?: CronJobSeed
  config?: CronJobConfig
}

export type UpdateCronJobBody = Partial<CreateCronJobBody>
