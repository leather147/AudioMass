import type { AudioMarker } from './markers.js';

export interface EditorTimeRange {
  end: number;
  start: number;
}

export interface EditorDocument {
  markers: readonly AudioMarker[];
  name: string;
  selection: EditorTimeRange | null;
}

export function createEditorDocument(name = 'Untitled'): EditorDocument {
  return { markers: [], name: normalizeDocumentName(name), selection: null };
}

export function normalizeDocumentName(name: string): string {
  return (
    name
      .replace(/[\r\n\t]/g, ' ')
      .trim()
      .slice(0, 160) || 'Untitled'
  );
}

export function normalizeEditorRange(
  range: EditorTimeRange,
  duration: number,
): EditorTimeRange | null {
  if (!Number.isFinite(range.start) || !Number.isFinite(range.end)) return null;
  const first = Math.min(Math.max(0, range.start), Math.max(0, duration));
  const second = Math.min(Math.max(0, range.end), Math.max(0, duration));
  const start = Math.min(first, second);
  const end = Math.max(first, second);
  return start === end ? null : { end, start };
}
