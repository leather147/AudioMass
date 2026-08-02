export interface AudioMarker {
  color: string;
  id: string;
  loop: boolean;
  name: string;
  time: number;
}

export interface CreateAudioMarker {
  color?: string;
  id?: string;
  loop?: boolean;
  name?: string;
  time: number;
}

const DEFAULT_MARKER_COLORS = [
  '#9dff6a',
  '#5af2ff',
  '#f557d2',
  '#ffd15c',
  '#ff8c35',
  '#b9c6ff',
] as const;

function normalizeName(name: string | undefined, fallback: string): string {
  const normalized = (name ?? '')
    .replace(/[\r\n\t]/g, ' ')
    .trim()
    .slice(0, 60);
  return normalized || fallback;
}

function normalizeColor(color: string | undefined, index: number): string {
  return color && /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(color)
    ? color
    : (DEFAULT_MARKER_COLORS[index % DEFAULT_MARKER_COLORS.length] ?? '#5af2ff');
}

export function clampTimelineTime(time: number, duration: number): number {
  if (!Number.isFinite(time)) return 0;
  return Math.min(Math.max(0, time), Math.max(0, duration));
}

export function createAudioMarker(
  input: CreateAudioMarker,
  duration: number,
  fallbackId: string,
  colorIndex: number,
): AudioMarker {
  const id = input.id?.trim() || fallbackId;
  return {
    color: normalizeColor(input.color, colorIndex),
    id,
    loop: input.loop ?? false,
    name: normalizeName(input.name, `Marker ${id.replace(/^m/, '')}`),
    time: clampTimelineTime(input.time, duration),
  };
}

export function sortAudioMarkers(markers: readonly AudioMarker[]): readonly AudioMarker[] {
  return [...markers].sort(
    (left, right) => left.time - right.time || left.id.localeCompare(right.id),
  );
}

export function updateAudioMarker(
  marker: AudioMarker,
  update: Partial<Omit<AudioMarker, 'id'>>,
  duration: number,
): AudioMarker {
  return {
    ...marker,
    color: update.color === undefined ? marker.color : normalizeColor(update.color, 0),
    loop: update.loop ?? marker.loop,
    name: update.name === undefined ? marker.name : normalizeName(update.name, marker.name),
    time: update.time === undefined ? marker.time : clampTimelineTime(update.time, duration),
  };
}
