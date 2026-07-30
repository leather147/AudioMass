import { describe, expect, it } from 'vitest';

import { executeSpecializedEffectEdit } from '@audio-engine/application/specialized-effect';
import { createEditorDocument } from '@audio-engine/domain/editor-document';
import { createAudioMarker } from '@audio-engine/domain/markers';
import { processAudioRepair } from '@audio-engine/effects/specialized/audio-repair';
import { automationValueAt, processAutomation } from '@audio-engine/effects/specialized/automation';
import { parseSpecializedEffectWorkflow } from '@audio-engine/effects/specialized/models';
import { processParagraphicEqualizer } from '@audio-engine/effects/specialized/paragraphic-equalizer';
import { processSeamlessLoop } from '@audio-engine/effects/specialized/seamless-loop';
import type { PcmAudio } from '@audio-engine/types';

function mono(samples: readonly number[], sampleRate = 1000): PcmAudio {
  return { channels: [Float32Array.from(samples)], sampleRate };
}

function rms(samples: Float32Array): number {
  return Math.sqrt(
    samples.reduce((energy, sample) => energy + sample * sample, 0) / Math.max(1, samples.length),
  );
}

describe('specialized effect workflow models', () => {
  it('validates discriminated workflows and sorts automation points', () => {
    const workflow = parseSpecializedEffectWorkflow({
      kind: 'automation',
      points: [
        { timeSeconds: 1, value: 0 },
        { timeSeconds: 0, value: 1 },
      ],
      target: 'gain',
    });

    expect(workflow.kind).toBe('automation');
    if (workflow.kind === 'automation') expect(workflow.points[0]?.timeSeconds).toBe(0);
    expect(() =>
      parseSpecializedEffectWorkflow({
        kind: 'automation',
        points: [
          { timeSeconds: 0, value: 1 },
          { timeSeconds: 0, value: 0 },
        ],
        target: 'gain',
      }),
    ).toThrow(/unique/i);
  });
});

describe('seamless-loop workflow', () => {
  it('retains the legacy equal-power crossfade and repeat mapping', () => {
    const source = mono([1, 2, 3, 4, 5, 6, 7, 8]);
    const result = processSeamlessLoop(source, {
      crossfadeMs: 2,
      kind: 'seamless-loop',
      repeat: 2,
      snapZeroCrossing: false,
      trimSilence: false,
    });

    expect(result.crossfadeFrames).toBe(2);
    expect(Array.from(result.audio.channels[0] ?? [])).toEqual([
      7, 2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6,
    ]);
    expect(Array.from(source.channels[0] ?? [])).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('updates duration, selection, and marker time in one explicit transform', () => {
    const audio = mono(new Array<number>(24).fill(0.25), 8);
    const document = {
      ...createEditorDocument('markers.wav'),
      markers: [
        createAudioMarker({ id: 'before', time: 0.5 }, 3, 'before', 0),
        createAudioMarker({ id: 'inside', time: 1.25 }, 3, 'inside', 1),
        createAudioMarker({ id: 'after', time: 2.5 }, 3, 'after', 2),
      ],
      selection: { end: 2, start: 1 },
    };
    const result = executeSpecializedEffectEdit(
      { audio, document },
      {
        crossfadeMs: 0,
        kind: 'seamless-loop',
        repeat: 2,
        snapZeroCrossing: false,
        trimSilence: false,
      },
    );

    expect(result.audio.channels[0]).toHaveLength(32);
    expect(result.document.selection).toEqual({ end: 3, start: 1 });
    expect(result.document.markers.map((marker) => [marker.id, marker.time])).toEqual([
      ['before', 0.5],
      ['inside', 1.25],
      ['after', 3.5],
    ]);
  });
});

describe('paragraphic EQ and automation workflows', () => {
  it('keeps an empty paragraphic EQ bit-identical and attenuates low-frequency input', () => {
    const sampleRate = 4000;
    const source = mono(
      Array.from({ length: sampleRate }, (_, frame) =>
        Math.sin((2 * Math.PI * 50 * frame) / sampleRate),
      ),
      sampleRate,
    );
    const reset = processParagraphicEqualizer(source, {
      bands: [],
      kind: 'paragraphic-equalizer',
    });
    const filtered = processParagraphicEqualizer(source, {
      bands: [{ enabled: true, frequency: 300, gainDb: 0, id: 'cut', q: 0.7, type: 'highpass' }],
      kind: 'paragraphic-equalizer',
    });

    expect(reset.channels[0]).toEqual(source.channels[0]);
    expect(rms(filtered.channels[0]!)).toBeLessThan(rms(source.channels[0]!) * 0.1);
  });

  it('evaluates sorted piecewise-linear automation with held boundary values', () => {
    const points = [
      { timeSeconds: 0, value: 0 },
      { timeSeconds: 1, value: 1 },
    ];
    const output = processAutomation(mono([1, 1, 1, 1, 1], 4), {
      kind: 'automation',
      points,
      target: 'gain',
    });

    expect(automationValueAt(points, -1)).toBe(0);
    expect(automationValueAt(points, 2)).toBe(1);
    expect(Array.from(output.channels[0] ?? [])).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });
});

describe('audio repair workflow', () => {
  it('detects and repairs short bipolar clicks without mutating the source', () => {
    const samples = new Array<number>(512).fill(0);
    samples[200] = 1;
    samples[201] = -1;
    samples[202] = 0;
    const source = mono(samples);
    const result = processAudioRepair(source, {
      kind: 'audio-repair',
      mainsFrequency: 'auto',
      mode: 'declick',
      sensitivity: 'high',
    });

    expect(result.detections).toBeGreaterThan(0);
    expect(result.audio.channels[0]?.[200]).not.toBe(1);
    expect(source.channels[0]?.[200]).toBe(1);
  });

  it('detects mains frequency and notches eight harmonics deterministically', () => {
    const sampleRate = 1000;
    const source = mono(
      Array.from({ length: 2000 }, (_, frame) => Math.sin((2 * Math.PI * 60 * frame) / sampleRate)),
      sampleRate,
    );
    const result = processAudioRepair(source, {
      kind: 'audio-repair',
      mainsFrequency: 'auto',
      mode: 'hum',
      sensitivity: 'medium',
    });

    expect(result.humFrequency).toBeCloseTo(60, 0);
    expect(rms(result.audio.channels[0]!)).toBeLessThan(rms(source.channels[0]!) * 0.5);
    expect(result.audio.channels[0]?.every(Number.isFinite)).toBe(true);
  });

  it('smooths isolated DC-offset splices with the characterized thresholds', () => {
    const sampleRate = 1000;
    const samples = Array.from({ length: 5000 }, (_, frame) => {
      const signal = Math.sin((2 * Math.PI * 17 * frame) / sampleRate) * 0.1;
      return frame >= 2500 ? signal + 0.2 : signal;
    });
    const result = processAudioRepair(mono(samples, sampleRate), {
      kind: 'audio-repair',
      mainsFrequency: 'auto',
      mode: 'splice',
      sensitivity: 'high',
    });

    expect(result.detections).toBeGreaterThan(0);
    expect(result.audio.channels[0]?.every(Number.isFinite)).toBe(true);
  });
});
