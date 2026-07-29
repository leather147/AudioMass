(() => {
  type SettingsWindow = Window & {
    AMAppearance: { open(tab?: 'language' | 'themes'): void };
    AMSettingsTrigger?: { attach(): boolean; refreshRenderers(): void };
    AMTheme?: { color(name: string, fallback?: string): string };
    PKAudioEditor?: AMEditorRuntimeApp;
  };

  const runtimeWindow = window as unknown as SettingsWindow;

  function label() {
    return 'Settings';
  }

  function updateLabel() {
    const button = document.querySelector<HTMLButtonElement>('.am_settings_entry>button');
    if (!button) return;
    button.textContent = label();
    button.setAttribute('aria-label', label());
  }

  function attach() {
    const header = document.querySelector<HTMLElement>('.pk_hdr');
    if (!header) return false;
    if (header.querySelector('.am_settings_entry')) {
      updateLabel();
      return true;
    }
    const item = document.createElement('div');
    item.className = 'pk_btn pk_noselect am_settings_entry';
    const button = document.createElement('button');
    button.type = 'button';
    button.tabIndex = -1;
    button.textContent = label();
    button.setAttribute('aria-label', label());
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      runtimeWindow.AMAppearance.open('themes');
    });
    item.append(button);
    header.append(item);
    return true;
  }

  function refreshRenderers() {
    const editor = runtimeWindow.PKAudioEditor;
    const wavesurfer = editor?.engine?.wavesurfer;
    if (wavesurfer && runtimeWindow.AMTheme) {
      const wave = runtimeWindow.AMTheme.color('wave-color', '#8ef1ec');
      const progress = runtimeWindow.AMTheme.color('wave-progress', 'rgba(255,77,94,.24)');
      const cursor = runtimeWindow.AMTheme.color('ring', '#43e4dc');
      wavesurfer.params.waveColor = wave;
      wavesurfer.params.progressColor = progress;
      wavesurfer.params.cursorColor = cursor;
      wavesurfer.setWaveColor?.(wave);
      wavesurfer.setProgressColor?.(progress);
      wavesurfer.setCursorColor?.(cursor);
      if (wavesurfer.drawBuffer && wavesurfer.backend?.buffer) wavesurfer.drawBuffer();
    }
    editor?.fireEvent?.('RequestResize');
    runtimeWindow.dispatchEvent(new Event('resize'));
  }

  function scheduleRefresh() {
    refreshRenderers();
    runtimeWindow.requestAnimationFrame(() =>
      runtimeWindow.requestAnimationFrame(refreshRenderers),
    );
  }

  function boot() {
    if (!attach()) {
      const observer = new MutationObserver(() => {
        if (attach()) observer.disconnect();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    scheduleRefresh();
  }

  runtimeWindow.AMSettingsTrigger = { attach, refreshRenderers };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
  runtimeWindow.addEventListener('am:themechange', scheduleRefresh);
  runtimeWindow.addEventListener('am:localechange', updateLabel);
})();
