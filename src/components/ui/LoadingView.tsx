import { Activity } from 'lucide-react';

export function LoadingView() {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-950 text-slate-500 gap-3">
      <Activity className="w-5 h-5 animate-pulse text-teal-500" />
      <span className="text-sm">جاري التحميل...</span>
    </div>
  );
}
