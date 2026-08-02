import type {
  AudioRepairWorkflow,
  MainsFrequency,
  RepairMode,
  RepairSensitivity,
} from '@audiomass/audio-engine';

import type { EditorCopyKey } from '@/lib/editor-copy';

interface AudioRepairFormProps {
  copy: (key: EditorCopyKey) => string;
  onChange(value: AudioRepairWorkflow): void;
  value: AudioRepairWorkflow;
}

export function AudioRepairForm({ copy, onChange, value }: AudioRepairFormProps) {
  return (
    <>
      <label>
        <span>{copy('specializedRepairMode')}</span>
        <select
          onChange={(event) => onChange({ ...value, mode: event.target.value as RepairMode })}
          value={value.mode}
        >
          <option value="declick">{copy('specializedRepairDeClick')}</option>
          <option value="hum">{copy('specializedRepairHum')}</option>
          <option value="splice">{copy('specializedRepairSplice')}</option>
        </select>
      </label>
      {value.mode === 'hum' ? (
        <label>
          <span>{copy('specializedMainsFrequency')}</span>
          <select
            onChange={(event) => {
              const frequency = event.target.value;
              onChange({
                ...value,
                mainsFrequency: (frequency === 'auto'
                  ? 'auto'
                  : Number(frequency)) as MainsFrequency,
              });
            }}
            value={value.mainsFrequency}
          >
            <option value="auto">{copy('specializedAutoDetect')}</option>
            <option value="50">50 Hz</option>
            <option value="60">60 Hz</option>
          </select>
        </label>
      ) : (
        <label>
          <span>{copy('specializedSensitivity')}</span>
          <select
            onChange={(event) =>
              onChange({ ...value, sensitivity: event.target.value as RepairSensitivity })
            }
            value={value.sensitivity}
          >
            <option value="low">{copy('specializedLow')}</option>
            <option value="medium">{copy('specializedMedium')}</option>
            <option value="high">{copy('specializedHigh')}</option>
          </select>
        </label>
      )}
    </>
  );
}
