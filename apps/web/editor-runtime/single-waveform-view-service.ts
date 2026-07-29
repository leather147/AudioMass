(() => {
  type WaveMode = 'focus' | 'normal';
  type WaveApp = AMEditorRuntimeApp & { __amSingleWaveViewMode?: boolean };
  type WavePathState = { active: boolean; base: number; channel: number };
  type SingleWaveformService = {
    focusGain(x: number, width: number, channel: number): number;
    getMode(): WaveMode;
    install(editor: WaveApp): void;
    setMode(mode: WaveMode): void;
  };
  type FullscreenDocument = Document & {
    mozCancelFullScreen?: () => void;
    mozFullScreenElement?: Element | null;
    msExitFullscreen?: () => void;
    msFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => void;
    webkitFullscreenElement?: Element | null;
  };
  type FullscreenElement = HTMLElement & {
    mozRequestFullScreen?: () => void;
    msRequestFullscreen?: () => void;
    webkitRequestFullscreen?: () => void;
  };
  type WaveWindow = Window & {
    AMPreferences?: {
      get<Value>(key: string, fallback: Value): Value;
      set<Value>(key: string, value: Value): Value;
    };
    AMSingleWaveformView?: SingleWaveformService;
    CanvasRenderingContext2D?: { prototype: CanvasRenderingContext2D };
  };

  const runtimeWindow = window as WaveWindow;
  const fullscreenDocument = document as FullscreenDocument;
  const PREFERENCE_KEY = 'singleWaveformView';
  const pathStates = new WeakMap<CanvasRenderingContext2D, WavePathState>();
  let canvasPatched = false;
  let originalMoveTo: CanvasRenderingContext2D['moveTo'] | null = null;
  let originalLineTo: CanvasRenderingContext2D['lineTo'] | null = null;
  let originalFill: CanvasRenderingContext2D['fill'] | null = null;

  function getMode(): WaveMode {
    const saved = runtimeWindow.AMPreferences?.get<string>(PREFERENCE_KEY, 'focus') ?? 'focus';
    return saved === 'normal' ? 'normal' : 'focus';
  }

  function setMode(mode: WaveMode) {
    runtimeWindow.AMPreferences?.set(PREFERENCE_KEY, mode);
  }

  function injectAssets() {
    if (!document.querySelector('link[href="single-waveform-view-mode.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = 'single-waveform-view-mode.css';
      document.head.append(link);
    }
    if (!document.querySelector('.am_cctv_site_filter')) {
      const overlay = document.createElement('div');
      overlay.className = 'am_cctv_site_filter';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.append(overlay);
    }
  }

  function fullscreenElement() {
    return (
      fullscreenDocument.fullscreenElement ??
      fullscreenDocument.webkitFullscreenElement ??
      fullscreenDocument.mozFullScreenElement ??
      fullscreenDocument.msFullscreenElement ??
      null
    );
  }

  function requestFullscreen(element: FullscreenElement = document.documentElement) {
    const request =
      element.requestFullscreen ??
      element.webkitRequestFullscreen ??
      element.mozRequestFullScreen ??
      element.msRequestFullscreen;
    return request?.call(element);
  }

  function exitFullscreen() {
    const exit =
      fullscreenDocument.exitFullscreen ??
      fullscreenDocument.webkitExitFullscreen ??
      fullscreenDocument.mozCancelFullScreen ??
      fullscreenDocument.msExitFullscreen;
    return exit?.call(fullscreenDocument);
  }

  function toggleFullscreen() {
    if (fullscreenElement()) void exitFullscreen();
    else void requestFullscreen();
  }

  function isSingleWaveCanvas(context: CanvasRenderingContext2D) {
    const canvas = context.canvas;
    return Boolean(
      canvas.parentNode &&
      document.querySelector('.pk_app:not(.pk_mt_on)') &&
      canvas.closest('.pk_av') &&
      !canvas.closest('.pk_mt'),
    );
  }

  function isFocusWaveCanvas(context: CanvasRenderingContext2D) {
    const canvas = context.canvas;
    return Boolean(
      canvas.parentNode &&
      document.querySelector('.pk_app.pk_single_wave_focus:not(.pk_mt_on)') &&
      canvas.closest('.pk_av') &&
      !canvas.closest('.pk_mt'),
    );
  }

  function smoothstep(value: number) {
    const bounded = Math.max(0, Math.min(1, value));
    return bounded * bounded * (3 - 2 * bounded);
  }

  function focusGain(x: number, width: number, channel: number) {
    const normalized = Math.max(0, Math.min(1, x / Math.max(1, width || 1)));
    const distance = Math.abs(normalized - 0.5) * 2;
    const edge = 1 - distance;
    const quietInset = channel === 1 ? 0.26 : 0.22;
    const shaped = smoothstep((edge - quietInset) / (1 - quietInset));
    let gain = Math.pow(shaped, channel === 1 ? 1.3 : 1.42);
    if (channel === 1) gain *= 0.972 + 0.028 * Math.cos(distance * Math.PI * 2);
    const floor = channel === 1 ? 0.008 : 0.004;
    return Math.max(floor, Math.min(1, floor + (1 - floor) * gain));
  }

  function applyWaveGlow(context: CanvasRenderingContext2D, args: unknown[]) {
    if (!originalFill) return;
    const focus = Boolean(document.querySelector('.pk_app.pk_single_wave_focus:not(.pk_mt_on)'));
    try {
      context.save();
      context.shadowColor = focus ? 'rgba(80,235,255,.28)' : 'rgba(90,220,255,.18)';
      context.shadowBlur = focus ? 10 : 7;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      Reflect.apply(originalFill, context, args);
      context.restore();
      context.save();
      context.shadowColor = focus ? 'rgba(205,252,255,.32)' : 'rgba(190,245,255,.20)';
      context.shadowBlur = focus ? 3 : 2;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      Reflect.apply(originalFill, context, args);
      context.restore();
    } catch {
      try {
        context.restore();
      } catch {
        // Canvas state may already be balanced.
      }
    }
    Reflect.apply(originalFill, context, args);
  }

  function patchCanvasWaveformDraw() {
    if (canvasPatched || !runtimeWindow.CanvasRenderingContext2D) return;
    const prototype = runtimeWindow.CanvasRenderingContext2D.prototype;
    if (!prototype?.moveTo || !prototype.lineTo || !prototype.fill) return;
    canvasPatched = true;
    originalMoveTo = prototype.moveTo;
    originalLineTo = prototype.lineTo;
    originalFill = prototype.fill;
    prototype.moveTo = function (this: CanvasRenderingContext2D, x: number, y: number) {
      if (isSingleWaveCanvas(this)) {
        const height = this.canvas?.height || 1;
        pathStates.set(this, { base: y, active: y > 24, channel: y > height * 0.52 ? 1 : 0 });
      }
      return originalMoveTo!.call(this, x, y);
    };
    prototype.lineTo = function (this: CanvasRenderingContext2D, x: number, y: number) {
      if (isFocusWaveCanvas(this)) {
        const state = pathStates.get(this);
        if (state?.active && Math.abs(y - state.base) > 0.25) {
          y = state.base + (y - state.base) * focusGain(x, this.canvas.width, state.channel);
        }
      }
      return originalLineTo!.call(this, x, y);
    };
    prototype.fill = function (this: CanvasRenderingContext2D, ...args: unknown[]) {
      const state = pathStates.get(this);
      if (state?.active && isSingleWaveCanvas(this)) {
        applyWaveGlow(this, args);
        return;
      }
      Reflect.apply(originalFill!, this, args);
    } as CanvasRenderingContext2D['fill'];
  }

  function redrawWave(editor: WaveApp) {
    const wavesurfer = editor.engine?.wavesurfer;
    if (!wavesurfer) return;
    try {
      if (wavesurfer.drawBuffer) wavesurfer.drawBuffer();
      else if (wavesurfer.drawer?.drawPeaks && wavesurfer.backend?.buffer) {
        wavesurfer.drawer.drawPeaks(
          wavesurfer.backend.getPeaks?.(wavesurfer.drawer.width),
          wavesurfer.getDuration?.() ?? 0,
        );
      }
    } catch {
      // Drawing is best-effort while the audio backend is being replaced.
    }
    try {
      editor.fireEvent?.('RequestResize');
    } catch {
      // A destroyed editor can no longer receive resize events.
    }
  }

  function install(editor: WaveApp) {
    if (!editor?.el || editor.__amSingleWaveViewMode) return;
    editor.__amSingleWaveViewMode = true;
    injectAssets();
    patchCanvasWaveformDraw();
    const root = editor.el;
    let modeButton: HTMLButtonElement | null = null;
    let fullscreenButton: HTMLButtonElement | null = null;

    function apply(mode: WaveMode = getMode()) {
      root.classList.toggle('pk_single_wave_focus', mode === 'focus');
      root.classList.toggle('pk_single_wave_normal', mode === 'normal');
      if (!modeButton) return;
      modeButton.classList.toggle('pk_act', mode === 'focus');
      modeButton.setAttribute('aria-pressed', mode === 'focus' ? 'true' : 'false');
      const text = modeButton.querySelector('b');
      const tooltip = modeButton.querySelector('span');
      if (text) text.textContent = mode === 'focus' ? 'Focus' : 'Normal';
      if (tooltip) {
        tooltip.textContent =
          mode === 'focus'
            ? 'Waveform view: quiet edges with the peak near the center'
            : 'Waveform view: full waveform';
      }
    }

    function updateFullscreenButton() {
      if (!fullscreenButton) return;
      const active = Boolean(fullscreenElement());
      fullscreenButton.classList.toggle('pk_act', active);
      fullscreenButton.setAttribute('aria-pressed', active ? 'true' : 'false');
      const text = fullscreenButton.querySelector('b');
      const tooltip = fullscreenButton.querySelector('span');
      if (text) text.textContent = active ? 'Window' : 'Fullscreen';
      if (tooltip) tooltip.textContent = active ? 'Exit fullscreen' : 'Open the editor fullscreen';
    }

    function installFullscreenButton(toolbar: HTMLElement, before: Element | null) {
      if (fullscreenButton?.parentNode) return;
      fullscreenButton = document.createElement('button');
      fullscreenButton.type = 'button';
      fullscreenButton.tabIndex = -1;
      fullscreenButton.className = 'pk_btn pk_fullscreen_toggle';
      fullscreenButton.innerHTML = '<b>Fullscreen</b><span>Open the editor fullscreen</span>';
      fullscreenButton.addEventListener('click', () => {
        toggleFullscreen();
        fullscreenButton?.blur();
        runtimeWindow.setTimeout(updateFullscreenButton, 80);
      });
      if (before) toolbar.insertBefore(fullscreenButton, before);
      else toolbar.append(fullscreenButton);
      updateFullscreenButton();
    }

    function choose(mode: WaveMode) {
      setMode(mode);
      apply(mode);
      redrawWave(editor);
    }

    function makeButton() {
      const toolbar = root.querySelector<HTMLElement>('.pk_tb');
      if (!toolbar) return false;
      const before =
        toolbar.querySelector('.pk_composition_wave_badge') ??
        toolbar.querySelector('.pk_marker_create_btn') ??
        toolbar.querySelector('.pk_selection');
      if (!modeButton?.parentNode) {
        modeButton = document.createElement('button');
        modeButton.type = 'button';
        modeButton.tabIndex = -1;
        modeButton.className = 'pk_btn pk_wave_view_toggle';
        modeButton.innerHTML = '<b></b><span></span>';
        modeButton.addEventListener('click', () => {
          choose(getMode() === 'focus' ? 'normal' : 'focus');
          modeButton?.blur();
        });
        if (before) toolbar.insertBefore(modeButton, before);
        else toolbar.append(modeButton);
      }
      installFullscreenButton(toolbar, before);
      apply();
      return true;
    }

    apply();
    if (!makeButton()) {
      let attempts = 0;
      const timer = runtimeWindow.setInterval(() => {
        attempts += 1;
        if (makeButton() || attempts > 30) runtimeWindow.clearInterval(timer);
      }, 120);
    }
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
    runtimeWindow.setTimeout(() => redrawWave(editor), 80);
    editor.listenFor?.('DidUpdateLen', () => runtimeWindow.setTimeout(() => redrawWave(editor), 0));
    editor.listenFor?.('DidUnloadFile', () => apply());
  }

  runtimeWindow.AMSingleWaveformView = { focusGain, getMode, install, setMode };
})();
