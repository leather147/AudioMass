import type {
  ParagraphicEqBand,
  ParagraphicEqBandType,
  ParagraphicEqualizerWorkflow,
} from '@audiomass/audio-engine';

import type { EditorCopyKey } from '@/lib/editor-copy';

import styles from '../../editor-shell.module.css';

interface ParagraphicEqualizerFormProps {
  copy: (key: EditorCopyKey) => string;
  onChange(value: ParagraphicEqualizerWorkflow): void;
  value: ParagraphicEqualizerWorkflow;
}

function nextBandId(bands: readonly ParagraphicEqBand[]): string {
  let sequence = bands.length + 1;
  while (bands.some((band) => band.id === `band-${sequence}`)) sequence += 1;
  return `band-${sequence}`;
}

export function ParagraphicEqualizerForm({ copy, onChange, value }: ParagraphicEqualizerFormProps) {
  const updateBand = (id: string, update: Partial<ParagraphicEqBand>) => {
    onChange({
      ...value,
      bands: value.bands.map((band) => (band.id === id ? { ...band, ...update } : band)),
    });
  };
  const addBand = () => {
    if (value.bands.length >= 24) return;
    onChange({
      ...value,
      bands: [
        ...value.bands,
        {
          enabled: true,
          frequency: 1000,
          gainDb: 0,
          id: nextBandId(value.bands),
          q: 5,
          type: 'peaking',
        },
      ],
    });
  };
  return (
    <fieldset className={styles.specializedList}>
      <legend>{copy('specializedEqBands')}</legend>
      {value.bands.map((band) => (
        <div className={styles.specializedBand} key={band.id}>
          <label>
            <input
              checked={band.enabled}
              onChange={(event) => updateBand(band.id, { enabled: event.target.checked })}
              type="checkbox"
            />
            {copy('specializedEnabled')}
          </label>
          <label>
            <span>{copy('specializedBandType')}</span>
            <select
              onChange={(event) =>
                updateBand(band.id, { type: event.target.value as ParagraphicEqBandType })
              }
              value={band.type}
            >
              <option value="peaking">{copy('specializedPeaking')}</option>
              <option value="highpass">{copy('specializedHighPass')}</option>
              <option value="lowpass">{copy('specializedLowPass')}</option>
            </select>
          </label>
          <label>
            <span>{copy('specializedFrequency')}</span>
            <input
              max={20000}
              min={0}
              onChange={(event) => updateBand(band.id, { frequency: Number(event.target.value) })}
              step={1}
              type="number"
              value={band.frequency}
            />
          </label>
          <label>
            <span>{copy('specializedBandGain')}</span>
            <input
              disabled={band.type !== 'peaking'}
              max={35}
              min={-35}
              onChange={(event) => updateBand(band.id, { gainDb: Number(event.target.value) })}
              step={0.1}
              type="number"
              value={band.gainDb}
            />
          </label>
          <label>
            <span>Q</span>
            <input
              max={20}
              min={0.1}
              onChange={(event) => updateBand(band.id, { q: Number(event.target.value) })}
              step={0.1}
              type="number"
              value={band.q}
            />
          </label>
          <button
            onClick={() =>
              onChange({ ...value, bands: value.bands.filter((item) => item.id !== band.id) })
            }
            type="button"
          >
            {copy('specializedRemoveBand')}
          </button>
        </div>
      ))}
      <button disabled={value.bands.length >= 24} onClick={addBand} type="button">
        {copy('specializedAddBand')}
      </button>
    </fieldset>
  );
}
