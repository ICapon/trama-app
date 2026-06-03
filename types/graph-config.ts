export interface GraphConfigFilters {
  relationshipTypes: string[]
  // future: nodeTypes?: string[]
  // future: confidence?: { min: number }
}

export interface GraphConfig {
  id: string
  investigationId: string
  name: string
  description: string | null
  filters: GraphConfigFilters
  layout: "force" | "radial"
  createdAt: string
  updatedAt: string
}

export type CreateGraphConfigBody = {
  name: string
  description?: string
  filters?: GraphConfigFilters
  layout?: "force" | "radial"
}

export type UpdateGraphConfigBody = {
  name?: string
  description?: string
  filters?: GraphConfigFilters
  layout?: "force" | "radial"
}
