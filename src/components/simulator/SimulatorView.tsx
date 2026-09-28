import { useSimulator } from '../../context/SimulatorContext';
import { CallControlPanel } from './CallControlPanel';
import { LiveStatePanel } from './LiveStatePanel';
import { TranscriptPanel } from './TranscriptPanel';

export default function SimulatorView() {
  const { simulator } = useSimulator();

  return (
    <div className="flex min-h-0 flex-1 gap-6 overflow-hidden bg-surface p-6">
      <div className="flex w-96 shrink-0 flex-col gap-5 overflow-y-auto">
        <CallControlPanel />
        <LiveStatePanel variables={simulator.variables} />
      </div>
      <TranscriptPanel />
    </div>
  );
}
