import { useFlow } from '../../context/FlowContext';
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction';
import { CanvasControls } from './CanvasControls';
import { ConnectionsLayer } from './ConnectionsLayer';
import { FlowNodeCard } from './FlowNodeCard';

export function FlowCanvas() {
  const { flow, selectedNodeId, selectNode, viewport, setPan, zoomIn, zoomOut, resetViewport, moveNodeBy, connect } = useFlow();

  const { connectingSourceId, cancelConnect, canvasHandlers, onNodeMouseDown, onPortClick } = useCanvasInteraction({
    viewport,
    setPan,
    onNodeDrag: moveNodeBy,
    onConnect: connect,
    onSelectNode: selectNode
  });

  return (
    <div
      id="canvas-container"
      {...canvasHandlers}
      className="flex-1 bg-[#090d16] relative overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)', backgroundSize: '32px 32px' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ transform: `translate(${viewport.pan.x}px, ${viewport.pan.y}px) scale(${viewport.zoom})`, transformOrigin: '0 0' }}
      >
        <ConnectionsLayer nodes={flow.nodes} connectingSourceId={connectingSourceId} />

        {flow.nodes.map(node => (
          <FlowNodeCard
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            isConnecting={connectingSourceId === node.id}
            onSelect={selectNode}
            onMouseDown={onNodeMouseDown}
            onPortClick={onPortClick}
          />
        ))}
      </div>

      <CanvasControls zoom={viewport.zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetViewport} />

      {connectingSourceId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500/20 border border-amber-500/50 text-amber-300 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl z-30 flex items-center gap-2 animate-bounce">
          <span>جاري ربط العقدة... اضغط على عقدة الاستهداف لإتمام الرابط.</span>
          <button onClick={cancelConnect} className="underline font-bold">إلغاء</button>
        </div>
      )}
    </div>
  );
}
