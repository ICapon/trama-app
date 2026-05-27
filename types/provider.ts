export type TramaProviderCategory =
  | "identity"
  | "social"
  | "financial"
  | "legal"
  | "location"
  | "communications"

export interface Provider {
  id: string
  source: string
  name: string
  description: string
  version: string
  category: TramaProviderCategory
  countries: string[]
  supportedInputs: string[]
  outputNodeTypes: string[]
  isActive: boolean
  totalRuns: number
  successCount: number
  failCount: number
  avgDurationMs: number | null
  lastRunAt: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
}

export type ScrapeJobStatus = "pending" | "running" | "completed" | "failed"

export interface TramaProviderSeed {
  firstName?: string
  lastName?: string
  fullName?: string
  birthDate?: string
  email?: string
  username?: string
  socialUrl?: string
}

export interface ScrapeJob {
  id: string
  personId: string
  source: string
  status: ScrapeJobStatus
  seed?: TramaProviderSeed
  createdNodeIds: string[]
  errorMessage: string | null
  bullJobId: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
}
