'use client';

import type { EditorCopyKey } from '@/lib/editor-copy';

interface ClassicEditorFooterProps {
  copy: (key: EditorCopyKey) => string;
  onResetZoom?(): void;
  onZoomIn?(): void;
  onZoomOut?(): void;
  playheadPercent?: number;
  scrollPercent?: number;
  viewportPercent?: number;
  zoom?: number;
}

const DECIBELS = ['-Inf', ...Array.from({ length: 36 }, (_, index) => String(-70 + index * 2))];

export function ClassicEditorFooter({
  copy,
  onResetZoom,
  onZoomIn,
  onZoomOut,
  playheadPercent = 0,
  scrollPercent = 0,
  viewportPercent = 100,
  zoom = 1,
}: ClassicEditorFooterProps) {
  const zoomed = zoom > 1;

  return (
    <div className="pk_ftr pk_noselect">
      <div className="pk_zoombtn">
        <button
          className={`pk_btn pk_zoom_in_h${zoom >= 32 || !onZoomIn ? ' pk_inact' : ''}`}
          disabled={zoom >= 32 || !onZoomIn}
          onClick={onZoomIn}
          tabIndex={-1}
          type="button"
        >
          +<span>{copy('zoom')} +</span>
        </button>
        <button
          className={`pk_btn pk_zoom_out_h${!zoomed || !onZoomOut ? ' pk_inact' : ''}`}
          disabled={!zoomed || !onZoomOut}
          onClick={onZoomOut}
          tabIndex={-1}
          type="button"
        >
          –<span>{copy('zoom')} −</span>
        </button>
        <button
          className={`pk_btn pk_zoom_reset${!zoomed || !onResetZoom ? ' pk_inact' : ''}`}
          disabled={!zoomed || !onResetZoom}
          onClick={onResetZoom}
          tabIndex={-1}
          type="button"
        >
          [R] <span>{copy('zoom')} 0</span>
        </button>
        <button className="pk_btn pk_zoom_in_v" tabIndex={-1} type="button">
          ↕ +<span>{copy('zoom')} +</span>
        </button>
        <button className="pk_btn pk_zoom_out_v" tabIndex={-1} type="button">
          ↕ –<span>{copy('zoom')} −</span>
        </button>
      </div>
      <div className="pk_wavescroll">
        <div
          className="pk_wavepoint"
          style={{ left: `${Math.max(0, Math.min(100, playheadPercent))}%` }}
        />
        <div
          className={`pk_wavedrag${zoomed ? '' : ' pk_inact'}`}
          style={{ left: `${scrollPercent}%`, width: `${viewportPercent}%` }}
        >
          <div className="pk_wavedrag_l" />
          <div className="pk_wavedrag_r" />
        </div>
      </div>
      <div>
        <div className="pk_volpar">
          <div className="pk_vol" />
          <div className="pk_peaker" />
        </div>
        <div className="pk_volpar">
          <div className="pk_vol" />
          <div className="pk_peaker" />
        </div>
        <div className="pk_markers pk_noselect">
          {DECIBELS.map((value, index) => (
            <span className={`pk_mark1${index % 2 ? ' pk_odd' : ''}`} key={value}>
              {value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
