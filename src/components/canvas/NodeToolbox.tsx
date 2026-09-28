import React from 'react';
import { Database, MessageSquare, Mic, PhoneCall, Radio, Share2, Square, Zap } from 'lucide-react';
import type { NodeType } from '../../types/flow';

interface NodeToolboxProps {
  onAddNode: (type: NodeType) => void;
  onQuickCall: () => void;
}

const TOOLS: Array<{ type: NodeType; label: string; icon: React.ReactNode; hover: string }> = [
  { type: 'say', label: 'نطق (Say)', icon: <MessageSquare className="w-5 h-5 text-teal-400 mb-1 group-hover:scale-110 transition" />, hover: 'hover:bg-teal-950/40 hover:border-teal-500/50' },
  { type: 'ask', label: 'سؤال (Ask)', icon: <Mic className="w-5 h-5 text-blue-400 mb-1 group-hover:scale-110 transition" />, hover: 'hover:bg-blue-950/40 hover:border-blue-500/50' },
  { type: 'condition', label: 'شرط (Condition)', icon: <Zap className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition" />, hover: 'hover:bg-amber-950/40 hover:border-amber-500/50' },
  { type: 'tool', label: 'أداة (Tool API)', icon: <Database className="w-5 h-5 text-purple-400 mb-1 group-hover:scale-110 transition" />, hover: 'hover:bg-purple-950/40 hover:border-purple-500/50' },
  { type: 'transfer', label: 'تحويل (Transfer)', icon: <Share2 className="w-5 h-5 text-rose-400 mb-1 group-hover:scale-110 transition" />, hover: 'hover:bg-rose-950/40 hover:border-rose-500/50' },
  { type: 'end', label: 'نهاية (End)', icon: <Square className="w-5 h-5 text-slate-400 mb-1 group-hover:scale-110 transition" />, hover: 'hover:bg-slate-700 border-slate-600' }
];

export const NodeToolbox = React.memo(function NodeToolbox({ onAddNode, onQuickCall }: NodeToolboxProps) {
  return (
    <div className="w-64 bg-slate-900/90 backdrop-blur border-l border-slate-800 p-4 flex flex-col gap-4 z-20 shadow-2xl">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">إضافة عقدة جديدة (Add Node)</h3>
        <div className="grid grid-cols-2 gap-2">
          {TOOLS.map(tool => (
            <button
              key={tool.type}
              onClick={() => onAddNode(tool.type)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 border border-slate-700 transition group ${tool.hover}`}
            >
              {tool.icon}
              <span className="text-xs text-slate-300">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-800 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">تعليمات سريعة</h3>
        <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
          <li>اسحب اللوحة لتحريك المساحة.</li>
          <li>اسحب العقد لتغيير مكانها.</li>
          <li>اضغط على أي عقدة لتعديل خصائصها.</li>
          <li>استخدم التوصيلات البرمجية للربط.</li>
        </ul>
      </div>

      <div className="mt-auto bg-gradient-to-br from-teal-900/40 to-slate-900 border border-teal-500/30 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-teal-300">اختبار فوري للسعودية</span>
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
        </div>
        <p className="text-[11px] text-slate-300 mb-3">جرب المحادثة بصوت ريم السعودي الطبيعي (عربي/إنجليزي) المولَّد حصرياً عبر Munsit Cloud API.</p>
        <button
          onClick={onQuickCall}
          className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-900/50 transition"
        >
          <PhoneCall className="w-4 h-4" />
          <span>بدء المكالمة الآن</span>
        </button>
      </div>
    </div>
  );
});
