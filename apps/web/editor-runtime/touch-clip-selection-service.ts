(() => {
  type TouchApp = AMEditorRuntimeApp & { __amTouchClipSelectFix?: boolean };
  type TouchSelectionService = { install(editor: TouchApp): void };
  type TouchWindow = Window & {
    AMInstallTouchClipSelectFix?: (editor: TouchApp) => void;
    AMSingleWaveformView?: { install(editor: TouchApp): void };
    AMTouchClipSelection?: TouchSelectionService;
  };
  type ActiveTouch = { clip: HTMLElement; id: number; moved: boolean; target: EventTarget | null };

  const runtimeWindow = window as TouchWindow;

  function closestClip(target: EventTarget | null) {
    let node = target instanceof Element ? target : null;
    while (node) {
      if (node.classList.contains('pk_mt_clip')) return node as HTMLElement;
      node = node.parentElement;
    }
    return null;
  }

  function hasModifier(event: TouchEvent) {
    return event.shiftKey || event.ctrlKey || event.metaKey || event.altKey;
  }

  function isHandleTarget(target: EventTarget | null) {
    let node = target instanceof Element ? target : null;
    while (node) {
      if (
        node.classList.contains('pk_mt_trim') ||
        node.classList.contains('pk_mt_fade') ||
        node.classList.contains('wavesurfer-handle')
      ) {
        return true;
      }
      if (node.classList.contains('pk_mt_clip')) return false;
      node = node.parentElement;
    }
    return false;
  }

  function mouseEvent(type: 'mousedown' | 'mousemove' | 'mouseup', touch: Touch) {
    return new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: runtimeWindow,
      button: 0,
      buttons: type === 'mouseup' ? 0 : 1,
      detail: 1,
      clientX: touch.clientX,
      clientY: touch.clientY,
      screenX: touch.screenX,
      screenY: touch.screenY,
      shiftKey: true,
    });
  }

  function findTouch(list: TouchList, id: number) {
    for (let index = 0; index < list.length; index += 1) {
      const touch = list[index];
      if (touch?.identifier === id) return touch;
    }
    return null;
  }

  function install(editor: TouchApp) {
    if (!editor || editor.__amTouchClipSelectFix) return;
    editor.__amTouchClipSelectFix = true;
    runtimeWindow.AMSingleWaveformView?.install(editor);
    let active: ActiveTouch | null = null;
    const inMultitrack = () => Boolean(editor.el?.classList.contains('pk_mt_on'));

    function onTouchStart(event: TouchEvent) {
      if (!inMultitrack() || event.touches.length !== 1 || hasModifier(event)) return;
      if (isHandleTarget(event.target)) return;
      const clip = closestClip(event.target);
      if (!clip || clip.classList.contains('pk_mt_rec_clip')) return;
      const touch = event.touches[0]!;
      active = { id: touch.identifier, clip, target: event.target, moved: false };
      event.preventDefault();
      event.stopPropagation();
      clip.dispatchEvent(mouseEvent('mousedown', touch));
    }

    function onTouchMove(event: TouchEvent) {
      if (!active) return;
      const touch = findTouch(event.touches, active.id);
      if (!touch) return;
      active.moved = true;
      event.preventDefault();
      event.stopPropagation();
      document.dispatchEvent(mouseEvent('mousemove', touch));
    }

    function onTouchEnd(event: TouchEvent) {
      if (!active) return;
      const touch = findTouch(event.changedTouches, active.id);
      if (!touch) return;
      event.preventDefault();
      event.stopPropagation();
      document.dispatchEvent(mouseEvent('mouseup', touch));
      active = null;
    }

    const options: AddEventListenerOptions = { capture: true, passive: false };
    document.addEventListener('touchstart', onTouchStart, options);
    document.addEventListener('touchmove', onTouchMove, options);
    document.addEventListener('touchend', onTouchEnd, options);
    document.addEventListener('touchcancel', onTouchEnd, options);
  }

  const service: TouchSelectionService = { install };
  runtimeWindow.AMTouchClipSelection = service;
  runtimeWindow.AMInstallTouchClipSelectFix = install;
})();
