"use client";

import { useCallback, useRef, useState } from "react";
import { GraphCanvas } from "reagraph";
import type { GraphCanvasRef, GraphEdge, GraphNode, InternalGraphNode } from "reagraph";

type PinnedPositions = Record<string, { fx: number; fy: number; fz: number }>;

const INITIAL_NODES: GraphNode[] = [
  { id: "1", label: "Node 1" },
  { id: "2", label: "Node 2" },
  { id: "3", label: "Node 3" },
  { id: "4", label: "Node 4" },
  { id: "5", label: "Node 5" },
];

const INITIAL_EDGES: GraphEdge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-4", source: "3", target: "4" },
  { id: "e4-5", source: "4", target: "5" },
  { id: "e5-1", source: "5", target: "1" },
  { id: "e1-3", source: "1", target: "3" },
];

export function TramaGraph() {
  const graphRef = useRef<GraphCanvasRef | null>(null);
  const [pinnedPositions, setPinnedPositions] = useState<PinnedPositions>({});

  // Merge pinned fx/fy/fz into nodes so they stay put after dragging
  const nodes = INITIAL_NODES.map((node) => ({
    ...node,
    ...pinnedPositions[node.id],
  }));

  const handleNodeDragged = useCallback((node: InternalGraphNode) => {
    const { x, y, z } = node.position;
    setPinnedPositions((prev) => ({
      ...prev,
      [node.id]: { fx: x, fy: y, fz: z },
    }));
  }, []);

  return (
    <GraphCanvas
      ref={graphRef}
      nodes={nodes}
      edges={INITIAL_EDGES}
      draggable
      onNodeDragged={handleNodeDragged}
    />
  );
}
