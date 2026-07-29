interface AMRuntimeInteractionHandler {
  check?(name: string): boolean;
  checkAndSet?(name: string): void;
  forceSet?(name: string): void;
  forceUnset?(name: string): void;
  on?: boolean;
}

interface AMRuntimeKeyHandler {
  addCallback?(name: string, callback: (event?: Event) => void, keys: number[]): void;
  removeCallback?(name: string): void;
}

interface AMRuntimeUI {
  InteractionHandler?: AMRuntimeInteractionHandler;
  KeyHandler?: AMRuntimeKeyHandler;
  __mtScrollRulerFinalFix?: boolean;
  drawTimelineRuler?(
    context: CanvasRenderingContext2D,
    total: number,
    width: number,
    left: number,
    visible: number,
  ): unknown;
  el?: HTMLElement;
}

interface AMRuntimeAudioBuffer {
  getChannelData(channel: number): Float32Array;
  length: number;
}

interface AMRuntimeWaveSurfer {
  backend?: {
    buffer?: AMRuntimeAudioBuffer;
    getPeaks?(width: number): unknown;
  };
  drawer?: {
    drawPeaks?(peaks: unknown, duration: number): void;
    width: number;
  };
  drawBuffer?(): void;
  getCurrentTime?(): number;
  getDuration?(): number;
  params: {
    cursorColor?: string;
    progressColor?: string;
    waveColor?: string;
  };
  setCursorColor?(color: string): void;
  setProgressColor?(color: string): void;
  setWaveColor?(color: string): void;
}

interface AMRuntimeClip {
  id: string;
  name: string;
}

interface AMRuntimeMultitrack {
  GetCursor?(): number;
  GetDuration?(): number;
  HasClips?(): boolean;
  IsOn?(): boolean;
  getState?(): unknown;
}

interface AMEditorRuntimeApp {
  _deps: Record<string, unknown> & { Wlc?: () => void };
  el: HTMLElement | null;
  engine?: { wavesurfer?: AMRuntimeWaveSurfer };
  fireEvent?(name: string, value?: unknown, value2?: unknown): unknown;
  isMobile?: boolean;
  listenFor?(name: string, callback: (value?: unknown, value2?: unknown) => void): void;
  multitrack?: AMRuntimeMultitrack;
  ui?: AMRuntimeUI;
}

interface AMRuntimeModal {
  Destroy(): void;
  Show(): void;
  el?: HTMLElement;
  el_body: HTMLElement;
  els: { bottom: HTMLElement[] };
}

interface AMRuntimeModalButton {
  callback(modal: AMRuntimeModal): void;
  clss?: string;
  title: string;
}

interface AMRuntimeModalOptions {
  body: string;
  buttons?: AMRuntimeModalButton[];
  clss?: string;
  ondestroy?(modal: AMRuntimeModal): void;
  setup?(modal: AMRuntimeModal): void;
  title: string;
}

interface AMRuntimeModalConstructor {
  new (options: AMRuntimeModalOptions): AMRuntimeModal;
}

declare const PKAudioEditor: AMEditorRuntimeApp;
declare const PKSimpleModal: AMRuntimeModalConstructor;
