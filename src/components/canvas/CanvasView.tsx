import { Suspense, lazy, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { AnimatePresence, MotionConfig } from "motion/react";
import { useFlow } from "../../context/FlowContext";
import { useSimulator } from "../../context/SimulatorContext";
import type { CanvasViewMode, EditorTab } from "../../types/flow";
import { LoadingView } from "../ui/LoadingView";
import { FlowCanvas } from "./FlowCanvas";
import { NodeInspector } from "./NodeInspector";
import { ViewModeToggle } from "./ViewModeToggle";

const CallScriptView = lazy(() => import("../script/CallScriptView"));

interface CanvasViewProps {
  onNavigate: (tab: EditorTab) => void;
  viewMode: CanvasViewMode;
  onViewModeChange: (mode: CanvasViewMode) => void;
}

export default function CanvasView({
  onNavigate,
  viewMode,
  onViewModeChange,
}: CanvasViewProps) {
  const { simulator } = useSimulator();
  const { selectedNode } = useFlow();

  const quickCall = useCallback(() => {
    onNavigate("simulator");
    simulator.start();
  }, [onNavigate, simulator]);

  return (
    <div className="flex flex-1 relative overflow-hidden">
      {viewMode === "graph" ? (
        <ReactFlowProvider>
          <FlowCanvas onQuickCall={quickCall} />
        </ReactFlowProvider>
      ) : (
        <Suspense fallback={<LoadingView />}>
          <CallScriptView />
        </Suspense>
      )}
      <ViewModeToggle
        value={viewMode}
        onChange={onViewModeChange}
        className="absolute top-3 left-1/2 -translate-x-1/2 z-10"
      />
      <MotionConfig reducedMotion="never">
        <AnimatePresence initial={false}>
          {selectedNode && <NodeInspector key="inspector" node={selectedNode} />}
        </AnimatePresence>
      </MotionConfig>
    </div>
  );
}
