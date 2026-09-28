import { useCallback } from 'react';
import { Activity, CheckCircle2 } from 'lucide-react';
import { useFlow } from '../../context/FlowContext';
import type { EditorTab } from '../../types/flow';
import { DiagnosticCard } from './DiagnosticCard';

interface DiagnosticsViewProps {
  onNavigate: (tab: EditorTab) => void;
}

export default function DiagnosticsView({ onNavigate }: DiagnosticsViewProps) {
  const { diagnostics, selectNode } = useFlow();

  const goToNode = useCallback((nodeId: string) => {
    selectNode(nodeId);
    onNavigate('canvas');
  }, [selectNode, onNavigate]);

  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" />
              <span>تقرير التشخيص الشامل للتدفق الصوتي</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">فحص تلقائي للأخطاء (العقد المعزولة، الحلقات المفقودة، والنصوص الناقصة).</p>
          </div>
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-center">
            <span className="block text-lg font-bold text-amber-400">{diagnostics.length}</span>
            <span className="text-[10px] text-slate-400">إجمالي الملاحظات</span>
          </div>
        </div>

        <div className="space-y-3">
          {diagnostics.length === 0 ? (
            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-300">التدفق سليم تماماً!</h3>
              <p className="text-xs text-slate-400">لا توجد أي أخطاء أو تحذيرات في مسار المكالمة. جاهز للإطلاق.</p>
            </div>
          ) : (
            diagnostics.map((diag, index) => <DiagnosticCard key={`${diag.nodeId ?? 'flow'}-${index}`} diagnostic={diag} onGoToNode={goToNode} />)
          )}
        </div>
      </div>
    </div>
  );
}
