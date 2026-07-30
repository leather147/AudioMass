import {
  createSilence,
  extractPcmRange,
  insertPcm,
  overwritePcmRange,
  removePcmRange,
} from '../dsp/editing.js';
import { clonePcm, pcmDuration } from '../dsp/pcm.js';
import type { EditorDocument, EditorTimeRange } from '../domain/editor-document.js';
import {
  insertMarkerTime,
  removeMarkerTime,
  replaceMarkerTime,
  trimMarkerTime,
} from '../domain/marker-editing.js';
import type { PcmAudio } from '../types.js';

export type SingleTrackEditCommand =
  | { name: 'edit.copy' }
  | { name: 'edit.cut' }
  | { name: 'edit.delete' }
  | { duration: number; name: 'edit.insert-silence' }
  | { name: 'edit.paste' }
  | { name: 'edit.select-all' }
  | { name: 'edit.trim' };

export interface SingleTrackEditorState {
  audio: PcmAudio;
  document: EditorDocument;
}

export interface SingleTrackEditContext {
  clipboard: PcmAudio | null;
  cursor: number;
}

export interface SingleTrackEditResult {
  audioChanged: boolean;
  clipboard: PcmAudio | null;
  position?: number;
  state: SingleTrackEditorState;
}

function unchanged(
  state: SingleTrackEditorState,
  clipboard: PcmAudio | null,
): SingleTrackEditResult {
  return { audioChanged: false, clipboard, state };
}

function withDocument(
  state: SingleTrackEditorState,
  document: EditorDocument,
  clipboard: PcmAudio | null,
): SingleTrackEditResult {
  return { audioChanged: false, clipboard, state: { ...state, document } };
}

function nonEmpty(audio: PcmAudio): PcmAudio {
  if ((audio.channels[0]?.length ?? 0) > 0) return audio;
  return createSilence(audio.channels.length, 1, audio.sampleRate);
}

function selection(state: SingleTrackEditorState): EditorTimeRange | null {
  return state.document.selection;
}

export function executeSingleTrackEdit(
  state: SingleTrackEditorState,
  command: SingleTrackEditCommand,
  context: SingleTrackEditContext,
): SingleTrackEditResult {
  const selected = selection(state);
  switch (command.name) {
    case 'edit.copy':
      return selected
        ? unchanged(state, extractPcmRange(state.audio, selected))
        : unchanged(state, context.clipboard);
    case 'edit.cut': {
      if (!selected) return unchanged(state, context.clipboard);
      const audio = nonEmpty(removePcmRange(state.audio, selected));
      return {
        audioChanged: true,
        clipboard: extractPcmRange(state.audio, selected),
        position: selected.start,
        state: {
          audio,
          document: {
            ...state.document,
            markers: removeMarkerTime(state.document.markers, selected),
            selection: null,
          },
        },
      };
    }
    case 'edit.delete': {
      if (!selected) return unchanged(state, context.clipboard);
      const audio = nonEmpty(removePcmRange(state.audio, selected));
      return {
        audioChanged: true,
        clipboard: context.clipboard,
        position: selected.start,
        state: {
          audio,
          document: {
            ...state.document,
            markers: removeMarkerTime(state.document.markers, selected),
            selection: null,
          },
        },
      };
    }
    case 'edit.insert-silence': {
      if (!Number.isFinite(command.duration) || command.duration <= 0 || command.duration > 3600) {
        throw new RangeError('Inserted silence duration must be within (0, 3600] seconds.');
      }
      const position = Math.min(Math.max(0, context.cursor), pcmDuration(state.audio));
      const frames = Math.max(1, Math.round(command.duration * state.audio.sampleRate));
      const silence = createSilence(state.audio.channels.length, frames, state.audio.sampleRate);
      const duration = frames / state.audio.sampleRate;
      return {
        audioChanged: true,
        clipboard: context.clipboard,
        position,
        state: {
          audio: insertPcm(state.audio, position, silence),
          document: {
            ...state.document,
            markers: insertMarkerTime(state.document.markers, position, duration),
            selection: { end: position + duration, start: position },
          },
        },
      };
    }
    case 'edit.paste': {
      if (!context.clipboard) return unchanged(state, context.clipboard);
      const clipboard = clonePcm(context.clipboard);
      const duration = pcmDuration(clipboard);
      const position = selected
        ? selected.start
        : Math.min(Math.max(0, context.cursor), pcmDuration(state.audio));
      const audio = selected
        ? overwritePcmRange(state.audio, selected, clipboard)
        : insertPcm(state.audio, position, clipboard);
      const markers = selected
        ? replaceMarkerTime(state.document.markers, selected, duration)
        : insertMarkerTime(state.document.markers, position, duration);
      return {
        audioChanged: true,
        clipboard: context.clipboard,
        position,
        state: {
          audio,
          document: {
            ...state.document,
            markers,
            selection: { end: position + duration, start: position },
          },
        },
      };
    }
    case 'edit.select-all': {
      const duration = pcmDuration(state.audio);
      return withDocument(
        state,
        { ...state.document, selection: duration > 0 ? { end: duration, start: 0 } : null },
        context.clipboard,
      );
    }
    case 'edit.trim': {
      if (!selected) return unchanged(state, context.clipboard);
      return {
        audioChanged: true,
        clipboard: context.clipboard,
        position: 0,
        state: {
          audio: nonEmpty(extractPcmRange(state.audio, selected)),
          document: {
            ...state.document,
            markers: trimMarkerTime(state.document.markers, selected),
            selection: null,
          },
        },
      };
    }
  }
}
