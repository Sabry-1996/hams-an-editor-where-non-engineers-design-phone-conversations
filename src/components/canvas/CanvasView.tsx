import { useCallback } from 'react';
import { useFlow } from '../../context/FlowContext';
import { useSimulator } from '../../context/SimulatorContext';
import type { EditorTab } from '../../types/flow';
import { FlowCanvas } from './FlowCanvas';
import { NodeInspector } from './NodeInspector';
import { NodeToolbox } from './NodeToolbox';

interface CanvasViewProps {
  onNavigate: (tab: EditorTab) => void;
}

export default function CanvasView({ onNavigate }: CanvasViewProps) {
  const { addNode } = useFlow();
  const { simulator } = useSimulator();

  const quickCall = useCallback(() => {
    onNavigate('simulator');
    simulator.start();
  }, [onNavigate, simulator]);

  return (
    <div className="flex flex-1 relative overflow-hidden">
      <NodeToolbox onAddNode={addNode} onQuickCall={quickCall} />
      <FlowCanvas />
      <NodeInspector />
    </div>
  );
}
