import type { EditorPreferences } from '@/lib/editor-preferences';

export const EDITOR_RUNTIME_PATH = '/editor-runtime';
export const EDITOR_BRIDGE_CHANNEL = 'audiomass.editor.v1';

export type EditorCommandMap = {
  'playback.pause': undefined;
  'playback.play': undefined;
  'preferences.apply': EditorPreferences;
};

export type EditorCommand<Name extends keyof EditorCommandMap = keyof EditorCommandMap> = {
  channel: typeof EDITOR_BRIDGE_CHANNEL;
  command: Name;
  payload: EditorCommandMap[Name];
};

export type EditorBridgeEvent =
  | {
      channel: typeof EDITOR_BRIDGE_CHANNEL;
      event: 'preferences.changed';
      payload: EditorPreferences;
    }
  | {
      channel: typeof EDITOR_BRIDGE_CHANNEL;
      event: 'editor.file-loaded' | 'editor.pause' | 'editor.play' | 'editor.ready';
      payload?: unknown;
    };

export function createEditorCommand<Name extends keyof EditorCommandMap>(
  command: Name,
  payload: EditorCommandMap[Name],
): EditorCommand<Name> {
  return { channel: EDITOR_BRIDGE_CHANNEL, command, payload };
}

export function isEditorBridgeEvent(value: unknown): value is EditorBridgeEvent {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<EditorBridgeEvent>;
  return (
    candidate.channel === EDITOR_BRIDGE_CHANNEL &&
    typeof candidate.event === 'string' &&
    [
      'editor.file-loaded',
      'editor.pause',
      'editor.play',
      'editor.ready',
      'preferences.changed',
    ].includes(candidate.event)
  );
}
