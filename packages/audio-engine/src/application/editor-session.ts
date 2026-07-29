import { AudioEngine } from '../audio-engine.js';
import { EditHistory } from '../domain/edit-history.js';
import {
  createAudioMarker,
  sortAudioMarkers,
  updateAudioMarker,
  type AudioMarker,
  type CreateAudioMarker,
} from '../domain/markers.js';
import { TypedEventEmitter } from '../typed-event-emitter.js';
import type { AudioEngineEvents, AudioEngineSnapshot } from '../types.js';

export interface EditorAudioEngine {
  readonly duration: number;
  readonly snapshot: AudioEngineSnapshot;
  close(): Promise<void>;
  load(input: ArrayBuffer | AudioBuffer): Promise<AudioEngineSnapshot>;
  on<Name extends keyof AudioEngineEvents>(
    name: Name,
    listener: (payload: AudioEngineEvents[Name]) => void,
  ): () => void;
  pause(): void;
  play(): Promise<void>;
  seek(seconds: number): Promise<void>;
  setVolume(volume: number): void;
  stop(): void;
}

export interface EditorDocument {
  markers: readonly AudioMarker[];
  name: string;
  selection: EditorTimeRange | null;
}

export interface EditorTimeRange {
  end: number;
  start: number;
}

export interface EditorSessionSnapshot {
  canRedo: boolean;
  canUndo: boolean;
  document: EditorDocument;
  engine: AudioEngineSnapshot;
}

export type EditorCommand =
  | { name: 'document.rename'; value: string }
  | { name: 'history.redo' }
  | { name: 'history.undo' }
  | { marker: CreateAudioMarker; name: 'marker.add' }
  | { id: string; name: 'marker.remove' }
  | {
      id: string;
      name: 'marker.update';
      update: Partial<Omit<AudioMarker, 'id'>>;
    }
  | { name: 'playback.pause' }
  | { name: 'playback.play' }
  | { name: 'playback.seek'; seconds: number }
  | { name: 'playback.stop' }
  | { name: 'playback.volume'; value: number }
  | { name: 'selection.clear' }
  | { name: 'selection.set'; range: EditorTimeRange };

export interface EditorSessionEvents {
  error: Error;
  statechange: EditorSessionSnapshot;
}

function emptyDocument(name = 'Untitled'): EditorDocument {
  return { markers: [], name, selection: null };
}

function normalizeDocumentName(name: string): string {
  return (
    name
      .replace(/[\r\n\t]/g, ' ')
      .trim()
      .slice(0, 160) || 'Untitled'
  );
}

function normalizeRange(range: EditorTimeRange, duration: number): EditorTimeRange | null {
  if (!Number.isFinite(range.start) || !Number.isFinite(range.end)) return null;
  const start = Math.min(Math.max(0, range.start), duration);
  const end = Math.min(Math.max(0, range.end), duration);
  return start === end ? null : { end: Math.max(start, end), start: Math.min(start, end) };
}

export class EditorSession extends TypedEventEmitter<EditorSessionEvents> {
  private readonly disposers: Array<() => void> = [];
  private history = new EditHistory<EditorDocument>(emptyDocument());
  private markerSequence = 1;
  private snapshotValue: EditorSessionSnapshot;

  public constructor(private readonly engineValue: EditorAudioEngine = new AudioEngine()) {
    super();
    this.snapshotValue = this.createSnapshot();
    for (const event of ['ended', 'loaded', 'position', 'statechange', 'volumechange'] as const) {
      this.disposers.push(engineValue.on(event, () => this.publish()));
    }
    this.disposers.push(
      engineValue.on('error', (error) => {
        this.emit('error', error);
      }),
    );
  }

  public get engine(): EditorAudioEngine {
    return this.engineValue;
  }

  public get snapshot(): EditorSessionSnapshot {
    return this.snapshotValue;
  }

  private createSnapshot(): EditorSessionSnapshot {
    const history = this.history.snapshot;
    return {
      canRedo: history.canRedo,
      canUndo: history.canUndo,
      document: history.present,
      engine: this.engineValue.snapshot,
    };
  }

  public async load(input: ArrayBuffer | AudioBuffer, name = 'Untitled'): Promise<void> {
    await this.engineValue.load(input);
    this.markerSequence = 1;
    this.history.reset(emptyDocument(normalizeDocumentName(name)));
    this.publish();
  }

  public async dispatch(command: EditorCommand): Promise<void> {
    switch (command.name) {
      case 'document.rename':
        this.commit({ ...this.snapshot.document, name: normalizeDocumentName(command.value) });
        break;
      case 'history.redo':
        this.history.redo();
        this.publish();
        break;
      case 'history.undo':
        this.history.undo();
        this.publish();
        break;
      case 'marker.add': {
        const document = this.snapshot.document;
        const marker = createAudioMarker(
          command.marker,
          this.engineValue.duration,
          `m${String(this.markerSequence)}`,
          document.markers.length,
        );
        this.markerSequence += 1;
        this.commit({
          ...document,
          markers: sortAudioMarkers([...document.markers, marker]),
        });
        break;
      }
      case 'marker.remove': {
        const document = this.snapshot.document;
        const markers = document.markers.filter((marker) => marker.id !== command.id);
        if (markers.length !== document.markers.length) this.commit({ ...document, markers });
        break;
      }
      case 'marker.update': {
        const document = this.snapshot.document;
        const markers = document.markers.map((marker) =>
          marker.id === command.id
            ? updateAudioMarker(marker, command.update, this.engineValue.duration)
            : marker,
        );
        this.commit({ ...document, markers: sortAudioMarkers(markers) });
        break;
      }
      case 'playback.pause':
        this.engineValue.pause();
        break;
      case 'playback.play':
        await this.engineValue.play();
        break;
      case 'playback.seek':
        await this.engineValue.seek(command.seconds);
        break;
      case 'playback.stop':
        this.engineValue.stop();
        break;
      case 'playback.volume':
        this.engineValue.setVolume(command.value);
        break;
      case 'selection.clear':
        this.commit({ ...this.snapshot.document, selection: null });
        break;
      case 'selection.set':
        this.commit({
          ...this.snapshot.document,
          selection: normalizeRange(command.range, this.engineValue.duration),
        });
        break;
    }
  }

  public async close(): Promise<void> {
    for (const dispose of this.disposers.splice(0)) dispose();
    await this.engineValue.close();
    this.removeAllListeners();
  }

  private commit(document: EditorDocument): void {
    this.history.commit(document);
    this.publish();
  }

  private publish(): void {
    this.snapshotValue = this.createSnapshot();
    this.emit('statechange', this.snapshotValue);
  }
}
