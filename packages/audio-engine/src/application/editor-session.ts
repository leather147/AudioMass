import { AudioEngine } from '../audio-engine.js';
import {
  createEditorDocument,
  normalizeDocumentName,
  normalizeEditorRange,
  type EditorDocument,
  type EditorTimeRange,
} from '../domain/editor-document.js';
import { EditHistory } from '../domain/edit-history.js';
import {
  createAudioMarker,
  sortAudioMarkers,
  updateAudioMarker,
  type AudioMarker,
  type CreateAudioMarker,
} from '../domain/markers.js';
import { clonePcm } from '../dsp/pcm.js';
import { TypedEventEmitter } from '../typed-event-emitter.js';
import type { AudioEngineEvents, AudioEngineSnapshot, PcmAudio } from '../types.js';
import {
  executeSingleTrackEdit,
  type SingleTrackEditCommand,
  type SingleTrackEditorState,
} from './single-track-edit.js';

export type { EditorDocument, EditorTimeRange } from '../domain/editor-document.js';

export interface EditorAudioEngine {
  readonly duration: number;
  readonly snapshot: AudioEngineSnapshot;
  close(): Promise<void>;
  load(input: ArrayBuffer | AudioBuffer): Promise<AudioEngineSnapshot>;
  loadPcm(audio: PcmAudio): AudioEngineSnapshot;
  on<Name extends keyof AudioEngineEvents>(
    name: Name,
    listener: (payload: AudioEngineEvents[Name]) => void,
  ): () => void;
  pause(): void;
  play(): Promise<void>;
  seek(seconds: number): Promise<void>;
  setVolume(volume: number): void;
  stop(): void;
  toPcm(): PcmAudio;
}

interface EditorSessionState {
  audio: PcmAudio | null;
  document: EditorDocument;
}

export interface EditorSessionSnapshot {
  canRedo: boolean;
  canUndo: boolean;
  clipboardFrames: number;
  document: EditorDocument;
  engine: AudioEngineSnapshot;
}

export type EditorCommand =
  | SingleTrackEditCommand
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

function emptyState(name = 'Untitled'): EditorSessionState {
  return { audio: null, document: createEditorDocument(name) };
}

function isEditCommand(command: EditorCommand): command is SingleTrackEditCommand {
  return command.name.startsWith('edit.');
}

export class EditorSession extends TypedEventEmitter<EditorSessionEvents> {
  private clipboard: PcmAudio | null = null;
  private readonly disposers: Array<() => void> = [];
  private history = new EditHistory<EditorSessionState>(emptyState());
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

  public getAudio(): PcmAudio | null {
    const audio = this.history.snapshot.present.audio;
    return audio ? clonePcm(audio) : null;
  }

  public async load(input: ArrayBuffer | AudioBuffer, name = 'Untitled'): Promise<void> {
    await this.engineValue.load(input);
    this.clipboard = null;
    this.markerSequence = 1;
    this.history.reset({
      audio: this.engineValue.toPcm(),
      document: createEditorDocument(name),
    });
    this.publish();
  }

  public async dispatch(command: EditorCommand): Promise<void> {
    if (isEditCommand(command)) {
      await this.dispatchEdit(command);
      return;
    }

    switch (command.name) {
      case 'document.rename':
        this.commitDocument({
          ...this.snapshot.document,
          name: normalizeDocumentName(command.value),
        });
        break;
      case 'history.redo':
        await this.restoreHistory('redo');
        break;
      case 'history.undo':
        await this.restoreHistory('undo');
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
        this.commitDocument({
          ...document,
          markers: sortAudioMarkers([...document.markers, marker]),
        });
        break;
      }
      case 'marker.remove': {
        const document = this.snapshot.document;
        const markers = document.markers.filter((marker) => marker.id !== command.id);
        if (markers.length !== document.markers.length)
          this.commitDocument({ ...document, markers });
        break;
      }
      case 'marker.update': {
        const document = this.snapshot.document;
        const markers = document.markers.map((marker) =>
          marker.id === command.id
            ? updateAudioMarker(marker, command.update, this.engineValue.duration)
            : marker,
        );
        this.commitDocument({ ...document, markers: sortAudioMarkers(markers) });
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
        this.commitDocument({ ...this.snapshot.document, selection: null });
        break;
      case 'selection.set':
        this.commitDocument({
          ...this.snapshot.document,
          selection: normalizeEditorRange(command.range, this.engineValue.duration),
        });
        break;
    }
  }

  public async close(): Promise<void> {
    for (const dispose of this.disposers.splice(0)) dispose();
    await this.engineValue.close();
    this.clipboard = null;
    this.removeAllListeners();
  }

  private createSnapshot(): EditorSessionSnapshot {
    const history = this.history.snapshot;
    return {
      canRedo: history.canRedo,
      canUndo: history.canUndo,
      clipboardFrames: this.clipboard?.channels[0]?.length ?? 0,
      document: history.present.document,
      engine: this.engineValue.snapshot,
    };
  }

  private commitDocument(document: EditorDocument): void {
    const state = this.history.snapshot.present;
    this.history.commit({ ...state, document });
    this.publish();
  }

  private async dispatchEdit(command: SingleTrackEditCommand): Promise<void> {
    const current = this.history.snapshot.present;
    if (!current.audio) return;
    const result = executeSingleTrackEdit(
      { audio: current.audio, document: current.document },
      command,
      { clipboard: this.clipboard, cursor: this.engineValue.snapshot.position },
    );
    this.clipboard = result.clipboard;
    if (result.state.audio !== current.audio || result.state.document !== current.document) {
      this.history.commit(result.state satisfies SingleTrackEditorState);
      if (result.audioChanged) this.engineValue.loadPcm(result.state.audio);
    }
    if (result.position !== undefined) await this.engineValue.seek(result.position);
    this.publish();
  }

  private async restoreHistory(direction: 'redo' | 'undo'): Promise<void> {
    const before = this.history.snapshot.present;
    const restored = this.history[direction]().present;
    if (restored === before) return;
    if (restored.audio && restored.audio !== before.audio) this.engineValue.loadPcm(restored.audio);
    await this.engineValue.seek(
      Math.min(this.engineValue.snapshot.position, this.engineValue.duration),
    );
    this.publish();
  }

  private publish(): void {
    this.snapshotValue = this.createSnapshot();
    this.emit('statechange', this.snapshotValue);
  }
}
