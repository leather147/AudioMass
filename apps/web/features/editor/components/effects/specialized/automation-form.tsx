import type { AutomationPoint, AutomationWorkflow } from '@audiomass/audio-engine';

import type { EditorCopyKey } from '@/lib/editor-copy';

import styles from '../../editor-shell.module.css';

interface AutomationFormProps {
  copy: (key: EditorCopyKey) => string;
  onChange(value: AutomationWorkflow): void;
  value: AutomationWorkflow;
}

export function AutomationForm({ copy, onChange, value }: AutomationFormProps) {
  const updatePoint = (index: number, update: Partial<AutomationPoint>) => {
    const points = value.points.map((point, pointIndex) =>
      pointIndex === index ? { ...point, ...update } : point,
    );
    onChange({ ...value, points });
  };
  const addPoint = () => {
    if (value.points.length >= 64) return;
    const first = value.points[0]!;
    const last = value.points.at(-1)!;
    onChange({
      ...value,
      points: [
        ...value.points,
        {
          timeSeconds: (first.timeSeconds + last.timeSeconds) / 2,
          value: (first.value + last.value) / 2,
        },
      ].sort((left, right) => left.timeSeconds - right.timeSeconds),
    });
  };
  return (
    <fieldset className={styles.specializedList}>
      <legend>{copy('specializedAutomationPoints')}</legend>
      {value.points.map((point, index) => (
        <div className={styles.specializedRow} key={`${index}-${point.timeSeconds}`}>
          <label>
            <span>{copy('specializedTimeSeconds')}</span>
            <input
              min={0}
              onChange={(event) => updatePoint(index, { timeSeconds: Number(event.target.value) })}
              step={0.001}
              type="number"
              value={point.timeSeconds}
            />
          </label>
          <label>
            <span>{copy('specializedGainValue')}</span>
            <input
              max={2.5}
              min={0}
              onChange={(event) => updatePoint(index, { value: Number(event.target.value) })}
              step={0.01}
              type="number"
              value={point.value}
            />
          </label>
          <button
            disabled={value.points.length <= 2}
            onClick={() =>
              onChange({ ...value, points: value.points.filter((_, item) => item !== index) })
            }
            type="button"
          >
            {copy('specializedRemovePoint')}
          </button>
        </div>
      ))}
      <button disabled={value.points.length >= 64} onClick={addPoint} type="button">
        {copy('specializedAddPoint')}
      </button>
    </fieldset>
  );
}
