import type { EditorDocument, EditorTimeRange } from '../domain/editor-document.js';
import { sortAudioMarkers, type AudioMarker } from '../domain/markers.js';
import { extractPcmRange, overwritePcmRange } from '../dsp/editing.js';
import { assertValidPcm } from '../dsp/pcm.js';
import { processAudioRepair, type AudioRepairResult } from '../effects/specialized/audio-repair.js';
import { processAutomation } from '../effects/specialized/automation.js';
import {
  parseSpecializedEffectWorkflow,
  type SpecializedEffectWorkflow,
} from '../effects/specialized/models.js';
import { processParagraphicEqualizer } from '../effects/specialized/paragraphic-equalizer.js';
import {
  processSeamlessLoop,
  type SeamlessLoopResult,
} from '../effects/specialized/seamless-loop.js';
import type { PcmAudio } from '../types.js';

export interface PreviewSpecializedEffectCommand {
  name: 'specialized-effect.preview';
  workflow: SpecializedEffectWorkflow;
}

export interface ApplySpecializedEffectCommand {
  name: 'specialized-effect.apply';
  workflow: SpecializedEffectWorkflow;
}

export type SpecializedEffectCommand =
  ApplySpecializedEffectCommand | PreviewSpecializedEffectCommand;

export type SpecializedEffectMetadata =
  | {
      detections: number;
      humFrequency: number | null;
      kind: 'audio-repair';
    }
  | { kind: 'automation' }
  | { bandCount: number; kind: 'paragraphic-equalizer' }
  | {
      crossfadeFrames: number;
      kind: 'seamless-loop';
      loopFrames: number;
      outputFrames: number;
      repeat: number;
      sourceEndFrame: number;
      sourceStartFrame: number;
    };

export interface SpecializedEffectEditorState {
  audio: PcmAudio;
  document: EditorDocument;
}

export interface SpecializedEffectEditResult extends SpecializedEffectEditorState {
  metadata: SpecializedEffectMetadata;
}

function transformSeamlessMarkers(
  markers: readonly AudioMarker[],
  selection: EditorTimeRange,
  sampleRate: number,
  result: SeamlessLoopResult,
): readonly AudioMarker[] {
  const replacementDuration = result.outputFrames / sampleRate;
  const selectionDuration = selection.end - selection.start;
  const delta = replacementDuration - selectionDuration;
  return sortAudioMarkers(
    markers.map((marker) => {
      if (marker.time < selection.start) return marker;
      if (marker.time >= selection.end) return { ...marker, time: marker.time + delta };
      const relativeFrame = Math.round((marker.time - selection.start) * sampleRate);
      const mappedFrame = Math.max(
        0,
        Math.min(result.loopFrames, relativeFrame - result.sourceStartFrame),
      );
      return { ...marker, time: selection.start + mappedFrame / sampleRate };
    }),
  );
}

function executeSeamless(
  state: SpecializedEffectEditorState,
  selection: EditorTimeRange,
  workflow: Extract<SpecializedEffectWorkflow, { kind: 'seamless-loop' }>,
): SpecializedEffectEditResult {
  const result = processSeamlessLoop(extractPcmRange(state.audio, selection), workflow);
  const replacementDuration = result.outputFrames / state.audio.sampleRate;
  return {
    audio: overwritePcmRange(state.audio, selection, result.audio),
    document: {
      ...state.document,
      markers: transformSeamlessMarkers(
        state.document.markers,
        selection,
        state.audio.sampleRate,
        result,
      ),
      selection: { end: selection.start + replacementDuration, start: selection.start },
    },
    metadata: {
      crossfadeFrames: result.crossfadeFrames,
      kind: 'seamless-loop',
      loopFrames: result.loopFrames,
      outputFrames: result.outputFrames,
      repeat: result.repeat,
      sourceEndFrame: result.sourceEndFrame,
      sourceStartFrame: result.sourceStartFrame,
    },
  };
}

export function executeSpecializedEffectEdit(
  state: SpecializedEffectEditorState,
  input: SpecializedEffectWorkflow,
): SpecializedEffectEditResult {
  const selection = state.document.selection;
  if (!selection) throw new RangeError('Select an audio range before applying an effect.');
  const workflow = parseSpecializedEffectWorkflow(input);
  if (workflow.kind === 'seamless-loop') return executeSeamless(state, selection, workflow);
  const selected = extractPcmRange(state.audio, selection);
  let processed: PcmAudio;
  let metadata: SpecializedEffectMetadata;
  if (workflow.kind === 'paragraphic-equalizer') {
    processed = processParagraphicEqualizer(selected, workflow);
    metadata = {
      bandCount: workflow.bands.filter((band) => band.enabled).length,
      kind: 'paragraphic-equalizer',
    };
  } else if (workflow.kind === 'automation') {
    processed = processAutomation(selected, workflow);
    metadata = { kind: 'automation' };
  } else {
    const repaired: AudioRepairResult = processAudioRepair(selected, workflow);
    processed = repaired.audio;
    metadata = {
      detections: repaired.detections,
      humFrequency: repaired.humFrequency,
      kind: 'audio-repair',
    };
  }
  assertValidPcm(processed);
  return {
    audio: overwritePcmRange(state.audio, selection, processed),
    document: state.document,
    metadata,
  };
}
