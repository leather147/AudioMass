import { describe, expect, it } from 'vitest';

import {
  createEditorDocument,
  executeSingleTrackEdit,
  type AudioMarker,
  type EditorTimeRange,
  type PcmAudio,
  type SingleTrackEditorState,
} from '../src/index.js';

function audio(values = [0, 1, 2, 3, 4, 5, 6, 7]): PcmAudio {
  return { channels: [Float32Array.from(values)], sampleRate: 4 };
}

function marker(id: string, time: number): AudioMarker {
  return { color: '#fff', id, loop: false, name: id, time };
}

function state(selection: EditorTimeRange | null = { end: 1, start: 0.5 }): SingleTrackEditorState {
  return {
    audio: audio(),
    document: {
      ...createEditorDocument('voice.wav'),
      markers: [marker('before', 0.25), marker('inside', 0.75), marker('after', 1.5)],
      selection,
    },
  };
}

describe('single-track edit commands', () => {
  it('cuts an owned selection and shifts markers after the removed range', () => {
    const source = state();
    const result = executeSingleTrackEdit(
      source,
      { name: 'edit.cut' },
      {
        clipboard: null,
        cursor: 0,
      },
    );

    expect(Array.from(result.clipboard!.channels[0]!)).toEqual([2, 3]);
    expect(Array.from(result.state.audio.channels[0]!)).toEqual([0, 1, 4, 5, 6, 7]);
    expect(result.state.document.selection).toBeNull();
    expect(result.state.document.markers.map(({ id, time }) => [id, time])).toEqual([
      ['before', 0.25],
      ['after', 1],
    ]);
    expect(Array.from(source.audio.channels[0]!)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('replaces a selection from the clipboard and records the pasted range', () => {
    const source = state({ end: 1.5, start: 0.5 });
    const clipboard = audio([9, 8]);
    const result = executeSingleTrackEdit(
      source,
      { name: 'edit.paste' },
      {
        clipboard,
        cursor: 0,
      },
    );

    expect(Array.from(result.state.audio.channels[0]!)).toEqual([0, 1, 9, 8, 6, 7]);
    expect(result.state.document.selection).toEqual({ end: 1, start: 0.5 });
    expect(result.state.document.markers.map(({ id, time }) => [id, time])).toEqual([
      ['before', 0.25],
      ['after', 1],
    ]);
    expect(result.clipboard).toBe(clipboard);
  });

  it('inserts sample-aligned silence at the cursor without moving earlier markers', () => {
    const result = executeSingleTrackEdit(
      state(null),
      { duration: 0.5, name: 'edit.insert-silence' },
      { clipboard: null, cursor: 0.5 },
    );

    expect(Array.from(result.state.audio.channels[0]!)).toEqual([0, 1, 0, 0, 2, 3, 4, 5, 6, 7]);
    expect(result.state.document.selection).toEqual({ end: 1, start: 0.5 });
    expect(result.state.document.markers.map(({ id, time }) => [id, time])).toEqual([
      ['before', 0.25],
      ['inside', 1.25],
      ['after', 2],
    ]);
  });

  it('trims audio and marker time to the selected range', () => {
    const result = executeSingleTrackEdit(
      state({ end: 1.5, start: 0.5 }),
      { name: 'edit.trim' },
      { clipboard: null, cursor: 0 },
    );

    expect(Array.from(result.state.audio.channels[0]!)).toEqual([2, 3, 4, 5]);
    expect(result.state.document.markers.map(({ id, time }) => [id, time])).toEqual([
      ['inside', 0.25],
      ['after', 1],
    ]);
    expect(result.position).toBe(0);
  });

  it('keeps a valid one-frame document after deleting the complete buffer', () => {
    const result = executeSingleTrackEdit(
      state({ end: 2, start: 0 }),
      { name: 'edit.delete' },
      { clipboard: null, cursor: 0 },
    );

    expect(Array.from(result.state.audio.channels[0]!)).toEqual([0]);
    expect(result.state.document.markers).toEqual([]);
  });

  it('selects all and rejects unbounded silence requests', () => {
    expect(
      executeSingleTrackEdit(
        state(null),
        { name: 'edit.select-all' },
        {
          clipboard: null,
          cursor: 0,
        },
      ).state.document.selection,
    ).toEqual({ end: 2, start: 0 });
    expect(() =>
      executeSingleTrackEdit(
        state(null),
        { duration: 3601, name: 'edit.insert-silence' },
        { clipboard: null, cursor: 0 },
      ),
    ).toThrow('within (0, 3600]');
  });
});
