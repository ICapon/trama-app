import type { InvestigationViewState } from './view-state'

export type { InvestigationViewState }

export type InvestigationStatus = "open" | "in_progress" | "closed" | "archived"
export type InvestigationPriority = "low" | "medium" | "high" | "critical"

export interface TargetNode {
  nodeId: string
  nodeLabel: string
  nodeType: string
}

export interface Investigation {
  id: string
  title: string
  description?: string
  status: InvestigationStatus
  priority: InvestigationPriority
  hypothesis?: string
  tags: string[]
  ownerId: string | null
  targets?: TargetNode[]
  viewState?: InvestigationViewState | null
  createdAt: string
  updatedAt: string
}

export type CreateInvestigationBody = {
  title: string
  description?: string
  priority?: InvestigationPriority
  tags?: string[]
  ownerId?: string | null
}

export type UpdateInvestigationBody = {
  title?: string
  status?: InvestigationStatus
  priority?: InvestigationPriority
  hypothesis?: string
  tags?: string[]
}

export type AddTargetBody = {
  nodeId: string
  nodeLabel: string
  nodeType: string
}
