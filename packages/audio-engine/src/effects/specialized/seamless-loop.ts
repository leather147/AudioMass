import { assertValidPcm } from '../../dsp/pcm.js';
import type { PcmAudio } from '../../types.js';
import type { SeamlessLoopWorkflow } from './models.js';

export interface SeamlessLoopResult {
  audio: PcmAudio;
  crossfadeFrames: number;
  loopFrames: number;
  outputFrames: number;
  repeat: number;
  sourceEndFrame: number;
  sourceStartFrame: number;
}

function findZero(
  data: Float32Array,
  start: number,
  direction: -1 | 1,
  maximum: number,
  slope: number,
): number {
  let any = -1;
  let index = start;
  for (let offset = 0; offset < maximum; offset += 1, index += direction) {
    if (index < 1 || index >= data.length - 1) break;
    if (
      ((data[index - 1] ?? 0) <= 0 && (data[index] ?? 0) >= 0) ||
      ((data[index - 1] ?? 0) >= 0 && (data[index] ?? 0) <= 0)
    ) {
      if (any < 0) any = index;
      if (!slope || ((data[index + 1] ?? 0) - (data[index - 1] ?? 0)) * slope > 0) {
        return index;
      }
    }
  }
  return any;
}

function loopBounds(audio: PcmAudio, workflow: SeamlessLoopWorkflow): [number, number] {
  const data = audio.channels[0]!;
  let start = 0;
  let end = data.length;
  if (workflow.trimSilence) {
    const pad = Math.trunc(audio.sampleRate / 1000);
    while (start < end - 8 && Math.abs(data[start] ?? 0) < 0.0007) start += 1;
    while (end > start + 8 && Math.abs(data[end - 1] ?? 0) < 0.0007) end -= 1;
    if (end > start + 8) {
      start = Math.max(0, start - pad);
      end = Math.min(data.length, end + pad);
    } else {
      start = 0;
      end = data.length;
    }
  }
  const maximum = Math.min(Math.trunc(audio.sampleRate / 100), Math.trunc((end - start) / 8));
  if (workflow.snapZeroCrossing && maximum > 2) {
    const first = findZero(data, start + 1, 1, maximum, 0);
    const slope = first > 0 ? (data[first + 1] ?? 0) - (data[first - 1] ?? 0) : 0;
    const last = findZero(data, end - 2, -1, maximum, slope);
    if (first > 0 && last > first + 8) {
      start = first;
      end = last + 1;
    }
  }
  return [start, end];
}

export function processSeamlessLoop(
  audio: PcmAudio,
  workflow: SeamlessLoopWorkflow,
): SeamlessLoopResult {
  assertValidPcm(audio);
  const [sourceStartFrame, sourceEndFrame] = loopBounds(audio, workflow);
  const sourceFrames = sourceEndFrame - sourceStartFrame;
  const crossfadeFrames = Math.min(
    Math.trunc((workflow.crossfadeMs * audio.sampleRate) / 1000),
    Math.trunc(sourceFrames / 4),
  );
  const loopFrames = sourceFrames - crossfadeFrames;
  if (loopFrames < 1) throw new RangeError('The seamless-loop selection is too short.');
  const loopChannels = audio.channels.map((source) => {
    const output = new Float32Array(loopFrames);
    let frame = 0;
    for (; frame < crossfadeFrames; frame += 1) {
      const progress = frame / Math.max(1, crossfadeFrames - 1);
      output[frame] =
        (source[sourceStartFrame + frame] ?? 0) * Math.sin(progress * Math.PI * 0.5) +
        (source[sourceEndFrame - crossfadeFrames + frame] ?? 0) *
          Math.cos(progress * Math.PI * 0.5);
    }
    output.set(source.subarray(sourceStartFrame + frame, sourceStartFrame + loopFrames), frame);
    return output;
  });
  const outputFrames = loopFrames * workflow.repeat;
  const channels = loopChannels.map((loop) => {
    if (workflow.repeat === 1) return loop;
    const output = new Float32Array(outputFrames);
    for (let repeat = 0; repeat < workflow.repeat; repeat += 1) {
      output.set(loop, repeat * loopFrames);
    }
    return output;
  });
  return {
    audio: { channels, sampleRate: audio.sampleRate },
    crossfadeFrames,
    loopFrames,
    outputFrames,
    repeat: workflow.repeat,
    sourceEndFrame,
    sourceStartFrame,
  };
}
