"use client";

import { useCallback, useRef, useState } from "react";
import { GraphCanvas, darkTheme, lightTheme } from "reagraph";
import type { GraphCanvasRef, GraphEdge, GraphNode, InternalGraphEdge, InternalGraphNode } from "reagraph";
import { useAppTheme } from "@/hooks/use-theme";
import type { GraphEdgeResponse, GraphNodeResponse } from "@/lib/graph/types";
import type { PinnedPosition } from "@/types/view-state";

type PinnedPositions = Record<string, PinnedPosition>;

export type GraphLayout = "force" | "radial";

interface TramaGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  readonly?: boolean;
  selectedNodeId?: string;
  layout?: GraphLayout;
  initialPinnedPositions?: PinnedPositions;
  onNodeClick?: (node: GraphNodeResponse) => void;
  onEdgeClick?: (edge: GraphEdgeResponse) => void;
  onPositionsChange?: (positions: PinnedPositions) => void;
  onCanvasClick?: () => void;
}

const LAYOUT_MAP: Record<GraphLayout, "forceDirected2d" | "radialOut2d"> = {
  force: "forceDirected2d",
  radial: "radialOut2d",
};

export function TramaGraph({
  nodes,
  edges,
  readonly = false,
  selectedNodeId,
  layout = "force",
  initialPinnedPositions,
  onNodeClick,
  onEdgeClick,
  onPositionsChange,
  onCanvasClick,
}: TramaGraphProps) {
  const graphRef = useRef<GraphCanvasRef | null>(null);
  const [pinnedPositions, setPinnedPositions] = useState<PinnedPositions>(
    initialPinnedPositions ?? {},
  );
  const { resolvedTheme } = useAppTheme();
  const theme = resolvedTheme === "dark" ? darkTheme : lightTheme;
  const nodeClickedRef = useRef(false);

  const positionedNodes = nodes.map((node) => ({
    ...node,
    ...(layout === "force" ? pinnedPositions[node.id] : undefined),
  }));

  const handleNodeDragged = useCallback(
    (node: InternalGraphNode) => {
      const { x, y, z } = node.position;
      setPinnedPositions((prev) => {
        const next = { ...prev, [node.id]: { fx: x, fy: y, fz: z } };
        onPositionsChange?.(next);
        return next;
      });
    },
    [onPositionsChange],
  );

  const handleNodeClick = useCallback(
    (node: InternalGraphNode) => {
      nodeClickedRef.current = true;
      if (onNodeClick && node.data) {
        onNodeClick(node.data as GraphNodeResponse);
      }
    },
    [onNodeClick],
  );

  const handleEdgeClick = useCallback(
    (edge: InternalGraphEdge) => {
      nodeClickedRef.current = true;
      if (onEdgeClick && edge.data) {
        onEdgeClick(edge.data as GraphEdgeResponse);
      }
    },
    [onEdgeClick],
  );

  const handleWrapperClick = useCallback(() => {
    if (nodeClickedRef.current) {
      nodeClickedRef.current = false;
      return;
    }
    onCanvasClick?.();
  }, [onCanvasClick]);

  if (!nodes.length) {
    return (
      <div
        className="flex flex-1 h-full items-center justify-center"
        onClick={onCanvasClick}
      >
        <p className="text-sm text-zinc-400">No nodes to display</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full" onClick={handleWrapperClick}>
      <GraphCanvas
        ref={graphRef}
        nodes={positionedNodes}
        edges={edges}
        theme={theme}
        layoutType={LAYOUT_MAP[layout]}
        draggable={!readonly}
        selections={selectedNodeId ? [selectedNodeId] : []}
        labelType="all"
        edgeLabelPosition="natural"
        onNodeDragged={readonly ? undefined : handleNodeDragged}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
      />
    </div>
  );
}
