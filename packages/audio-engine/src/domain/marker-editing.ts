import type { EditorTimeRange } from './editor-document.js';
import { sortAudioMarkers, type AudioMarker } from './markers.js';

export function insertMarkerTime(
  markers: readonly AudioMarker[],
  at: number,
  duration: number,
): readonly AudioMarker[] {
  return sortAudioMarkers(
    markers.map((marker) =>
      marker.time >= at ? { ...marker, time: marker.time + duration } : marker,
    ),
  );
}

export function removeMarkerTime(
  markers: readonly AudioMarker[],
  range: EditorTimeRange,
): readonly AudioMarker[] {
  const duration = range.end - range.start;
  return sortAudioMarkers(
    markers.flatMap((marker) => {
      if (marker.time < range.start) return [marker];
      if (marker.time >= range.end) return [{ ...marker, time: marker.time - duration }];
      return [];
    }),
  );
}

export function replaceMarkerTime(
  markers: readonly AudioMarker[],
  range: EditorTimeRange,
  replacementDuration: number,
): readonly AudioMarker[] {
  const delta = replacementDuration - (range.end - range.start);
  return sortAudioMarkers(
    markers.flatMap((marker) => {
      if (marker.time < range.start) return [marker];
      if (marker.time >= range.end) return [{ ...marker, time: marker.time + delta }];
      return [];
    }),
  );
}

export function trimMarkerTime(
  markers: readonly AudioMarker[],
  range: EditorTimeRange,
): readonly AudioMarker[] {
  return sortAudioMarkers(
    markers
      .filter((marker) => marker.time >= range.start && marker.time <= range.end)
      .map((marker) => ({ ...marker, time: marker.time - range.start })),
  );
}
