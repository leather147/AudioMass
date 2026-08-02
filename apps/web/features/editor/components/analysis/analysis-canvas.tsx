'use client';

import type { FrequencyAnalysis } from '@audiomass/audio-engine';
import { useEffect, useRef } from 'react';

interface AnalysisCanvasProps {
  analysis: FrequencyAnalysis | null;
  height: number;
  kind: 'frequency' | 'spectral';
  width: number;
}

function cssColor(canvas: HTMLCanvasElement, token: string, fallback: string): string {
  return getComputedStyle(canvas).getPropertyValue(token).trim() || fallback;
}

const HEAT_STOPS = [
  [3, 7, 18],
  [50, 20, 110],
  [20, 130, 180],
  [80, 220, 150],
  [255, 220, 70],
] as const;

function writeHeatPixel(data: Uint8ClampedArray, pixel: number, decibels: number): void {
  const value = Math.max(0, Math.min(1, (decibels + 120) / 120));
  const position = value * (HEAT_STOPS.length - 1);
  const startIndex = Math.min(HEAT_STOPS.length - 2, Math.floor(position));
  const progress = position - startIndex;
  const start = HEAT_STOPS[startIndex]!;
  const end = HEAT_STOPS[startIndex + 1]!;
  data[pixel] = Math.round(start[0] + (end[0] - start[0]) * progress);
  data[pixel + 1] = Math.round(start[1] + (end[1] - start[1]) * progress);
  data[pixel + 2] = Math.round(start[2] + (end[2] - start[2]) * progress);
  data[pixel + 3] = 255;
}

function binAtLogPosition(frequencies: Float32Array, ratio: number): number {
  if (frequencies.length <= 1) return 0;
  const minimum = Math.max(frequencies[1] ?? 1, 1);
  const maximum = Math.max(frequencies.at(-1) ?? minimum, minimum);
  const target = minimum * (maximum / minimum) ** Math.max(0, Math.min(1, ratio));
  const step = frequencies[1] ?? minimum;
  return Math.max(1, Math.min(frequencies.length - 1, Math.round(target / step)));
}

function drawSpectrum(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  analysis: FrequencyAnalysis,
  width: number,
  height: number,
): void {
  const { frequencies, magnitudesDb } = analysis.spectrum;
  context.fillStyle = cssColor(canvas, '--editor-bg', '#0d1014');
  context.fillRect(0, 0, width, height);
  context.strokeStyle = cssColor(canvas, '--editor-border', '#2b3440');
  context.lineWidth = 1;
  for (let line = 1; line < 6; line += 1) {
    const y = (line / 6) * height;
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(width, y + 0.5);
    context.stroke();
  }
  context.strokeStyle = cssColor(canvas, '--editor-accent', '#43e4dc');
  context.lineWidth = 2;
  context.beginPath();
  for (let x = 0; x < width; x += 1) {
    const bin = binAtLogPosition(frequencies, x / Math.max(1, width - 1));
    const decibels = magnitudesDb[bin] ?? -120;
    const y = height - ((decibels + 120) / 120) * height;
    if (x === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();
}

function drawSpectrogram(
  context: CanvasRenderingContext2D,
  analysis: FrequencyAnalysis,
  width: number,
  height: number,
): void {
  const { frameCount, frequencies, magnitudesDb } = analysis.spectrogram;
  const binCount = frequencies.length;
  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;
  const sourceContext = source.getContext('2d', { alpha: false });
  if (!sourceContext) return;
  const image = sourceContext.createImageData(width, height);
  const frames = new Uint16Array(width);
  const bins = new Uint16Array(height);
  for (let x = 0; x < width; x += 1) {
    frames[x] = Math.min(frameCount - 1, Math.floor((x / Math.max(1, width)) * frameCount));
  }
  for (let y = 0; y < height; y += 1) {
    bins[y] = binAtLogPosition(frequencies, 1 - y / Math.max(1, height - 1));
  }
  for (let x = 0; x < width; x += 1) {
    const frame = frames[x] ?? 0;
    for (let y = 0; y < height; y += 1) {
      const bin = bins[y] ?? 0;
      const pixel = (y * width + x) * 4;
      writeHeatPixel(image.data, pixel, magnitudesDb[frame * binCount + bin] ?? -120);
    }
  }
  sourceContext.putImageData(image, 0, 0);
  context.imageSmoothingEnabled = false;
  context.drawImage(source, 0, 0, width, height);
}

export function AnalysisCanvas({ analysis, height, kind, width }: AnalysisCanvasProps) {
  const reference = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = reference.current;
    if (!canvas || width <= 0 || height <= 0) return;
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!analysis) {
      context.fillStyle = cssColor(canvas, '--editor-bg', '#0d1014');
      context.fillRect(0, 0, width, height);
      return;
    }
    if (kind === 'frequency') drawSpectrum(context, canvas, analysis, width, height);
    else drawSpectrogram(context, analysis, width, height);
  }, [analysis, height, kind, width]);

  return <canvas aria-hidden="true" ref={reference} />;
}
