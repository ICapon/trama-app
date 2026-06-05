import type { GraphNodeResponse, GraphEdgeResponse } from "@/lib/graph/types"
import type { InvestigationViewState } from "./investigation"

export interface TramaExportBundle {
  version: "1"
  exportedAt: string
  investigation: {
    title: string
    description: string | null
    status: string
    priority: string
    hypothesis: string | null
    tags: string[]
    viewState: InvestigationViewState | null
    targets: Array<{ nodeId: string; nodeLabel: string; nodeType: string }>
  }
  graph: {
    nodes: Array<Pick<GraphNodeResponse, "id" | "type" | "label" | "properties">>
    edges: Array<Pick<GraphEdgeResponse, "source" | "target" | "type" | "properties">>
  }
}
