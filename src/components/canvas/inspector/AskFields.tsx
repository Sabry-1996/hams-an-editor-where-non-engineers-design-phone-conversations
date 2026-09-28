import type { NodeConfig } from '../../../types/flow';
import { Field, inputClass } from '../../ui/Field';

interface AskFieldsProps {
  config: NodeConfig;
  onChange: (patch: Partial<NodeConfig>) => void;
}

export function AskFields({ config, onChange }: AskFieldsProps) {
  return (
    <Field label="تخزين الإجابة في متغير (Expected Variable)">
      <input
        type="text"
        value={config.expectedVariable || ''}
        onChange={e => onChange({ expectedVariable: e.target.value })}
        className={`${inputClass} font-mono text-blue-300`}
        placeholder="مثل: member_id"
      />
    </Field>
  );
}
