import type { SeamlessLoopWorkflow } from '@audiomass/audio-engine';

import type { EditorCopyKey } from '@/lib/editor-copy';

interface SeamlessLoopFormProps {
  copy: (key: EditorCopyKey) => string;
  onChange(value: SeamlessLoopWorkflow): void;
  value: SeamlessLoopWorkflow;
}

export function SeamlessLoopForm({ copy, onChange, value }: SeamlessLoopFormProps) {
  return (
    <>
      <label>
        <span>{copy('specializedCrossfade')}</span>
        <input
          max={500}
          min={0}
          onChange={(event) => onChange({ ...value, crossfadeMs: Number(event.target.value) })}
          step={1}
          type="number"
          value={value.crossfadeMs}
        />
      </label>
      <label>
        <span>{copy('specializedRepeat')}</span>
        <input
          max={64}
          min={1}
          onChange={(event) => onChange({ ...value, repeat: Number(event.target.value) })}
          step={1}
          type="number"
          value={value.repeat}
        />
      </label>
      <label>
        <input
          checked={value.trimSilence}
          onChange={(event) => onChange({ ...value, trimSilence: event.target.checked })}
          type="checkbox"
        />
        {copy('specializedTrimSilence')}
      </label>
      <label>
        <input
          checked={value.snapZeroCrossing}
          onChange={(event) => onChange({ ...value, snapZeroCrossing: event.target.checked })}
          type="checkbox"
        />
        {copy('specializedSnapZero')}
      </label>
    </>
  );
}
