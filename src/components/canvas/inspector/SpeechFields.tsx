import type { NodeConfig } from '../../../types/flow';
import { Field, textareaClass } from '../../ui/Field';

interface SpeechFieldsProps {
  config: NodeConfig;
  onChange: (patch: Partial<NodeConfig>) => void;
}

export function SpeechFields({ config, onChange }: SpeechFieldsProps) {
  return (
    <>
      <Field label="النص المنطوق بالعربية (Arabic Speech)" hint={<span className="text-teal-400">لهجة سعودية طبيعية</span>}>
        <textarea
          rows={3}
          value={config.speechAr || ''}
          onChange={e => onChange({ speechAr: e.target.value })}
          className={textareaClass}
          dir="rtl"
          placeholder="اكتب النص بالعربي..."
        />
      </Field>
      <Field label="النص المنطوق بالإنجليزية (English Speech)" hint={<span className="text-blue-400">Code-switching</span>}>
        <textarea
          rows={3}
          value={config.speechEn || ''}
          onChange={e => onChange({ speechEn: e.target.value })}
          className={textareaClass}
          dir="ltr"
          placeholder="Type English speech..."
        />
      </Field>
    </>
  );
}
