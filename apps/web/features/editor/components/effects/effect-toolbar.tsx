'use client';

import {
  defaultEffectValues,
  EFFECT_SCHEMAS,
  parseEffectValues,
  type EffectParameter,
  type EffectParameterValue,
  type EffectPreset,
  type EffectSchema,
  type EffectValues,
} from '@audiomass/audio-engine';
import { useMemo, useRef, useState } from 'react';

import type { EditorCopyKey } from '@/lib/editor-copy';

import type { EditorController } from '../../application/editor-controller';
import { BrowserEffectPresetRepository } from '../../infrastructure/browser-effect-preset-repository';
import { EditorDialog } from '../dialogs/editor-dialog';
import styles from '../editor-shell.module.css';

interface EffectToolbarProps {
  controller: EditorController;
  copy: (key: EditorCopyKey) => string;
  onError(message: string | null): void;
  onOpenChange(open: boolean): void;
  open: boolean;
  selected: boolean;
  showTrigger?: boolean;
}

interface ParameterFieldProps {
  label: string;
  onChange(value: EffectParameterValue): void;
  optionLabel(optionId: string, fallback: string): string;
  parameter: EffectParameter;
  value: EffectParameterValue;
}

function ParameterField({ label, onChange, optionLabel, parameter, value }: ParameterFieldProps) {
  if (parameter.kind === 'boolean') {
    return (
      <label className={styles.effectCheckbox}>
        <input
          checked={typeof value === 'boolean' ? value : parameter.defaultValue}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        {label}
      </label>
    );
  }
  if (parameter.kind === 'select') {
    return (
      <label>
        <span>{label}</span>
        <select
          onChange={(event) => onChange(event.target.value)}
          value={typeof value === 'string' ? value : parameter.defaultValue}
        >
          {parameter.options.map((option) => (
            <option key={option.id} value={option.id}>
              {optionLabel(option.id, option.label)}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (parameter.kind === 'number-list') {
    const values = Array.isArray(value) ? value : parameter.defaultValue;
    return (
      <fieldset className={styles.effectNumberList}>
        <legend>{label}</legend>
        {values.map((item, index) => (
          <label key={parameter.itemLabels?.[index] ?? index}>
            <span>{parameter.itemLabels?.[index] ?? index + 1}</span>
            <input
              max={parameter.maximum}
              min={parameter.minimum}
              onChange={(event) => {
                const next = [...values];
                next[index] = Number(event.target.value);
                onChange(next);
              }}
              step={parameter.step}
              type="number"
              value={item}
            />
            {parameter.unit ? <span>{parameter.unit}</span> : null}
          </label>
        ))}
      </fieldset>
    );
  }
  return (
    <label>
      <span>{label}</span>
      <span className={styles.effectNumberInput}>
        <input
          max={parameter.maximum}
          min={parameter.minimum}
          onChange={(event) => onChange(Number(event.target.value))}
          step={parameter.step}
          type="number"
          value={typeof value === 'number' ? value : parameter.defaultValue}
        />
        {parameter.unit ? <span>{parameter.unit}</span> : null}
      </span>
    </label>
  );
}

function effectName(copy: EffectToolbarProps['copy'], schema: EffectSchema): string {
  if (schema.id === 'gain') return copy('effectGain');
  if (schema.id === 'compressor') return copy('effectCompressor');
  if (schema.id === 'normalize') return copy('effectNormalize');
  if (schema.id === 'hard-limiter') return copy('effectHardLimiter');
  if (schema.id === 'delay') return copy('effectDelay');
  if (schema.id === 'distortion') return copy('effectDistortion');
  if (schema.id === 'reverb') return copy('effectReverb');
  if (schema.id === 'graphic-equalizer') return copy('effectGraphicEqualizer');
  return schema.name;
}

function parameterLabel(
  copy: EffectToolbarProps['copy'],
  effectId: string,
  parameter: EffectParameter,
): string {
  if (parameter.id === 'mode') return copy('effectMode');
  if (parameter.id === 'linked') return copy('effectLinked');
  if (parameter.id === 'targetLufs') return copy('effectTargetLufs');
  if (parameter.id === 'peakCeiling') return copy('effectPeakCeiling');
  if (parameter.id === 'threshold') return copy('effectParameterThreshold');
  if (parameter.id === 'knee') return copy('effectParameterKnee');
  if (parameter.id === 'ratio') {
    return effectId === 'hard-limiter'
      ? copy('effectParameterLowHighRatio')
      : copy('effectParameterRatio');
  }
  if (parameter.id === 'attack') return copy('effectParameterAttack');
  if (parameter.id === 'release') return copy('effectParameterRelease');
  if (parameter.id === 'makeup') return copy('effectParameterMakeup');
  if (parameter.id === 'hard') return copy('effectParameterHard');
  if (parameter.id === 'limit') return copy('effectParameterLimit');
  if (parameter.id === 'lookAheadMs') return copy('effectParameterLookAhead');
  if (parameter.id === 'delaySeconds') return copy('effectParameterDelayTime');
  if (parameter.id === 'timeSeconds') return copy('effectParameterTime');
  if (parameter.id === 'feedback') return copy('effectParameterFeedback');
  if (parameter.id === 'mix') return copy('effectParameterWet');
  if (parameter.id === 'decay') return copy('effectParameterDecay');
  if (parameter.id === 'gains') return copy('effectParameterBandGains');
  if (parameter.id === 'amount') {
    return effectId === 'gain' || effectId === 'distortion'
      ? copy('effectGain')
      : copy('effectParameterAmount');
  }
  return parameter.label;
}

function optionLabel(copy: EffectToolbarProps['copy'], optionId: string, fallback: string): string {
  if (optionId === 'peak') return copy('effectModePeak');
  if (optionId === 'rms') return copy('effectModeRms');
  if (optionId === 'lufs') return copy('effectModeLufs');
  return fallback;
}

export function EffectToolbar({
  controller,
  copy,
  onError,
  onOpenChange,
  open,
  selected,
  showTrigger = true,
}: EffectToolbarProps) {
  const schemas = useMemo(
    () => EFFECT_SCHEMAS.filter((schema) => controller.supportsEffect(schema.id)),
    [controller],
  );
  const [effectId, setEffectId] = useState(schemas[0]?.id ?? 'gain');
  const schema = schemas.find((candidate) => candidate.id === effectId) ?? schemas[0]!;
  const [values, setValues] = useState<EffectValues>(() => defaultEffectValues(schema));
  const repositoryRef = useRef<BrowserEffectPresetRepository | null>(null);
  const [customPresets, setCustomPresets] = useState<readonly EffectPreset[]>([]);
  const [presetName, setPresetName] = useState('');

  const openDialog = () => {
    try {
      repositoryRef.current ??= new BrowserEffectPresetRepository();
      setCustomPresets(repositoryRef.current.list(effectId));
    } catch {
      repositoryRef.current = null;
      setCustomPresets([]);
    }
    onOpenChange(true);
  };

  const selectEffect = (nextEffectId: string) => {
    const nextSchema = schemas.find((candidate) => candidate.id === nextEffectId);
    if (!nextSchema) return;
    setEffectId(nextEffectId);
    setValues(defaultEffectValues(nextSchema));
    setCustomPresets(repositoryRef.current?.list(nextEffectId) ?? []);
  };

  const selectPreset = (presetId: string) => {
    const preset = presetId.startsWith('built-in:')
      ? schema.builtInPresets.find((candidate) => candidate.id === presetId.slice(9))
      : customPresets.find((candidate) => candidate.id === presetId.slice(7));
    if (preset) setValues(parseEffectValues(schema, preset.values));
  };

  const run = async (action: () => Promise<void>) => {
    onError(null);
    try {
      await action();
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    }
  };

  const close = () => {
    onOpenChange(false);
    void run(() => controller.cancelEffectPreview());
  };

  const savePreset = () => {
    const repository = repositoryRef.current;
    if (!repository || !presetName.trim()) return;
    try {
      repository.save({ effectId, name: presetName, values });
      setCustomPresets(repository.list(effectId));
      setPresetName('');
      onError(null);
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <section
      aria-label={copy('effects')}
      className={showTrigger ? styles.effectToolbar : styles.dialogHost}
    >
      {showTrigger ? (
        <button disabled={!selected} onClick={openDialog} type="button">
          {copy('effects')}
        </button>
      ) : null}

      <EditorDialog
        className={styles.effectDialog}
        closeLabel={copy('close')}
        footer={
          <>
            <button
              onClick={() => void run(() => controller.previewEffect(effectId, values))}
              type="button"
            >
              {copy('effectPreview')}
            </button>
            <button onClick={() => void run(() => controller.cancelEffectPreview())} type="button">
              {copy('effectCancelPreview')}
            </button>
            <button
              onClick={() =>
                void run(async () => {
                  await controller.applyEffect(effectId, values);
                  onOpenChange(false);
                })
              }
              type="button"
            >
              {copy('effectApply')}
            </button>
          </>
        }
        onClose={close}
        open={open}
        title={copy('effects')}
      >
        <div className={styles.effectForm}>
          <label>
            <span>{copy('effect')}</span>
            <select onChange={(event) => selectEffect(event.target.value)} value={effectId}>
              {schemas.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {effectName(copy, candidate)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>{copy('effectBuiltInPreset')}</span>
            <select defaultValue="" onChange={(event) => selectPreset(event.target.value)}>
              <option disabled value="">
                —
              </option>
              {schema.builtInPresets.map((preset) => (
                <option key={`built-in:${preset.id}`} value={`built-in:${preset.id}`}>
                  {preset.name}
                </option>
              ))}
              {customPresets.map((preset) => (
                <option key={`custom:${preset.id}`} value={`custom:${preset.id}`}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>

          {schema.parameters.map((parameter) => (
            <ParameterField
              key={parameter.id}
              label={parameterLabel(copy, schema.id, parameter)}
              onChange={(value) => setValues((current) => ({ ...current, [parameter.id]: value }))}
              optionLabel={(id, fallback) => optionLabel(copy, id, fallback)}
              parameter={parameter}
              value={values[parameter.id] ?? parameter.defaultValue}
            />
          ))}

          <div className={styles.effectPresetForm}>
            <label>
              <span>{copy('effectPresetName')}</span>
              <input
                maxLength={16}
                onChange={(event) => setPresetName(event.target.value)}
                value={presetName}
              />
            </label>
            <button disabled={!presetName.trim()} onClick={savePreset} type="button">
              {copy('effectSavePreset')}
            </button>
          </div>
        </div>
      </EditorDialog>
    </section>
  );
}
