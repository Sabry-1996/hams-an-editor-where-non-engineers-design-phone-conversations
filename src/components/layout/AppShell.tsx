import { Suspense, lazy, useCallback, useState } from 'react';
import { useFlow } from '../../context/FlowContext';
import { useI18n } from '../../i18n/I18nContext';
import type { EditorTab } from '../../types/flow';
import { downloadFlowJson, parseFlowJson, readFileAsText } from '../../utils/flowIO';
import { LoadingView } from '../ui/LoadingView';
import { AppHeader } from './AppHeader';

const CanvasView = lazy(() => import('../canvas/CanvasView'));
const SimulatorView = lazy(() => import('../simulator/SimulatorView'));
const DiagnosticsView = lazy(() => import('../diagnostics/DiagnosticsView'));

export function AppShell() {
  const { t, dir } = useI18n();
  const [activeTab, setActiveTab] = useState<EditorTab>('canvas');
  const { flow, diagnostics, canUndo, canRedo, undo, redo, loadFlow } = useFlow();
  const handleExport = useCallback(() => downloadFlowJson(flow), [flow]);
  const handleImportFile = useCallback(async (file: File) => {
    const parsed = parseFlowJson(await readFileAsText(file));
    if (parsed.ok) {
      loadFlow(parsed.flow);
      return;
    }
    if (parsed.reason === 'unknown_schema') {
      alert(t('import_unknown_schema', { version: String(parsed.schemaVersion ?? '?') }));
      return;
    }
    alert(t(parsed.reason === 'invalid_json' ? 'import_invalid_json' : 'import_invalid_shape'));
  }, [loadFlow, t]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans" dir={dir}>
      <AppHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        diagnosticsCount={diagnostics.length}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onExport={handleExport}
        onImportFile={handleImportFile}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <Suspense fallback={<LoadingView />}>
          {activeTab === 'canvas' && <CanvasView onNavigate={setActiveTab} />}
          {activeTab === 'simulator' && <SimulatorView />}
          {activeTab === 'diagnostics' && <DiagnosticsView onNavigate={setActiveTab} />}
        </Suspense>
      </div>
    </div>
  );
}
