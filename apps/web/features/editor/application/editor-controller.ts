import {
  EditorSession,
  type EditorCommand,
  type EditorSessionSnapshot,
} from '@audiomass/audio-engine';

export class EditorController {
  public constructor(private readonly session: EditorSession = new EditorSession()) {}

  public get snapshot(): EditorSessionSnapshot {
    return this.session.snapshot;
  }

  public subscribe(listener: () => void): () => void {
    return this.session.on('statechange', listener);
  }

  public subscribeToErrors(listener: (error: Error) => void): () => void {
    return this.session.on('error', listener);
  }

  public async openFile(file: File): Promise<void> {
    await this.session.load(await file.arrayBuffer(), file.name);
  }

  public dispatch(command: EditorCommand): Promise<void> {
    return this.session.dispatch(command);
  }

  public close(): Promise<void> {
    return this.session.close();
  }
}
