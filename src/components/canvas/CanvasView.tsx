import { useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useSimulator } from '../../context/SimulatorContext';
import type { EditorTab } from '../../types/flow';
import { FlowCanvas } from './FlowCanvas';
import { NodeInspector } from './NodeInspector';

interface CanvasViewProps {
  onNavigate: (tab: EditorTab) => void;
}

export default function CanvasView({ onNavigate }: CanvasViewProps) {
  const { simulator } = useSimulator();

  const quickCall = useCallback(() => {
    onNavigate('simulator');
    simulator.start();
  }, [onNavigate, simulator]);

  return (
    <div className="flex flex-1 relative overflow-hidden">
      <ReactFlowProvider>
        <FlowCanvas onQuickCall={quickCall} />
      </ReactFlowProvider>
      <NodeInspector />
    </div>
  );
}
