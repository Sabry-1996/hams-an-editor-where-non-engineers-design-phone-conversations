import type { NodeConfig } from '../../../types/flow';
import { Field, inputClass, textareaClass } from '../../ui/Field';

interface ToolFieldsProps {
  config: NodeConfig;
  onChange: (patch: Partial<NodeConfig>) => void;
}

export function ToolFields({ config, onChange }: ToolFieldsProps) {
  return (
    <>
      <Field label="اسم الأداة أو الـ API">
        <input
          type="text"
          value={config.toolName || ''}
          onChange={e => onChange({ toolName: e.target.value })}
          className={`${inputClass} font-mono text-purple-300`}
        />
      </Field>
      <Field label="معاملات الأداة (JSON Parameters)" hint={<span className="text-teal-400">يدعم المتغيرات</span>}>
        <textarea
          rows={3}
          value={config.toolParams || ''}
          onChange={e => onChange({ toolParams: e.target.value })}
          className={`${textareaClass} font-mono text-purple-200`}
          dir="ltr"
        />
      </Field>
    </>
  );
}
