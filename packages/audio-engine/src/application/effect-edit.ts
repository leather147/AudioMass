import type { EditorDocument } from '../domain/editor-document.js';
import { extractPcmRange, overwritePcmRange } from '../dsp/editing.js';
import type { EffectProcessorRegistry } from '../effects/processing.js';
import type { EffectValues } from '../effects/schema.js';
import type { PcmAudio } from '../types.js';

export interface ApplyEffectCommand {
  effectId: string;
  name: 'effect.apply';
  values: EffectValues;
}

export interface PreviewEffectCommand {
  effectId: string;
  name: 'effect.preview';
  values: EffectValues;
}

export interface CancelEffectPreviewCommand {
  name: 'effect.preview.cancel';
}

export type EffectCommand = ApplyEffectCommand | CancelEffectPreviewCommand | PreviewEffectCommand;

export interface EffectEditorState {
  audio: PcmAudio;
  document: EditorDocument;
}

export function executeEffectEdit(
  state: EffectEditorState,
  command: ApplyEffectCommand | PreviewEffectCommand,
  processors: EffectProcessorRegistry,
): EffectEditorState {
  const range = state.document.selection;
  if (!range) throw new RangeError('Select an audio range before applying an effect.');
  const selected = extractPcmRange(state.audio, range);
  const processed = processors.apply(selected, command.effectId, command.values);
  if ((processed.channels[0]?.length ?? 0) !== (selected.channels[0]?.length ?? 0)) {
    throw new RangeError('This effect changes duration and requires a specialized workflow.');
  }
  return {
    audio: overwritePcmRange(state.audio, range, processed),
    document: state.document,
  };
}
