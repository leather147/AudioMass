import type { PcmAudio } from '../../types.js';
import type { AutomationPoint, AutomationWorkflow } from './models.js';

export function automationValueAt(points: readonly AutomationPoint[], timeSeconds: number): number {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) throw new RangeError('Automation requires at least one point.');
  if (timeSeconds <= first.timeSeconds) return first.value;
  if (timeSeconds >= last.timeSeconds) return last.value;
  let rightIndex = 1;
  while ((points[rightIndex]?.timeSeconds ?? Number.POSITIVE_INFINITY) < timeSeconds) {
    rightIndex += 1;
  }
  const left = points[rightIndex - 1]!;
  const right = points[rightIndex]!;
  const progress = (timeSeconds - left.timeSeconds) / (right.timeSeconds - left.timeSeconds);
  return left.value + (right.value - left.value) * progress;
}

export function processAutomation(audio: PcmAudio, workflow: AutomationWorkflow): PcmAudio {
  return {
    channels: audio.channels.map((source) =>
      Float32Array.from(source, (sample, frame) => {
        const value = automationValueAt(workflow.points, frame / audio.sampleRate);
        return sample * value;
      }),
    ),
    sampleRate: audio.sampleRate,
  };
}
