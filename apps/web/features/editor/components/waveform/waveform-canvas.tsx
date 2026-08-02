'use client';

import type { WaveformPeaks } from '@audiomass/audio-engine';
import { useEffect, useRef } from 'react';

import type { TimelineViewport } from './timeline-math';

interface WaveformCanvasProps {
  height: number;
  peaks: WaveformPeaks | null;
  totalDuration: number;
  viewport: TimelineViewport;
  width: number;
}

export function WaveformCanvas({
  height,
  peaks,
  totalDuration,
  viewport,
  width,
}: WaveformCanvasProps) {
  const canvasReference = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasReference.current;
    if (!canvas || width <= 0 || height <= 0) return;
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    if (!peaks || peaks.max.length === 0) return;

    const styles = getComputedStyle(canvas);
    context.strokeStyle = styles.getPropertyValue('--editor-waveform').trim() || '#43e4dc';
    context.lineWidth = 1;
    context.beginPath();
    const startRatio = viewport.start / Math.max(totalDuration, 0.001);
    const endRatio = viewport.end / Math.max(totalDuration, 0.001);
    const startIndex = Math.max(0, Math.floor(startRatio * peaks.max.length));
    const endIndex = Math.min(peaks.max.length, Math.ceil(endRatio * peaks.max.length));
    const visibleCount = Math.max(1, endIndex - startIndex);
    const middle = height / 2;
    for (let pixel = 0; pixel < width; pixel += 1) {
      const index = Math.min(endIndex - 1, startIndex + Math.floor((pixel / width) * visibleCount));
      const minimum = peaks.min[index] ?? 0;
      const maximum = peaks.max[index] ?? 0;
      context.moveTo(pixel + 0.5, middle - maximum * middle);
      context.lineTo(pixel + 0.5, middle - minimum * middle);
    }
    context.stroke();
  }, [height, peaks, totalDuration, viewport.end, viewport.start, width]);

  return <canvas aria-hidden="true" ref={canvasReference} />;
}
