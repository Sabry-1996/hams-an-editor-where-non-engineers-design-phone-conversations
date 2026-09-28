import { useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { AnimatePresence, MotionConfig } from "motion/react";
import { useFlow } from "../../context/FlowContext";
import { useSimulator } from "../../context/SimulatorContext";
import type { EditorTab } from "../../types/flow";
import { FlowCanvas } from "./FlowCanvas";
import { NodeInspector } from "./NodeInspector";

interface CanvasViewProps {
  onNavigate: (tab: EditorTab) => void;
}

export default function CanvasView({ onNavigate }: CanvasViewProps) {
  const { simulator } = useSimulator();
  const { selectedNode } = useFlow();

  const quickCall = useCallback(() => {
    onNavigate("simulator");
    simulator.start();
  }, [onNavigate, simulator]);

  return (
    <div className="flex flex-1 relative overflow-hidden">
      <ReactFlowProvider>
        <FlowCanvas onQuickCall={quickCall} />
      </ReactFlowProvider>
      <MotionConfig reducedMotion="never">
        <AnimatePresence initial={false}>
          {selectedNode && <NodeInspector key="inspector" node={selectedNode} />}
        </AnimatePresence>
      </MotionConfig>
    </div>
  );
}
