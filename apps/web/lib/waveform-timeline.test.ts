import { describe, expect, it } from 'vitest';

import {
  createTimelineTicks,
  createTimelineViewport,
  formatEditorTime,
  timelinePercent,
  timelineTimeAtPixel,
} from '@/features/editor/components/waveform/timeline-math';

describe('framework-native waveform viewport', () => {
  it('maps zoomed scrolling, pixels, and percentages deterministically', () => {
    const viewport = createTimelineViewport(100, 4, 0.5);

    expect(viewport).toMatchObject({ duration: 25, end: 62.5, start: 37.5, zoom: 4 });
    expect(timelineTimeAtPixel(50, 100, viewport)).toBe(50);
    expect(timelinePercent(50, viewport)).toBe(50);
  });

  it('builds bounded readable ruler ticks and formats time without a DOM', () => {
    const viewport = createTimelineViewport(10, 1, 0);
    const ticks = createTimelineTicks(viewport, 500);

    expect(ticks.length).toBeGreaterThanOrEqual(5);
    expect(ticks.every((tick) => tick.percent >= 0 && tick.percent <= 100)).toBe(true);
    expect(formatEditorTime(62.345)).toBe('01:02.345');
  });
});
