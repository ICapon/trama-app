export type TramaNodeCategory =
  | 'identity'
  | 'organization'
  | 'digitalInfrastructure'
  | 'socialContent'
  | 'location'
  | 'legalBusiness'
  | 'assets'
  | 'evidenceSources'
  | 'investigation'
  | 'aiAnalysis'

export interface GraphNodeResponse {
  id: string
  type: string
  category: TramaNodeCategory
  label: string
  properties: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface GraphEdgeResponse {
  id: string
  source: string
  target: string
  type: string
  label?: string
  properties?: Record<string, unknown>
}

export interface NeighborResult {
  neighbor: GraphNodeResponse
  edge: GraphEdgeResponse
}
