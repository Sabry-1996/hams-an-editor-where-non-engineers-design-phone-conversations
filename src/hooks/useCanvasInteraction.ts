import { useCallback, useState } from 'react';
import type React from 'react';
import type { Position } from '../types/flow';

export interface Viewport {
  pan: Position;
  zoom: number;
}

interface UseCanvasInteractionOptions {
  viewport: Viewport;
  setPan: (pan: Position) => void;
  onNodeDrag: (nodeId: string, delta: Position) => void;
  onConnect: (sourceId: string, targetId: string) => void;
  onSelectNode: (nodeId: string) => void;
}

export function useCanvasInteraction({ viewport, setPan, onNodeDrag, onConnect, onSelectNode }: UseCanvasInteractionOptions) {
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);

  const onCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'svg' || target.id === 'canvas-container') {
      setIsPanning(true);
      setDragStart({ x: e.clientX - viewport.pan.x, y: e.clientY - viewport.pan.y });
    }
  }, [viewport.pan]);

  const onCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (draggingNodeId) {
      onNodeDrag(draggingNodeId, {
        x: (e.clientX - dragStart.x) / viewport.zoom,
        y: (e.clientY - dragStart.y) / viewport.zoom
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, draggingNodeId, dragStart, viewport.zoom, setPan, onNodeDrag]);

  const onCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingNodeId(null);
  }, []);

  const onNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectNode(nodeId);
    setDraggingNodeId(nodeId);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [onSelectNode]);

  const onPortClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!connectingSourceId) {
      setConnectingSourceId(nodeId);
      return;
    }
    if (connectingSourceId !== nodeId) onConnect(connectingSourceId, nodeId);
    setConnectingSourceId(null);
  }, [connectingSourceId, onConnect]);

  const cancelConnect = useCallback(() => setConnectingSourceId(null), []);

  return {
    connectingSourceId,
    cancelConnect,
    canvasHandlers: { onMouseDown: onCanvasMouseDown, onMouseMove: onCanvasMouseMove, onMouseUp: onCanvasMouseUp },
    onNodeMouseDown,
    onPortClick
  };
}
