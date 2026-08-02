export const SPECIALIZED_EFFECT_IDS = [
  'seamless-loop',
  'paragraphic-equalizer',
  'automation',
  'audio-repair',
] as const;

export type SpecializedEffectId = (typeof SPECIALIZED_EFFECT_IDS)[number];

export interface SeamlessLoopWorkflow {
  crossfadeMs: number;
  kind: 'seamless-loop';
  repeat: number;
  snapZeroCrossing: boolean;
  trimSilence: boolean;
}

export type ParagraphicEqBandType = 'highpass' | 'lowpass' | 'peaking';

export interface ParagraphicEqBand {
  enabled: boolean;
  frequency: number;
  gainDb: number;
  id: string;
  q: number;
  type: ParagraphicEqBandType;
}

export interface ParagraphicEqualizerWorkflow {
  bands: readonly ParagraphicEqBand[];
  kind: 'paragraphic-equalizer';
}

export interface AutomationPoint {
  timeSeconds: number;
  value: number;
}

export interface AutomationWorkflow {
  kind: 'automation';
  points: readonly AutomationPoint[];
  target: 'gain';
}

export type RepairMode = 'declick' | 'hum' | 'splice';
export type RepairSensitivity = 'high' | 'low' | 'medium';
export type MainsFrequency = 50 | 60 | 'auto';

export interface AudioRepairWorkflow {
  kind: 'audio-repair';
  mainsFrequency: MainsFrequency;
  mode: RepairMode;
  sensitivity: RepairSensitivity;
}

export type SpecializedEffectWorkflow =
  AudioRepairWorkflow | AutomationWorkflow | ParagraphicEqualizerWorkflow | SeamlessLoopWorkflow;

export const DEFAULT_SEAMLESS_LOOP_WORKFLOW: SeamlessLoopWorkflow = {
  crossfadeMs: 10,
  kind: 'seamless-loop',
  repeat: 1,
  snapZeroCrossing: true,
  trimSilence: false,
};

export const DEFAULT_PARAGRAPHIC_EQ_WORKFLOW: ParagraphicEqualizerWorkflow = {
  bands: [],
  kind: 'paragraphic-equalizer',
};

export const DEFAULT_AUDIO_REPAIR_WORKFLOW: AudioRepairWorkflow = {
  kind: 'audio-repair',
  mainsFrequency: 'auto',
  mode: 'declick',
  sensitivity: 'medium',
};

export function defaultAutomationWorkflow(duration: number): AutomationWorkflow {
  const safeDuration = Number.isFinite(duration) ? Math.max(0.001, duration) : 1;
  return {
    kind: 'automation',
    points: [
      { timeSeconds: 0, value: 1 },
      { timeSeconds: safeDuration, value: 1 },
    ],
    target: 'gain',
  };
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function finite(value: unknown, label: string, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new TypeError(`${label} must be a finite number from ${minimum} to ${maximum}.`);
  }
  return value;
}

function boolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new TypeError(`${label} must be a boolean.`);
  return value;
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 80) {
    throw new TypeError(`${label} must be a non-empty string of at most 80 characters.`);
  }
  return value.trim();
}

function parseSeamless(input: Record<string, unknown>): SeamlessLoopWorkflow {
  const repeat = finite(input.repeat, 'repeat', 1, 64);
  if (!Number.isInteger(repeat)) throw new TypeError('repeat must be an integer.');
  return {
    crossfadeMs: finite(input.crossfadeMs, 'crossfadeMs', 0, 500),
    kind: 'seamless-loop',
    repeat,
    snapZeroCrossing: boolean(input.snapZeroCrossing, 'snapZeroCrossing'),
    trimSilence: boolean(input.trimSilence, 'trimSilence'),
  };
}

function parseParagraphic(input: Record<string, unknown>): ParagraphicEqualizerWorkflow {
  if (!Array.isArray(input.bands) || input.bands.length > 24) {
    throw new TypeError('bands must be an array containing at most 24 entries.');
  }
  const ids = new Set<string>();
  const bands = input.bands.map((candidate, index): ParagraphicEqBand => {
    const band = record(candidate, `bands[${index}]`);
    const id = text(band.id, `bands[${index}].id`);
    if (ids.has(id)) throw new TypeError(`Duplicate paragraphic EQ band id: ${id}.`);
    ids.add(id);
    if (band.type !== 'peaking' && band.type !== 'highpass' && band.type !== 'lowpass') {
      throw new TypeError(`bands[${index}].type is invalid.`);
    }
    return {
      enabled: boolean(band.enabled, `bands[${index}].enabled`),
      frequency: finite(band.frequency, `bands[${index}].frequency`, 0, 20_000),
      gainDb: finite(band.gainDb, `bands[${index}].gainDb`, -35, 35),
      id,
      q: finite(band.q, `bands[${index}].q`, 0.1, 20),
      type: band.type,
    };
  });
  return { bands, kind: 'paragraphic-equalizer' };
}

function parseAutomation(input: Record<string, unknown>): AutomationWorkflow {
  if (input.target !== 'gain') throw new TypeError('Automation target must be gain.');
  if (!Array.isArray(input.points) || input.points.length < 2 || input.points.length > 64) {
    throw new TypeError('Automation requires 2 to 64 points.');
  }
  const points = input.points
    .map((candidate, index): AutomationPoint => {
      const point = record(candidate, `points[${index}]`);
      return {
        timeSeconds: finite(point.timeSeconds, `points[${index}].timeSeconds`, 0, 3600),
        value: finite(point.value, `points[${index}].value`, 0, 2.5),
      };
    })
    .sort((left, right) => left.timeSeconds - right.timeSeconds);
  for (let index = 1; index < points.length; index += 1) {
    if (points[index]!.timeSeconds === points[index - 1]!.timeSeconds) {
      throw new TypeError('Automation point times must be unique.');
    }
  }
  return { kind: 'automation', points, target: 'gain' };
}

function parseRepair(input: Record<string, unknown>): AudioRepairWorkflow {
  if (input.mode !== 'declick' && input.mode !== 'hum' && input.mode !== 'splice') {
    throw new TypeError('Repair mode is invalid.');
  }
  if (
    input.sensitivity !== 'low' &&
    input.sensitivity !== 'medium' &&
    input.sensitivity !== 'high'
  ) {
    throw new TypeError('Repair sensitivity is invalid.');
  }
  if (
    input.mainsFrequency !== 'auto' &&
    input.mainsFrequency !== 50 &&
    input.mainsFrequency !== 60
  ) {
    throw new TypeError('Mains frequency must be auto, 50, or 60.');
  }
  return {
    kind: 'audio-repair',
    mainsFrequency: input.mainsFrequency,
    mode: input.mode,
    sensitivity: input.sensitivity,
  };
}

export function parseSpecializedEffectWorkflow(input: unknown): SpecializedEffectWorkflow {
  const workflow = record(input, 'Specialized effect workflow');
  if (workflow.kind === 'seamless-loop') return parseSeamless(workflow);
  if (workflow.kind === 'paragraphic-equalizer') return parseParagraphic(workflow);
  if (workflow.kind === 'automation') return parseAutomation(workflow);
  if (workflow.kind === 'audio-repair') return parseRepair(workflow);
  throw new TypeError('Unknown specialized effect workflow.');
}
