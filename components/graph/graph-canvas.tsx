"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GraphCanvas, darkTheme, lightTheme } from "reagraph";
import type { GraphCanvasRef, GraphEdge, GraphNode, InternalGraphEdge, InternalGraphNode } from "reagraph";
import * as THREE from "three";
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
  onCanvasClick?: (pos: { x: number; y: number; z: number }) => void;
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [pinnedPositions, setPinnedPositions] = useState<PinnedPositions>(
    initialPinnedPositions ?? {},
  );
  const { resolvedTheme } = useAppTheme();
  const theme = resolvedTheme === "dark" ? darkTheme : lightTheme;
  const nodeClickedRef = useRef(false);

  // Auto-pin nodes that arrive with fx/fy/fz (e.g. newly created nodes with a click position)
  useEffect(() => {
    const additions: PinnedPositions = {};
    let changed = false;
    nodes.forEach((node) => {
      if (node.fx !== undefined && !pinnedPositions[node.id]) {
        additions[node.id] = { fx: node.fx, fy: node.fy ?? 0, fz: node.fz ?? 0 };
        changed = true;
      }
    });
    if (!changed) return;
    const next = { ...pinnedPositions, ...additions };
    setPinnedPositions(next);
    onPositionsChange?.(next);
  }, [nodes]); // intentional: only trigger on nodes change, not on pinnedPositions change

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

  const handleWrapperClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (nodeClickedRef.current) {
      nodeClickedRef.current = false;
      return;
    }
    const camera = (graphRef.current as any)?.controls?.camera as THREE.Camera | undefined;
    const container = wrapperRef.current;
    if (camera && container) {
      const rect = container.getBoundingClientRect();
      const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const target = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, target);
      onCanvasClick?.({ x: target.x, y: target.y, z: 0 });
    } else {
      onCanvasClick?.({ x: 0, y: 0, z: 0 });
    }
  }, [onCanvasClick]);

  if (!nodes.length) {
    return (
      <div
        className="flex flex-1 h-full items-center justify-center"
        onClick={() => onCanvasClick?.({ x: 0, y: 0, z: 0 })}
      >
        <p className="text-sm text-zinc-400">No nodes to display</p>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="w-full h-full" onClick={handleWrapperClick}>
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
