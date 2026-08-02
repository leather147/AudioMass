'use client';

import type {
  EditorSessionSnapshot,
  FrequencyAnalysis,
  FrequencyAnalysisOptions,
} from '@audiomass/audio-engine';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

import type { EditorCopyKey } from '@/lib/editor-copy';

import type { EditorController } from '../../application/editor-controller';
import styles from '../editor-shell.module.css';
import { useElementWidth } from '../waveform/use-element-width';
import { AnalysisCanvas } from './analysis-canvas';

interface AnalysisPanelProps {
  controller: EditorController;
  copy: (key: EditorCopyKey) => string;
  kind: 'frequency' | 'spectral';
  snapshot: EditorSessionSnapshot;
}

interface AnalysisState {
  analysis: FrequencyAnalysis | null;
  error: string | null;
  key: string | null;
}

export function AnalysisPanel({ controller, copy, kind, snapshot }: AnalysisPanelProps) {
  const { reference, width } = useElementWidth<HTMLDivElement>();
  const [fftSize, setFftSize] = useState(2048);
  const [frameCount, setFrameCount] = useState(kind === 'spectral' ? 128 : 32);
  const [state, setState] = useState<AnalysisState>({ analysis: null, error: null, key: null });
  const requestSequence = useRef(0);
  const [, startTransition] = useTransition();
  const key = `${snapshot.audioRevision}:${fftSize}:${frameCount}`;
  const analysis = state.key === key ? state.analysis : null;
  const error = state.key === key ? state.error : null;
  const loaded = snapshot.engine.duration > 0;
  const loading = loaded && state.key !== key;
  const options = useMemo<FrequencyAnalysisOptions>(
    () => ({ fftSize, frameCount }),
    [fftSize, frameCount],
  );

  useEffect(() => {
    const requestId = ++requestSequence.current;
    if (!loaded) return;
    void controller.analyzeFrequency(options).then(
      (result) => {
        if (requestSequence.current !== requestId) return;
        startTransition(() => setState({ analysis: result, error: null, key }));
      },
      (reason: unknown) => {
        if (requestSequence.current !== requestId) return;
        setState({
          analysis: null,
          error: reason instanceof Error ? reason.message : 'Audio analysis failed.',
          key,
        });
      },
    );
    return () => {
      if (requestSequence.current === requestId) requestSequence.current += 1;
    };
  }, [controller, key, loaded, options, startTransition]);

  const peak = useMemo(() => {
    if (!analysis) return null;
    let index = 0;
    for (let candidate = 1; candidate < analysis.spectrum.magnitudesDb.length; candidate += 1) {
      if (
        (analysis.spectrum.magnitudesDb[candidate] ?? -120) >
        (analysis.spectrum.magnitudesDb[index] ?? -120)
      ) {
        index = candidate;
      }
    }
    return {
      decibels: analysis.spectrum.magnitudesDb[index] ?? -120,
      frequency: analysis.spectrum.frequencies[index] ?? 0,
    };
  }, [analysis]);

  return (
    <section
      aria-label={copy(kind === 'frequency' ? 'frequencyAnalyser' : 'spectralAnalyser')}
      className={styles.analysisPanel}
    >
      <header className={styles.analysisControls}>
        <strong>{copy(kind === 'frequency' ? 'frequencyAnalyser' : 'spectralAnalyser')}</strong>
        <label>
          {copy('fftSize')}
          <select
            onChange={(event) => setFftSize(Number(event.currentTarget.value))}
            value={fftSize}
          >
            {[512, 1024, 2048, 4096].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        {kind === 'spectral' ? (
          <label>
            {copy('spectrogramFrames')}
            <input
              max={256}
              min={32}
              onChange={(event) => setFrameCount(Number(event.currentTarget.value))}
              step={32}
              type="range"
              value={frameCount}
            />
            <output>{frameCount}</output>
          </label>
        ) : null}
      </header>
      <div className={styles.analysisCanvas} ref={reference}>
        <AnalysisCanvas analysis={analysis} height={360} kind={kind} width={width} />
      </div>
      <dl className={styles.analysisSummary}>
        <div>
          <dt>{copy('peakFrequency')}</dt>
          <dd>{peak ? `${Math.round(peak.frequency)} Hz` : '—'}</dd>
        </div>
        <div>
          <dt>{copy('peakLevel')}</dt>
          <dd>{peak ? `${peak.decibels.toFixed(1)} dB` : '—'}</dd>
        </div>
        <div>
          <dt>{copy('frequencyRange')}</dt>
          <dd>
            {analysis ? `0–${Math.round(analysis.spectrum.frequencies.at(-1) ?? 0)} Hz` : '—'}
          </dd>
        </div>
      </dl>
      <p aria-live="polite" className={error ? styles.error : styles.analysisStatus}>
        {error ?? (loading ? copy('loadingAnalysis') : loaded ? '' : copy('analysisEmpty'))}
      </p>
    </section>
  );
}
