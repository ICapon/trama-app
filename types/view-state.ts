export interface PinnedPosition {
  fx: number
  fy: number
  fz: number
}

export interface InvestigationViewState {
  graph?: {
    pinnedPositions?: Record<string, PinnedPosition>
    bookmarkedNodeIds?: string[]
    hiddenNodeIds?: string[]
    depth?: number
  }
  notes?: Record<string, string>
  lastSelectedNodeId?: string
}
