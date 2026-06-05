"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { GraphCanvas, darkTheme, lightTheme } from "reagraph";
import { _roots } from "@react-three/fiber";
import type { GraphCanvasRef, GraphEdge, GraphNode, InternalGraphEdge, InternalGraphNode } from "reagraph";
import * as THREE from "three";
import { useAppTheme } from "@/hooks/use-theme";
import type { GraphEdgeResponse, GraphNodeResponse } from "@/lib/graph/types";
import type { PinnedPosition } from "@/types/view-state";

type PinnedPositions = Record<string, PinnedPosition>;

export type GraphLayout = "force" | "radial";

export type TramaGraphRef = {
  getNodePosition: (id: string) => { x: number; y: number; z: number } | null;
};

function circularizeUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      // Center-crop source so non-square images don't get stretched
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface TramaGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  readonly?: boolean;
  selectedNodeId?: string;
  selectedNodeIds?: string[];
  layout?: GraphLayout;
  initialPinnedPositions?: PinnedPositions;
  onNodeClick?: (node: GraphNodeResponse) => void;
  onEdgeClick?: (edge: GraphEdgeResponse) => void;
  onPositionsChange?: (positions: PinnedPositions) => void;
  onCanvasClick?: (pos: { x: number; y: number; z: number }) => void;
  onLassoEnd?: (ids: string[]) => void;
  focusNodeId?: string;
  lassoActive?: boolean;
}

const LAYOUT_MAP: Record<GraphLayout, "forceDirected2d" | "radialOut2d"> = {
  force: "forceDirected2d",
  radial: "radialOut2d",
};

