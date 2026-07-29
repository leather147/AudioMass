(() => {
  type ScrollApp = AMEditorRuntimeApp & {
    ui: AMRuntimeUI & { __mtScrollRulerFinalFix?: boolean };
  };
  type TimelineWidth = { baseWidth: number; visualWidth: number };
  type MultitrackScrollService = {
    calculateVisualWidth(baseWidth: number, scrollLeft: number, viewport: number): number;
    install(editor: ScrollApp): void;
  };
  type ScrollWindow = Window & {
    AMInstallMtScrollRulerFinalFix?: (editor: ScrollApp) => void;
    AMMultitrackScroll?: MultitrackScrollService;
  };

  const runtimeWindow = window as ScrollWindow;

  function numericCss(value?: string | null) {
    const parsed = Number.parseFloat(value || '0');
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function calculateVisualWidth(baseWidth: number, scrollLeft: number, viewport: number) {
    const safeViewport = Math.max(1, viewport || 1);
    const extra = Math.min(1200, Math.max(420, safeViewport * 0.65));
    const visual = Math.ceil(
      Math.max(baseWidth + extra, Math.max(0, scrollLeft) + safeViewport + 80),
    );
    const hardCap = Math.ceil(baseWidth + Math.max(extra, safeViewport));
    return Math.min(visual, hardCap);
  }

  function install(editor: ScrollApp) {
    if (!editor?.ui || editor.ui.__mtScrollRulerFinalFix) return;
    editor.ui.__mtScrollRulerFinalFix = true;

    type Nodes = {
      lanes: HTMLElement | null;
      main: HTMLElement | null;
      ruler: HTMLElement | null;
    };
    const nodes = (): Nodes => {
      const root: ParentNode = editor.el ?? document;
      return {
        main: root.querySelector<HTMLElement>('.pk_mt_main'),
        lanes: root.querySelector<HTMLElement>('.pk_mt_lanes'),
        ruler: root.querySelector<HTMLElement>('.pk_mt_ruler'),
      };
    };

    function clipContentWidth(current: Nodes, fallback: number) {
      const clips = current.lanes
        ? Array.from(current.lanes.querySelectorAll<HTMLElement>('.pk_mt_clip'))
        : [];
      let end = 0;
      for (const clip of clips) {
        const left = numericCss(clip.style.left);
        const width = numericCss(clip.style.width) || clip.offsetWidth || clip.clientWidth || 0;
        end = Math.max(end, left + width);
      }
      return Math.max(800, fallback || 0, end + 180);
    }

    function targetWidths(baseWidth: number, left?: number, visible?: number): TimelineWidth {
      const current = nodes();
      if (!current.main || !current.lanes || !current.ruler) {
        const fallback = baseWidth || 1;
        return { baseWidth: fallback, visualWidth: fallback };
      }
      const viewport = Math.max(1, visible || current.main.clientWidth || 1);
      const scrollLeft = Math.max(0, left === undefined ? current.main.scrollLeft : left);
      const base = clipContentWidth(current, baseWidth || viewport);
      return { baseWidth: base, visualWidth: calculateVisualWidth(base, scrollLeft, viewport) };
    }

    function extendTimeline(baseWidth: number, left?: number, visible?: number) {
      const current = nodes();
      const info = targetWidths(baseWidth, left, visible);
      if (!current.main || !current.lanes || !current.ruler) return info;
      if (Math.abs(numericCss(current.lanes.style.width) - info.visualWidth) > 1) {
        current.lanes.style.width = `${info.visualWidth}px`;
      }
      if (Math.abs(numericCss(current.ruler.style.width) - info.visualWidth) > 1) {
        current.ruler.style.width = `${info.visualWidth}px`;
      }
      current.main.classList.add('pk_mt_scroll_unified');
      return info;
    }

    const originalDraw = editor.ui.drawTimelineRuler;
    if (originalDraw) {
      editor.ui.drawTimelineRuler = function (context, total, width, left, visible) {
        const info = extendTimeline(width, left, visible);
        if (total && width && info.visualWidth > width) {
          const visualTotal = total * (info.visualWidth / width);
          return originalDraw.call(
            editor.ui,
            context,
            visualTotal,
            info.visualWidth,
            left,
            visible,
          );
        }
        return originalDraw.call(editor.ui, context, total, width, left, visible);
      };
    }

    function syncExisting() {
      const current = nodes();
      if (!current.main || !current.lanes || !current.ruler) return;
      const base = clipContentWidth(current, current.main.clientWidth || 800);
      extendTimeline(base, current.main.scrollLeft, current.main.clientWidth);
    }

    let frame = 0;
    function schedule() {
      if (frame) return;
      frame = runtimeWindow.requestAnimationFrame(() => {
        frame = 0;
        syncExisting();
      });
    }

    const observer = new MutationObserver(schedule);
    observer.observe(editor.el ?? document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
    document.addEventListener('scroll', schedule, true);
    runtimeWindow.addEventListener('resize', schedule);
    schedule();
  }

  const service: MultitrackScrollService = { calculateVisualWidth, install };
  runtimeWindow.AMMultitrackScroll = service;
  runtimeWindow.AMInstallMtScrollRulerFinalFix = install;
})();
