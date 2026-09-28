import { useEffect } from 'react';
import { useFlow } from '../../context/FlowContext';
import { useSimulator } from '../../context/SimulatorContext';
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction';
import { useI18n } from '../../i18n/I18nContext';
import { CanvasControls } from './CanvasControls';
import { ConnectionsLayer } from './ConnectionsLayer';
import { FlowNodeCard } from './FlowNodeCard';

const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function FlowCanvas() {
  const { t } = useI18n();
  const {
    flow, diagnostics, selectedIds, selectNode, clearSelection, viewport, setPan,
    zoomIn, zoomOut, resetViewport, moveNodeBy, commitPositions, nudgeSelection, connect, deleteSelected
  } = useFlow();
  const { simulator } = useSimulator();
  const issues = new Set(diagnostics.map(item => item.nodeId).filter(Boolean));

  const { connectingSourceId, cancelConnect, canvasHandlers, onNodeMouseDown, onPortClick } = useCanvasInteraction({
    viewport,
    setPan,
    onNodeDrag: moveNodeBy,
    onDragEnd: commitPositions,
    onConnect: connect,
    onSelectNode: selectNode,
    onClearSelection: clearSelection
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag && TYPING.has(tag)) return;
      if (event.key === 'Escape') cancelConnect();
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelected();
      }
      const step = event.shiftKey ? 40 : 16;
      if (event.key === 'ArrowLeft') { event.preventDefault(); nudgeSelection({ x: -step, y: 0 }); }
      if (event.key === 'ArrowRight') { event.preventDefault(); nudgeSelection({ x: step, y: 0 }); }
      if (event.key === 'ArrowUp') { event.preventDefault(); nudgeSelection({ x: 0, y: -step }); }
      if (event.key === 'ArrowDown') { event.preventDefault(); nudgeSelection({ x: 0, y: step }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancelConnect, deleteSelected, nudgeSelection]);

  return (
    <div
      id="canvas-container"
      role="application"
      aria-label={t('tab_canvas')}
      dir="ltr"
      tabIndex={0}
      {...canvasHandlers}
      className="flex-1 bg-[#090d16] relative overflow-hidden cursor-grab outline-none focus:ring-1 focus:ring-teal-700"
      style={{ backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)', backgroundSize: '32px 32px' }}
    >
      <p className="absolute top-3 left-3 z-20 max-w-sm text-[11px] text-slate-400 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2">
        {t('canvas_dir')}
      </p>
      <div
        className="absolute inset-0"
        style={{ transform: `translate(${viewport.pan.x}px, ${viewport.pan.y}px) scale(${viewport.zoom})`, transformOrigin: '0 0' }}
      >
        <ConnectionsLayer nodes={flow.nodes} edges={flow.edges} connectingSourceId={connectingSourceId} />
        {flow.nodes.map(node => (
          <FlowNodeCard
            key={node.id}
            node={node}
            isSelected={selectedIds.includes(node.id)}
            isActive={simulator.currentNodeId === node.id && simulator.active}
            hasIssue={issues.has(node.id)}
            isConnecting={connectingSourceId === node.id}
            onSelect={selectNode}
            onMouseDown={onNodeMouseDown}
            onPortClick={onPortClick}
          />
        ))}
      </div>
      <CanvasControls zoom={viewport.zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetViewport} />
      {connectingSourceId && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-amber-500/20 border border-amber-500/50 text-amber-200 px-4 py-2 rounded-xl text-xs z-30 flex items-center gap-2">
          <span>{t('connecting')}</span>
          <button type="button" onClick={cancelConnect} className="underline font-bold">{t('cancel')}</button>
        </div>
      )}
    </div>
  );
}
