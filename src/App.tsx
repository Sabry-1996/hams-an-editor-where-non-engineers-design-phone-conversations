import { I18nProvider } from './i18n/I18nContext';
import { AppShell } from './components/layout/AppShell';
import { FlowProvider } from './context/FlowContext';
import { SimulatorProvider } from './context/SimulatorContext';
import { VoiceSettingsProvider } from './context/VoiceSettingsContext';

export default function App() {
  return (
    <I18nProvider>
      <FlowProvider>
        <VoiceSettingsProvider>
          <SimulatorProvider>
            <AppShell />
          </SimulatorProvider>
        </VoiceSettingsProvider>
      </FlowProvider>
    </I18nProvider>
  );
}
