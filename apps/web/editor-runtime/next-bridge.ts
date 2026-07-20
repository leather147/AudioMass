(() => {
  type EditorPreferences = {
    locale: string;
    theme: string;
  };

  type EditorInstance = {
    fireEvent(eventName: string): void;
    listenFor(eventName: string, callback: (payload?: unknown) => void): void;
  };

  type PreferencesStore = {
    onChange(callback: () => void): () => void;
  };

  type ThemeService = {
    get(): { id: string };
    set(theme: string): unknown;
  };

  type LocaleService = {
    getLocale(): string;
    setLocale(locale: string): unknown;
  };

  type EditorRuntimeWindow = Window & {
    AMI18n?: LocaleService;
    AMInstallNextBridge?: (editor: EditorInstance) => void;
    AMPreferences?: PreferencesStore;
    AMTheme?: ThemeService;
    __amNextBridgeInstalled?: boolean;
  };

  type EditorCommand = {
    channel?: unknown;
    command?: unknown;
    payload?: unknown;
  };

  const CHANNEL = 'audiomass.editor.v1';
  const EVENT_NAMES = {
    DidLoadFile: 'editor.file-loaded',
    RequestPause: 'editor.pause',
    DidPlay: 'editor.play',
  } as const;

  const runtimeWindow = window as EditorRuntimeWindow;

  function send(eventName: string, payload?: unknown) {
    if (runtimeWindow.parent === runtimeWindow) return;
    runtimeWindow.parent.postMessage(
      { channel: CHANNEL, event: eventName, payload },
      runtimeWindow.location.origin,
    );
  }

  function isEditorPreferences(value: unknown): value is EditorPreferences {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<EditorPreferences>;
    return typeof candidate.locale === 'string' && typeof candidate.theme === 'string';
  }

  function currentPreferences(): EditorPreferences {
    return {
      locale: runtimeWindow.AMI18n?.getLocale() ?? 'ru',
      theme: runtimeWindow.AMTheme?.get().id ?? 'replicate',
    };
  }

  runtimeWindow.AMInstallNextBridge = (editor) => {
    if (!editor || typeof editor.fireEvent !== 'function') return;
    if (runtimeWindow.__amNextBridgeInstalled) return;
    runtimeWindow.__amNextBridgeInstalled = true;
    let applyingPreferences = false;

    for (const [editorEvent, bridgeEvent] of Object.entries(EVENT_NAMES)) {
      editor.listenFor(editorEvent, (payload) => send(bridgeEvent, payload));
    }

    runtimeWindow.addEventListener('message', (event: MessageEvent<EditorCommand>) => {
      if (
        event.source !== runtimeWindow.parent ||
        event.origin !== runtimeWindow.location.origin ||
        event.data?.channel !== CHANNEL ||
        typeof event.data.command !== 'string'
      ) {
        return;
      }

      if (event.data.command === 'playback.play') editor.fireEvent('RequestPlay');
      if (event.data.command === 'playback.pause') editor.fireEvent('RequestPause');
      if (event.data.command !== 'preferences.apply' || !isEditorPreferences(event.data.payload)) {
        return;
      }

      applyingPreferences = true;
      try {
        runtimeWindow.AMTheme?.set(event.data.payload.theme);
        if (runtimeWindow.AMI18n?.getLocale() !== event.data.payload.locale) {
          runtimeWindow.AMI18n?.setLocale(event.data.payload.locale);
        }
      } finally {
        applyingPreferences = false;
      }
      send('preferences.changed', currentPreferences());
    });

    runtimeWindow.AMPreferences?.onChange(() => {
      if (!applyingPreferences) send('preferences.changed', currentPreferences());
    });

    window.setTimeout(() => send('editor.ready'), 0);
  };
})();