export const TramaGraph = forwardRef<TramaGraphRef, TramaGraphProps>(function TramaGraph({
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
  onLassoEnd,
  focusNodeId,
  lassoActive = false,
  selectedNodeIds = [],
}: TramaGraphProps, ref: React.Ref<TramaGraphRef>) {
  const graphRef = useRef<GraphCanvasRef | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [pinnedPositions, setPinnedPositions] = useState<PinnedPositions>(
    initialPinnedPositions ?? {},
  );
  const iconCacheRef = useRef<Map<string, string>>(new Map());
  const [circularIcons, setCircularIcons] = useState<Record<string, string>>({});
  const { resolvedTheme } = useAppTheme();
  const theme = resolvedTheme === "dark" ? darkTheme : lightTheme;
  const nodeClickedRef = useRef(false);
  // Ref always in sync with pinnedPositions — updated synchronously to avoid stale deltas
  const pinnedPositionsRef = useRef<PinnedPositions>(initialPinnedPositions ?? {});

  useImperativeHandle(ref, () => ({
    getNodePosition: (id: string) => {
      try {
        const attrs = (graphRef.current?.getGraph() as any)?.getNodeAttributes(id);
        if (!attrs) return null;
        const pos = attrs.position as { x: number; y: number; z: number } | undefined;
        return pos ?? null;
      } catch {
        return null;
      }
    },
  }));

  // Multi-drag: debounce timer to save positions after drag ends
  const multiDragSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Zoom to node + direct neighbors when focusNodeId changes
  useEffect(() => {
    if (!focusNodeId) return;
    const timer = setTimeout(() => {
      const neighborIds = edges
        .filter((e) => e.source === focusNodeId || e.target === focusNodeId)
        .map((e) => (e.source === focusNodeId ? e.target : e.source));
      graphRef.current?.fitNodesInView([focusNodeId, ...neighborIds], { animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [focusNodeId]);

  // Process node icons into circular data URLs
  useEffect(() => {
    const urls = [...new Set(nodes.map((n) => n.icon).filter((u): u is string => !!u))];
    const pending = urls.filter((u) => !iconCacheRef.current.has(u));
    if (pending.length === 0) return;
    Promise.allSettled(pending.map((url) => circularizeUrl(url).then((data) => ({ url, data }))))
      .then((results) => {
        const updates: Record<string, string> = {};
        results.forEach((r) => {
          if (r.status === "fulfilled") {
            iconCacheRef.current.set(r.value.url, r.value.data);
            updates[r.value.url] = r.value.data;
          }
        });
        if (Object.keys(updates).length > 0) {
          setCircularIcons((prev) => ({ ...prev, ...updates }));
        }
      });
  }, [nodes]);

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
    pinnedPositionsRef.current = next;
    setPinnedPositions(next);
    onPositionsChange?.(next);
  }, [nodes]); // intentional: only trigger on nodes change, not on pinnedPositions change

  const positionedNodes = nodes.map((node) => ({
    ...node,
    ...(layout === "force" ? pinnedPositions[node.id] : undefined),
    icon: node.icon ? (circularIcons[node.icon] ?? node.icon) : undefined,
  }));

  const handleNodeDragged = useCallback(
    (node: InternalGraphNode) => {
      const { x, y, z } = node.position;
      const isMulti = selectedNodeIds.length > 1 && selectedNodeIds.includes(node.id);

      if (isMulti) {
        // reagraph moves all nodes in `selections` automatically via its internal setNodePosition.
        // We must NOT update pinnedPositions/React state during drag — that triggers buildGraph
        // which resets positions via updateLayout. Instead, debounce-save after drag settles.
        if (multiDragSaveTimerRef.current) clearTimeout(multiDragSaveTimerRef.current);
        multiDragSaveTimerRef.current = setTimeout(() => {
          const canvas = wrapperRef.current?.querySelector("canvas");
          const scene = canvas ? (_roots as any).get(canvas)?.store?.getState()?.scene as THREE.Object3D | undefined : undefined;
          if (!scene) return;
          const additions: PinnedPositions = {};
          const tmp = new THREE.Vector3();
          scene.traverse((obj: THREE.Object3D) => {
            const id = obj.userData?.id as string | undefined;
            if (!id || obj.userData?.type !== "node" || !selectedNodeIds.includes(id)) return;
            obj.getWorldPosition(tmp);
            additions[id] = { fx: tmp.x, fy: tmp.y, fz: tmp.z };
          });
          if (Object.keys(additions).length > 0) {
            const next = { ...pinnedPositionsRef.current, ...additions };
            pinnedPositionsRef.current = next;
            setPinnedPositions(next);
            onPositionsChange?.(next);
          }
        }, 150);
      } else {
        const next = { ...pinnedPositionsRef.current, [node.id]: { fx: x, fy: y, fz: z } };
        pinnedPositionsRef.current = next;
        setPinnedPositions(next);
        onPositionsChange?.(next);
      }
    },
    [selectedNodeIds, onPositionsChange],
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

  // ── Custom 2D lasso ───────────────────────────────────────────────────────────
  // reagraph's built-in lasso only hits isMesh — sprites (icon nodes) are missed.
  // Document-level listeners ensure mouseup is captured even outside the div.
  const lassoStartRef = useRef<{ x: number; y: number } | null>(null);
  const lassoRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const nodesRef = useRef(nodes);
  const onLassoEndRef = useRef(onLassoEnd);
  const onPositionsChangeRef = useRef(onPositionsChange);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { onLassoEndRef.current = onLassoEnd; }, [onLassoEnd]);
  useEffect(() => { onPositionsChangeRef.current = onPositionsChange; }, [onPositionsChange]);

  const [lassoRect, setLassoRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const handleLassoMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    console.debug("[lasso] mousedown", e.clientX, e.clientY);
    e.preventDefault();
    e.stopPropagation();
    const container = wrapperRef.current!;
    const cr = container.getBoundingClientRect();
    const startX = e.clientX - cr.left;
    const startY = e.clientY - cr.top;
    lassoStartRef.current = { x: startX, y: startY };
    lassoRectRef.current = { x: startX, y: startY, w: 0, h: 0 };
    setLassoRect({ x: startX, y: startY, w: 0, h: 0 });

    function onMove(ev: MouseEvent) {
      const cr2 = container.getBoundingClientRect();
      const cx = ev.clientX - cr2.left;
      const cy = ev.clientY - cr2.top;
      const start = lassoStartRef.current!;
      const r = {
        x: Math.min(start.x, cx), y: Math.min(start.y, cy),
        w: Math.abs(cx - start.x), h: Math.abs(cy - start.y),
      };
      lassoRectRef.current = r;
      setLassoRect(r);
    }

    function onUp() {
      console.debug("[lasso] mouseup, rect:", lassoRectRef.current);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);

      const rect = lassoRectRef.current;
      lassoStartRef.current = null;
      lassoRectRef.current = null;
      setLassoRect(null);

      if (!rect || (rect.w < 4 && rect.h < 4)) return;

      const canvas = container.querySelector("canvas");
      const r3fState = canvas ? (_roots as any).get(canvas)?.store?.getState() : undefined;
      const camera = r3fState?.camera as THREE.Camera | undefined;
      if (!camera) { console.warn("[lasso] no camera"); return; }

      const { width, height } = container.getBoundingClientRect();
      const selected: string[] = [];

      // Traverse the live Three.js scene to get actual rendered positions
      const scene = r3fState?.scene as THREE.Object3D | undefined;
      if (scene) {
        const tmp = new THREE.Vector3();
        scene.traverse((obj: THREE.Object3D) => {
          const id = obj.userData?.id as string | undefined;
          if (!id || obj.userData?.type !== "node") return;
          obj.getWorldPosition(tmp);
          tmp.project(camera);
          const sx = ((tmp.x + 1) / 2) * width;
          const sy = ((-tmp.y + 1) / 2) * height;
          if (sx >= rect.x && sx <= rect.x + rect.w && sy >= rect.y && sy <= rect.y + rect.h) {
            if (!selected.includes(id)) selected.push(id);
          }
        });
      }

      // Pin all selected nodes at their current scene positions so multi-drag
      // delta always operates on known pinnedPositions (not stale graphology data)
      if (selected.length > 0) {
        const additions: PinnedPositions = {};
        const tmp2 = new THREE.Vector3();
        if (scene) {
          scene.traverse((obj: THREE.Object3D) => {
            const id = obj.userData?.id as string | undefined;
            if (!id || obj.userData?.type !== "node" || !selected.includes(id)) return;
            obj.getWorldPosition(tmp2);
            additions[id] = { fx: tmp2.x, fy: tmp2.y, fz: tmp2.z };
          });
        }
        if (Object.keys(additions).length > 0) {
          const next = { ...pinnedPositionsRef.current, ...additions };
          pinnedPositionsRef.current = next;
          setPinnedPositions(next);
          onPositionsChangeRef.current?.(next);
        }
      }

      console.debug("[lasso] rect:", rect, "selected:", selected);
      onLassoEndRef.current?.(selected);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

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
    <div ref={wrapperRef} className="w-full h-full relative" onClick={handleWrapperClick}>
      <GraphCanvas
        ref={graphRef}
        nodes={positionedNodes}
        edges={edges}
        theme={theme}
        layoutType={LAYOUT_MAP[layout]}
        draggable={!readonly}
        selections={selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : []}
        labelType="all"
        edgeLabelPosition="natural"
        defaultNodeSize={10}
        onNodeDragged={readonly ? undefined : handleNodeDragged}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
      />
      {/* Lasso overlay — sits on top of canvas, blocks camera events */}
      {lassoActive && (
        <div
          className="absolute inset-0 z-10 cursor-crosshair"
          onMouseDown={handleLassoMouseDown}
        >
          {lassoRect && (
            <div
              className="pointer-events-none absolute border border-sky-400 bg-sky-400/10"
              style={{ left: lassoRect.x, top: lassoRect.y, width: lassoRect.w, height: lassoRect.h }}
            />
          )}
        </div>
      )}
    </div>
  );
});
