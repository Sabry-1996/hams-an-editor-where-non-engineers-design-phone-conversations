import type { NodeData } from '../../../types/flow';

interface OutputsListProps {
  node: NodeData;
  resolveLabel: (nodeId: string) => string;
  onRemove: (targetId: string) => void;
}

export function OutputsList({ node, resolveLabel, onRemove }: OutputsListProps) {
  return (
    <div className="border-t border-slate-800 pt-4">
      <h4 className="text-xs font-semibold text-slate-400 mb-2">المسارات الخارجة (Outputs)</h4>
      {node.outputs.length === 0 ? (
        <p className="text-[11px] text-slate-500">لا توجد روابط خارجية من هذه العقدة.</p>
      ) : (
        <div className="space-y-1.5">
          {node.outputs.map(targetId => (
            <div key={targetId} className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-300">{resolveLabel(targetId)}</span>
              <button onClick={() => onRemove(targetId)} className="text-rose-400 hover:text-rose-300 text-[10px]">
                إزالة
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
