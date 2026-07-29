(() => {
  type DragReadMode = 'arrayBuffer' | 'binary' | 'text';
  type DragResult = ArrayBuffer | string | null;
  type DragCallback = (result: DragResult, fileName: string) => void;

  interface DragDropService {
    install(
      body: HTMLElement,
      overlay?: HTMLElement | string | null,
      callback?: DragCallback,
      mode?: DragReadMode,
      activeClass?: string,
    ): 'mobile' | void;
  }

  type DragWindow = Window & {
    AMDragDrop?: DragDropService;
    dragNDrop?: DragDropService['install'];
  };

  const runtimeWindow = window as DragWindow;
  const readMethods: Record<
    DragReadMode,
    'readAsArrayBuffer' | 'readAsBinaryString' | 'readAsText'
  > = {
    arrayBuffer: 'readAsArrayBuffer',
    binary: 'readAsBinaryString',
    text: 'readAsText',
  };

  function removeClass(element: HTMLElement, value: string) {
    element.classList.remove(value);
  }

  function readFile(file: File, callback: DragCallback | undefined, mode: DragReadMode) {
    const reader = new FileReader();
    reader.onerror = () => {
      const messages = [
        'File not found.',
        'File could not be opened',
        'File could not be uploaded',
        'Could not read File',
        'File too large',
      ];
      const code = reader.error && 'code' in reader.error ? Number(reader.error.code) : 0;
      throw new Error(messages[Math.max(0, code - 1)] ?? 'Could not read File');
    };
    reader.onloadend = () => callback?.(reader.result, file.name);
    reader[readMethods[mode]](file);
  }

  function install(
    body: HTMLElement,
    overlayInput?: HTMLElement | string | null,
    callback?: DragCallback,
    mode: DragReadMode = 'text',
    activeClass = '__fadingIn',
  ): 'mobile' | void {
    if ('ontouchstart' in runtimeWindow) return 'mobile';
    const overlay = overlayInput instanceof HTMLElement ? overlayInput : body;
    let entered = 0;

    const silence = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const onDragEnter = () => {
      entered += 1;
      window.setTimeout(() => {
        if (entered > 1) entered = 1;
      }, 10);
    };
    const onDragLeave = () => {
      entered -= 1;
      if (entered <= 0) {
        removeClass(overlay, activeClass);
        entered = 0;
      }
    };
    const onDrop = (event: DragEvent) => {
      silence(event);
      removeClass(overlay, activeClass);
      entered = 0;
      const files = event.dataTransfer?.files;
      if (!files?.length) return;
      for (let index = files.length - 1; index >= 0; index -= 1) {
        const file = files[index];
        if (file) readFile(file, callback, mode);
      }
    };

    body.parentElement?.addEventListener('dragenter', onDragEnter);
    body.addEventListener('dragleave', onDragLeave);
    body.addEventListener('dragover', silence);
    body.addEventListener('drop', onDrop);
  }

  const service: DragDropService = { install };
  runtimeWindow.AMDragDrop = service;
  runtimeWindow.dragNDrop = install;
})();
