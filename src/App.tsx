import { AppShell } from './components/layout/AppShell';
import { FlowProvider } from './context/FlowContext';
import { SimulatorProvider } from './context/SimulatorContext';
import { VoiceSettingsProvider } from './context/VoiceSettingsContext';

export default function App() {
  return (
    <FlowProvider>
      <VoiceSettingsProvider>
        <SimulatorProvider>
          <AppShell />
        </SimulatorProvider>
      </VoiceSettingsProvider>
    </FlowProvider>
  );
}
