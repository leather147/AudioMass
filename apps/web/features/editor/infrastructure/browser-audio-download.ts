import type { ExportedAudioFile } from '@audiomass/audio-engine';

export interface AudioDownloadPort {
  save(file: ExportedAudioFile): void;
}

export class BrowserAudioDownloadAdapter implements AudioDownloadPort {
  public save(file: ExportedAudioFile): void {
    const url = URL.createObjectURL(new Blob([file.bytes], { type: file.mimeType }));
    const anchor = document.createElement('a');
    anchor.download = file.fileName;
    anchor.href = url;
    anchor.rel = 'noopener';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
