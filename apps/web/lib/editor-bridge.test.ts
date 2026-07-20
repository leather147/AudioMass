import { describe, expect, it } from 'vitest';

import {
  createEditorCommand,
  EDITOR_BRIDGE_CHANNEL,
  isEditorBridgeEvent,
} from '@/lib/editor-bridge';

describe('editor bridge', () => {
  it('creates versioned editor commands', () => {
    expect(createEditorCommand('playback.play', undefined)).toEqual({
      channel: EDITOR_BRIDGE_CHANNEL,
      command: 'playback.play',
      payload: undefined,
    });
  });

  it('rejects messages from another protocol', () => {
    expect(isEditorBridgeEvent({ channel: 'other', event: 'editor.ready' })).toBe(false);
    expect(isEditorBridgeEvent({ channel: EDITOR_BRIDGE_CHANNEL, event: 'unknown' })).toBe(false);
  });

  it('accepts preference change events', () => {
    expect(
      isEditorBridgeEvent({
        channel: EDITOR_BRIDGE_CHANNEL,
        event: 'preferences.changed',
        payload: { locale: 'en', theme: 'nord' },
      }),
    ).toBe(true);
  });
});
