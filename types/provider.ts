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
  curp?: string
  rfc?: string
  email?: string
  username?: string
  socialUrl?: string
}

export interface DorkSearchConfig {
  engine?: "auto" | "brave" | "searxng" | "ddg-browser"
  searchMode?: "general" | "identity" | "documents"
  keywords?: string[]
  platforms?: string[]
  fileTypes?: string[]
  maxQueries?: number
  delayMs?: number
}

// ─── Scrape Step Logs ────────────────────────────────────────────────────────

export type ScrapeStepType = "navigate" | "api_capture" | "dom_scrape" | "login" | "result"

export interface ScrapeStepExtractedData {
  fields?:   Record<string, string | number | boolean | null>
  tags?:     string[]
  items?:    { count: number; samples?: string[] }
  metrics?:  Record<string, number>
  navigate?: { finalUrl: string; capturedEndpoints?: string[] }
}

export interface ScrapeStepLog {
  id:                    string
  providerSource:        string
  entityId:              string | null
  stepType:              ScrapeStepType
  url:                   string | null
  httpStatus:            number | null
  durationMs:            number | null
  success:               boolean
  extractedData:         ScrapeStepExtractedData | null
  nodesCreated:          number
  relationshipsCreated:  number
  nodeTypes:             string[] | null
  errorMessage:          string | null
  createdAt:             string
}

export interface ScrapeJob {
  id: string
  entityId: string | null
  investigationId: string | null
  source: string
  status: ScrapeJobStatus
  seed: TramaProviderSeed
  config: Record<string, unknown> | null
  errorMessage: string | null
  bullJobId: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
}
