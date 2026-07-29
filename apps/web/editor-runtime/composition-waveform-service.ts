(() => {
  type CompositionService = { boot(): void; schedule(): void };
  type CompositionWindow = Window & {
    AMCompositionWaveform?: CompositionService;
    PKAudioEditor?: AMEditorRuntimeApp;
  };

  const runtimeWindow = window as unknown as CompositionWindow;
  let badge: HTMLDivElement | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let context: CanvasRenderingContext2D | null = null;
  let frame = 0;
  let lastSignature = '';
  let lastCursor = -1;
  let lastReady = false;

  const query = <ElementType extends Element>(selector: string, root?: ParentNode | null) =>
    (root ?? document).querySelector<ElementType>(selector);
  const queryAll = <ElementType extends Element>(selector: string, root?: ParentNode | null) =>
    Array.from((root ?? document).querySelectorAll<ElementType>(selector));

  function makeBadge() {
    if (badge?.parentNode) return badge;
    const toolbar = query<HTMLElement>('.pk_tb');
    if (!toolbar) return null;
    badge = document.createElement('div');
    badge.className = 'pk_comp_wave_badge';
    badge.title = 'Composition waveform overview';
    badge.setAttribute('aria-label', 'Composition waveform overview');
    canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 38;
    context = canvas.getContext('2d');
    const label = document.createElement('span');
    label.className = 'pk_comp_wave_label';
    label.textContent = 'waveform';
    const eye = document.createElement('span');
    eye.className = 'pk_comp_wave_eye';
    badge.append(canvas, label, eye);
    const selection = query('.pk_selection', toolbar);
    const controls = query('.pk_ctns', toolbar);
    if (selection) toolbar.insertBefore(badge, selection);
    else if (controls?.nextSibling) toolbar.insertBefore(badge, controls.nextSibling);
    else toolbar.append(badge);
    badge.addEventListener('click', () => {
      const editor = runtimeWindow.PKAudioEditor;
      if (editor?.multitrack?.IsOn?.()) editor.fireEvent?.('RequestViewCenterToCursor');
    });
    return badge;
  }

  function resizeCanvas() {
    if (!badge || !canvas) return false;
    const bounds = badge.getBoundingClientRect();
    const ratio = Math.min(2, runtimeWindow.devicePixelRatio || 1);
    const width = Math.max(80, Math.round(bounds.width * ratio));
    const height = Math.max(24, Math.round(bounds.height * ratio));
    if (canvas.width === width && canvas.height === height) return false;
    canvas.width = width;
    canvas.height = height;
    return true;
  }

  function drawEmpty(width: number, height: number) {
    const paint = context;
    if (!paint) return;
    paint.clearRect(0, 0, width, height);
    const gradient = paint.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(12,18,20,.92)');
    gradient.addColorStop(1, 'rgba(6,8,10,.96)');
    paint.fillStyle = gradient;
    paint.fillRect(0, 0, width, height);
    paint.strokeStyle = 'rgba(255,255,255,.055)';
    paint.lineWidth = Math.max(1, runtimeWindow.devicePixelRatio || 1);
    for (let x = 8; x < width; x += 16) {
      paint.beginPath();
      paint.moveTo(x + 0.5, 4);
      paint.lineTo(x + 0.5, height - 4);
      paint.stroke();
    }
    paint.fillStyle = 'rgba(150,165,170,.25)';
    paint.font = `${Math.round(height * 0.22)}px monospace`;
    paint.textAlign = 'center';
    paint.textBaseline = 'middle';
    paint.fillText('overview', width * 0.43, height * 0.5);
  }

  function drawRightMeter(width: number, height: number) {
    const paint = context;
    if (!paint) return;
    const meterX = Math.round(width * 0.75);
    const padding = Math.max(3, Math.round(height * 0.14));
    const meterWidth = width - meterX - padding;
    const meterHeight = height - padding * 2;
    if (meterWidth < 12) return;
    const gradient = paint.createLinearGradient(meterX, padding, width - padding, height - padding);
    gradient.addColorStop(0, 'rgba(224,236,196,.28)');
    gradient.addColorStop(0.52, 'rgba(246,218,130,.55)');
    gradient.addColorStop(1, 'rgba(242,135,106,.38)');
    paint.fillStyle = gradient;
    paint.fillRect(meterX, padding, meterWidth, meterHeight);
    paint.fillStyle = 'rgba(5,8,10,.42)';
    for (let index = 1; index < 5; index += 1) {
      const y = padding + Math.round((index * meterHeight) / 5);
      paint.fillRect(meterX, y, meterWidth, Math.max(1, Math.round(height * 0.035)));
    }
    paint.strokeStyle = 'rgba(255,255,255,.12)';
    paint.strokeRect(meterX + 0.5, padding + 0.5, meterWidth - 1, meterHeight - 1);
  }

  function clipSignature(
    clips: HTMLElement[],
    lanes: HTMLElement[],
    lanesWidth: number,
    cursor: number,
  ) {
    let signature = [clips.length, lanes.length, lanesWidth, Math.round(cursor * 20)].join(':');
    for (const clip of clips) {
      signature += `|${clip.offsetLeft},${clip.offsetWidth},${clip.offsetTop},${clip.offsetHeight},${clip.className}`;
    }
    return signature;
  }

  function currentCursorPixels(lanesWidth: number) {
    const multitrack = runtimeWindow.PKAudioEditor?.multitrack;
    if (!multitrack?.IsOn?.() || !multitrack.GetDuration || !multitrack.GetCursor) return -1;
    const duration = multitrack.GetDuration() || 0;
    return duration > 0 ? (multitrack.GetCursor() / duration) * lanesWidth : -1;
  }

  function drawFromMultitrack(width: number, height: number) {
    const paint = context;
    const lanes = query<HTMLElement>('.pk_mt_lanes');
    const main = query<HTMLElement>('.pk_mt_main');
    if (!paint || !lanes || !main) return false;
    const clips = queryAll<HTMLElement>('.pk_mt_clip', lanes);
    const lanesWidth = lanes.scrollWidth || lanes.offsetWidth || 0;
    if (!clips.length || !lanesWidth) return false;
    const cursorPixels = currentCursorPixels(lanesWidth);
    const signature = clipSignature(
      clips,
      queryAll<HTMLElement>('.pk_mt_lane', lanes),
      lanesWidth,
      cursorPixels,
    );
    if (signature === lastSignature && lastReady && Math.abs(cursorPixels - lastCursor) < 1) {
      return true;
    }
    lastSignature = signature;
    lastCursor = cursorPixels;
    lastReady = true;
    drawEmpty(width, height);
    const waveRight = Math.max(10, Math.round(width * 0.74));
    const middle = Math.round(height * 0.52);
    const maxAmplitude = Math.max(6, Math.round(height * 0.33));
    paint.fillStyle = 'rgba(255,255,255,.05)';
    paint.fillRect(5, middle - 1, waveRight - 12, 2);
    for (const [index, clip] of clips.entries()) {
      const clipCanvas = query<HTMLCanvasElement>('canvas', clip);
      const start = Math.max(4, Math.round((clip.offsetLeft / lanesWidth) * (waveRight - 10)) + 4);
      const clipWidth = Math.max(2, Math.round((clip.offsetWidth / lanesWidth) * (waveRight - 10)));
      const color = getComputedStyle(clip).getPropertyValue('--mt-br').trim() || '#56dbe3';
      paint.save();
      paint.beginPath();
      paint.rect(4, 4, waveRight - 8, height - 8);
      paint.clip();
      paint.globalAlpha = clip.classList.contains('pk_mt_clip_muted') ? 0.22 : 0.82;
      if (clipCanvas?.width && clipCanvas.height) {
        paint.drawImage(clipCanvas, start, middle - maxAmplitude, clipWidth, maxAmplitude * 2);
      } else {
        paint.strokeStyle = color;
        paint.beginPath();
        for (let x = 0; x < clipWidth; x += 1) {
          const amplitude = Math.sin((x + index * 17) * 0.42) * Math.sin((x + 5) * 0.09);
          paint.moveTo(start + x + 0.5, middle - Math.abs(amplitude) * maxAmplitude);
          paint.lineTo(start + x + 0.5, middle + Math.abs(amplitude) * maxAmplitude);
        }
        paint.stroke();
      }
      paint.globalAlpha = 0.75;
      paint.strokeStyle = color;
      paint.strokeRect(
        start + 0.5,
        middle - maxAmplitude + 0.5,
        Math.max(1, clipWidth - 1),
        maxAmplitude * 2 - 1,
      );
      paint.restore();
    }
    if (cursorPixels >= 0) {
      const cursorX = Math.round((cursorPixels / lanesWidth) * (waveRight - 10)) + 4;
      paint.strokeStyle = 'rgba(94,242,255,.95)';
      paint.shadowColor = 'rgba(94,242,255,.45)';
      paint.shadowBlur = Math.max(2, height * 0.08);
      paint.beginPath();
      paint.moveTo(cursorX + 0.5, 4);
      paint.lineTo(cursorX + 0.5, height - 5);
      paint.stroke();
      paint.shadowBlur = 0;
    }
    drawRightMeter(width, height);
    return true;
  }

  function drawFromEditor(width: number, height: number) {
    const paint = context;
    const wavesurfer = runtimeWindow.PKAudioEditor?.engine?.wavesurfer;
    const buffer = wavesurfer?.backend?.buffer;
    if (!paint || !wavesurfer || !buffer?.length || !buffer.getChannelData) return false;
    drawEmpty(width, height);
    const waveRight = Math.max(10, Math.round(width * 0.74));
    const data = buffer.getChannelData(0);
    const middle = Math.round(height * 0.52);
    const maxAmplitude = Math.max(6, Math.round(height * 0.34));
    const usable = waveRight - 12;
    paint.strokeStyle = 'rgba(148,226,220,.86)';
    paint.beginPath();
    for (let x = 0; x < usable; x += 1) {
      const from = Math.floor((x * data.length) / usable);
      const to = Math.max(from + 1, Math.floor(((x + 1) * data.length) / usable));
      let minimum = 0;
      let maximum = 0;
      const step = Math.max(1, Math.floor((to - from) / 24));
      for (let index = from; index < to; index += step) {
        const value = data[index] ?? 0;
        minimum = Math.min(minimum, value);
        maximum = Math.max(maximum, value);
      }
      paint.moveTo(6 + x + 0.5, middle + minimum * maxAmplitude);
      paint.lineTo(6 + x + 0.5, middle + maximum * maxAmplitude);
    }
    paint.stroke();
    const cursor = wavesurfer.getCurrentTime?.() ?? 0;
    const duration = wavesurfer.getDuration?.() ?? 0;
    if (duration > 0) {
      const cursorX = 6 + Math.round((cursor / duration) * usable);
      paint.strokeStyle = 'rgba(94,242,255,.95)';
      paint.beginPath();
      paint.moveTo(cursorX + 0.5, 4);
      paint.lineTo(cursorX + 0.5, height - 5);
      paint.stroke();
    }
    drawRightMeter(width, height);
    return true;
  }

  function draw() {
    frame = 0;
    if (!makeBadge() || !context || !canvas) {
      schedule();
      return;
    }
    resizeCanvas();
    const { width, height } = canvas;
    if (!drawFromMultitrack(width, height) && !drawFromEditor(width, height)) {
      lastReady = false;
      drawEmpty(width, height);
      drawRightMeter(width, height);
    }
    schedule();
  }

  function schedule() {
    if (frame) return;
    frame = runtimeWindow.requestAnimationFrame(draw);
  }

  function boot() {
    makeBadge();
    schedule();
  }

  runtimeWindow.AMCompositionWaveform = { boot, schedule };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
