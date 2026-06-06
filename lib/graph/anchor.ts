import type { GraphNode, GraphEdge } from "reagraph"

/**
 * BFS from anchorId over allEdges (bidirectional).
 * Returns all reachable nodes + all edges between them.
 */
export function computeAnchorSubgraph(
  anchorId: string,
  allNodes: GraphNode[],
  allEdges: GraphEdge[],
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const reachable = new Set<string>([anchorId])
  const queue = [anchorId]

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const edge of allEdges) {
      const neighbor =
        edge.source === current ? edge.target :
        edge.target === current ? edge.source : null
      if (neighbor && !reachable.has(neighbor)) {
        reachable.add(neighbor)
        queue.push(neighbor)
      }
    }
  }

  return {
    nodes: allNodes.filter((n) => reachable.has(n.id)),
    edges: allEdges.filter((e) => reachable.has(e.source) && reachable.has(e.target)),
  }
}
