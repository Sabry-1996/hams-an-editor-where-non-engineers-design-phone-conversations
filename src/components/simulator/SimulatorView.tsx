import { useSimulator } from '../../context/SimulatorContext';
import { CallControlPanel } from './CallControlPanel';
import { LiveStatePanel } from './LiveStatePanel';
import { TranscriptPanel } from './TranscriptPanel';

export default function SimulatorView() {
  const { simulator } = useSimulator();

  return (
    <div className="flex flex-1 bg-slate-950 p-6 gap-6 overflow-y-auto">
      <div className="w-96 flex flex-col gap-5">
        <CallControlPanel />
        <LiveStatePanel variables={simulator.variables} />
      </div>
      <TranscriptPanel />
    </div>
  );
}
