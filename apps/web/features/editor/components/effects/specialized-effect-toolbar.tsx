'use client';

import {
  DEFAULT_AUDIO_REPAIR_WORKFLOW,
  DEFAULT_PARAGRAPHIC_EQ_WORKFLOW,
  DEFAULT_SEAMLESS_LOOP_WORKFLOW,
  defaultAutomationWorkflow,
  type AudioRepairWorkflow,
  type AutomationWorkflow,
  type ParagraphicEqualizerWorkflow,
  type SeamlessLoopWorkflow,
  type SpecializedEffectId,
  type SpecializedEffectWorkflow,
} from '@audiomass/audio-engine';
import { useMemo, useState } from 'react';

import type { EditorCopyKey } from '@/lib/editor-copy';

import type { EditorController } from '../../application/editor-controller';
import { EditorDialog } from '../dialogs/editor-dialog';
import styles from '../editor-shell.module.css';
import { AudioRepairForm } from './specialized/audio-repair-form';
import { AutomationForm } from './specialized/automation-form';
import { ParagraphicEqualizerForm } from './specialized/paragraphic-equalizer-form';
import { SeamlessLoopForm } from './specialized/seamless-loop-form';

interface SpecializedEffectToolbarProps {
  controller: EditorController;
  copy: (key: EditorCopyKey) => string;
  onError(message: string | null): void;
  onOpenChange(open: boolean): void;
  open: boolean;
  selected: boolean;
  selectionDuration: number;
  showTrigger?: boolean;
}

function effectName(
  copy: SpecializedEffectToolbarProps['copy'],
  effectId: SpecializedEffectId,
): string {
  if (effectId === 'seamless-loop') return copy('specializedSeamlessLoop');
  if (effectId === 'paragraphic-equalizer') return copy('specializedParagraphicEq');
  if (effectId === 'automation') return copy('specializedAutomation');
  return copy('specializedAudioRepair');
}

export function SpecializedEffectToolbar({
  controller,
  copy,
  onError,
  onOpenChange,
  open,
  selected,
  selectionDuration,
  showTrigger = true,
}: SpecializedEffectToolbarProps) {
  const effectIds = useMemo(
    () =>
      (['seamless-loop', 'paragraphic-equalizer', 'automation', 'audio-repair'] as const).filter(
        (effectId) => controller.supportsSpecializedEffect(effectId),
      ),
    [controller],
  );
  const [effectId, setEffectId] = useState<SpecializedEffectId>(effectIds[0] ?? 'seamless-loop');
  const [seamless, setSeamless] = useState<SeamlessLoopWorkflow>({
    ...DEFAULT_SEAMLESS_LOOP_WORKFLOW,
  });
  const [paragraphic, setParagraphic] = useState<ParagraphicEqualizerWorkflow>({
    ...DEFAULT_PARAGRAPHIC_EQ_WORKFLOW,
    bands: DEFAULT_PARAGRAPHIC_EQ_WORKFLOW.bands.map((band) => ({ ...band })),
  });
  const [automation, setAutomation] = useState<AutomationWorkflow>(() =>
    defaultAutomationWorkflow(selectionDuration),
  );
  const [repair, setRepair] = useState<AudioRepairWorkflow>({
    ...DEFAULT_AUDIO_REPAIR_WORKFLOW,
  });

  const workflow: SpecializedEffectWorkflow =
    effectId === 'seamless-loop'
      ? seamless
      : effectId === 'paragraphic-equalizer'
        ? paragraphic
        : effectId === 'automation'
          ? automation
          : repair;

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

  return (
    <section
      aria-label={copy('specializedEffects')}
      className={showTrigger ? styles.effectToolbar : styles.dialogHost}
    >
      {showTrigger ? (
        <button
          disabled={!selected}
          onClick={() => {
            setAutomation(defaultAutomationWorkflow(selectionDuration));
            onOpenChange(true);
          }}
          type="button"
        >
          {copy('specializedEffects')}
        </button>
      ) : null}

      <EditorDialog
        className={styles.effectDialog}
        closeLabel={copy('close')}
        footer={
          <>
            <button
              onClick={() => void run(() => controller.previewSpecializedEffect(workflow))}
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
                  await controller.applySpecializedEffect(workflow);
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
        title={copy('specializedEffects')}
      >
        <div className={styles.effectForm}>
          <label>
            <span>{copy('effect')}</span>
            <select
              onChange={(event) => setEffectId(event.target.value as SpecializedEffectId)}
              value={effectId}
            >
              {effectIds.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {effectName(copy, candidate)}
                </option>
              ))}
            </select>
          </label>

          {effectId === 'seamless-loop' ? (
            <SeamlessLoopForm copy={copy} onChange={setSeamless} value={seamless} />
          ) : null}
          {effectId === 'paragraphic-equalizer' ? (
            <ParagraphicEqualizerForm copy={copy} onChange={setParagraphic} value={paragraphic} />
          ) : null}
          {effectId === 'automation' ? (
            <AutomationForm copy={copy} onChange={setAutomation} value={automation} />
          ) : null}
          {effectId === 'audio-repair' ? (
            <AudioRepairForm copy={copy} onChange={setRepair} value={repair} />
          ) : null}
        </div>
      </EditorDialog>
    </section>
  );
}
