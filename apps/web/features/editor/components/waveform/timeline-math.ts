export interface TimelineViewport {
  duration: number;
  end: number;
  start: number;
  zoom: number;
}

export interface TimelineTick {
  label: string;
  major: boolean;
  percent: number;
  time: number;
}

export function formatEditorTime(seconds: number): string {
  const milliseconds = Math.round(Math.max(0, seconds) * 1000);
  const minutes = Math.floor(milliseconds / 60_000);
  const remainder = milliseconds % 60_000;
  return `${String(minutes).padStart(2, '0')}:${String(Math.floor(remainder / 1000)).padStart(2, '0')}.${String(remainder % 1000).padStart(3, '0')}`;
}

export function clampTimelineZoom(zoom: number): number {
  return Math.max(1, Math.min(32, Number.isFinite(zoom) ? zoom : 1));
}

export function createTimelineViewport(
  duration: number,
  zoom: number,
  scroll: number,
): TimelineViewport {
  const safeDuration = Math.max(0, Number.isFinite(duration) ? duration : 0);
  const safeZoom = clampTimelineZoom(zoom);
  const visibleDuration = safeDuration / safeZoom;
  const maximumStart = Math.max(0, safeDuration - visibleDuration);
  const start = maximumStart * Math.max(0, Math.min(1, Number.isFinite(scroll) ? scroll : 0));
  return { duration: visibleDuration, end: start + visibleDuration, start, zoom: safeZoom };
}

export function timelineTimeAtPixel(
  pixel: number,
  width: number,
  viewport: TimelineViewport,
): number {
  if (width <= 0) return viewport.start;
  const ratio = Math.max(0, Math.min(1, pixel / width));
  return viewport.start + ratio * viewport.duration;
}

export function timelinePercent(time: number, viewport: TimelineViewport): number {
  if (viewport.duration <= 0) return 0;
  return ((time - viewport.start) / viewport.duration) * 100;
}

function tickStep(duration: number, width: number): number {
  const targetTicks = Math.max(2, Math.floor(width / 100));
  const raw = duration / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(raw, 0.001)));
  const normalized = raw / magnitude;
  const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return multiplier * magnitude;
}

export function createTimelineTicks(
  viewport: TimelineViewport,
  width: number,
): readonly TimelineTick[] {
  if (viewport.duration <= 0 || width <= 0) return [];
  const step = tickStep(viewport.duration, width);
  const first = Math.ceil(viewport.start / step) * step;
  const ticks: TimelineTick[] = [];
  for (let time = first, index = 0; time <= viewport.end + step / 100; time += step, index += 1) {
    ticks.push({
      label: formatEditorTime(time),
      major: index % 5 === 0,
      percent: timelinePercent(time, viewport),
      time,
    });
  }
  return ticks;
}
