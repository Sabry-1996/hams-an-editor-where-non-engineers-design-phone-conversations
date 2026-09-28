import { useCallback, useMemo } from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { useFlow } from '../../context/FlowContext';
import type { NodeConfig } from '../../types/flow';
import { findNode, isSpeakingNode } from '../../utils/flowGraph';
import { Field, inputClass } from '../ui/Field';
import { AskFields } from './inspector/AskFields';
import { OutputsList } from './inspector/OutputsList';
import { SpeechFields } from './inspector/SpeechFields';
import { ToolFields } from './inspector/ToolFields';
import { UpstreamVariables } from './inspector/UpstreamVariables';

export function NodeInspector() {
  const { flow, selectedNode, patchNode, deleteNode, disconnect, upstreamVariablesOf } = useFlow();

  const upstreamVars = useMemo(
    () => (selectedNode ? upstreamVariablesOf(selectedNode.id) : []),
    [selectedNode, upstreamVariablesOf]
  );

  const resolveLabel = useCallback((id: string) => findNode(flow, id)?.label ?? id, [flow]);

  if (!selectedNode) return null;
  const node = selectedNode;
  const onConfigChange = (patch: Partial<NodeConfig>) => patchNode(node.id, { config: patch });

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 p-5 flex flex-col gap-5 z-20 overflow-y-auto shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-teal-400" />
          <h2 className="text-sm font-bold text-slate-200">خصائص العقدة</h2>
        </div>
        <button onClick={() => deleteNode(node.id)} className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg transition" title="حذف العقدة">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <Field label="معرف العقدة (ID)">
          <input type="text" readOnly value={node.id} className={`${inputClass} font-mono text-slate-400`} />
        </Field>

        <Field label="اسم العقدة (Label)">
          <input type="text" value={node.label} onChange={e => patchNode(node.id, { label: e.target.value })} className={inputClass} />
        </Field>

        {isSpeakingNode(node) && <SpeechFields config={node.config} onChange={onConfigChange} />}
        {node.type === 'ask' && <AskFields config={node.config} onChange={onConfigChange} />}
        {node.type === 'tool' && <ToolFields config={node.config} onChange={onConfigChange} />}

        <UpstreamVariables variables={upstreamVars} />

        <OutputsList node={node} resolveLabel={resolveLabel} onRemove={targetId => disconnect(node.id, targetId)} />
      </div>
    </div>
  );
}
