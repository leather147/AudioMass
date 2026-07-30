import type { WavBitDepth } from '../codecs/wav.js';
import type { PcmAudio } from '../types.js';

export interface AudioBinaryEncoder {
  encode(audio: PcmAudio, bitDepth: WavBitDepth): Promise<ArrayBuffer>;
}

export interface ExportedAudioFile {
  bytes: ArrayBuffer;
  fileName: string;
  mimeType: 'audio/wav';
}

function wavFileName(documentName: string): string {
  const stem = documentName.replace(/\.[^.]+$/, '');
  const base = Array.from(stem, (character) => {
    const code = character.codePointAt(0) ?? 0;
    return code < 32 || '<>:"/\\|?*'.includes(character) ? '_' : character;
  })
    .join('')
    .trim()
    .slice(0, 150);
  return `${base || 'audiomass-export'}.wav`;
}

export class AudioExportService {
  public async exportWav(
    audio: PcmAudio,
    documentName: string,
    encoder: AudioBinaryEncoder,
    bitDepth: WavBitDepth = 16,
  ): Promise<ExportedAudioFile> {
    return {
      bytes: await encoder.encode(audio, bitDepth),
      fileName: wavFileName(documentName),
      mimeType: 'audio/wav',
    };
  }
}
