(() => {
  type ClipApp = AMEditorRuntimeApp & { __clipRenameButtonInstalled?: boolean };
  type ClipRenameService = {
    cleanName(value?: string | null): string;
    install(app: ClipApp): void;
  };
  type ClipWindow = Window & {
    AMClipRenameToolbar?: ClipRenameService;
    AMInstallClipRenameButton?: (app: ClipApp) => void;
    OneUp?(message: string, duration?: number): void;
  };

  const runtimeWindow = window as ClipWindow;
  const MAX_NAME_LENGTH = 64;

  function cleanName(value?: string | null) {
    return (value ?? '')
      .replace(/[\r\n\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_NAME_LENGTH);
  }

  function renameIcon() {
    return (
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M4 7.5h10.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".82"/>' +
      '<path d="M4 12h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".64"/>' +
      '<path d="M4 16.5h5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".46"/>' +
      '<path d="M13.2 17.8l1.1-4.2 5.8-5.8a1.7 1.7 0 0 1 2.4 2.4l-5.8 5.8-4.2 1.1.7-2.9z" fill="currentColor" opacity=".96"/>' +
      '<path d="M18.8 8.9l2.3 2.3" fill="none" stroke="#071014" stroke-width="1.25" stroke-linecap="round" opacity=".72"/>' +
      '</svg>'
    );
  }

  function install(app: ClipApp) {
    if (!app || app.__clipRenameButtonInstalled) return;
    app.__clipRenameButtonInstalled = true;
    let button: HTMLButtonElement | null = null;
    let selectedClip: AMRuntimeClip | null = null;
    let installFrame = 0;

    const query = <ElementType extends Element>(selector: string, root?: ParentNode | null) =>
      (root ?? document).querySelector<ElementType>(selector);
    const multitrackEnabled = () => Boolean(app.multitrack?.IsOn?.());
    const currentClipNode = () =>
      query<HTMLElement>('.pk_mt_clip.pk_mt_clip_sel', app.el) ??
      query<HTMLElement>('.pk_mt_clip_sel', app.el);
    const selectedClipId = () => currentClipNode()?.getAttribute('data-clip');
    const canRename = () =>
      Boolean(
        multitrackEnabled() &&
        selectedClip &&
        (!selectedClipId() || selectedClipId() === selectedClip.id),
      );

    function syncLabel(name: string) {
      const label = currentClipNode()?.querySelector('span');
      if (label) label.textContent = name;
    }

    function pushUndo(previous: unknown) {
      if (!previous || !app.fireEvent) return;
      const data = app.engine?.wavesurfer?.backend?.buffer;
      app.fireEvent('StateRequestPush', { type: 'mult', desc: 'Rename Clip', mt: previous, data });
    }

    function renameTo(value?: string | null) {
      const name = cleanName(value);
      if (!name) {
        runtimeWindow.OneUp?.('Enter a clip name', 1200);
        return false;
      }
      if (!canRename() || !selectedClip) {
        runtimeWindow.OneUp?.('Select an audio clip', 1200);
        return false;
      }
      if (name === selectedClip.name) return true;
      const previous = app.multitrack?.getState?.();
      selectedClip.name = name;
      pushUndo(previous);
      syncLabel(name);
      app.fireEvent?.('DidSelectClip', selectedClip);
      app.fireEvent?.('DidUpdateMultitrack');
      runtimeWindow.OneUp?.('Clip renamed', 900);
      return true;
    }

    function openDialog() {
      if (!canRename() || !selectedClip) {
        runtimeWindow.OneUp?.('Select an audio clip', 1200);
        return;
      }
      const modalId = 'clip_rename_named';
      const currentName = cleanName(selectedClip.name || 'Audio') || 'Audio';
      const modal = new PKSimpleModal({
        title: 'Clip name',
        clss: 'pk_fnt10 pk_rename_clip_modal',
        ondestroy() {
          app.ui?.InteractionHandler?.forceUnset?.(modalId);
          app.ui?.KeyHandler?.removeCallback?.(`${modalId}esc`);
          app.ui?.KeyHandler?.removeCallback?.(`${modalId}en`);
        },
        buttons: [
          {
            title: 'Save',
            clss: 'pk_modal_a_accpt',
            callback(instance) {
              const input = instance.el_body.getElementsByTagName('input')[0];
              if (renameTo(input?.value)) instance.Destroy();
            },
          },
        ],
        body:
          '<label for="k_clip_rename">Clip name</label>' +
          '<p class="pk_clip_name_hint">The name will be shown on the selected audio clip.</p>' +
          `<input style="width:100%;box-sizing:border-box;min-width:0" maxlength="${MAX_NAME_LENGTH}" class="pk_txt" type="text" id="k_clip_rename" />`,
        setup(instance) {
          app.ui?.InteractionHandler?.forceSet?.(modalId);
          app.ui?.KeyHandler?.addCallback?.(
            `${modalId}esc`,
            () => {
              if (!app.ui?.InteractionHandler?.check || app.ui.InteractionHandler.check(modalId)) {
                instance.Destroy();
              }
            },
            [27],
          );
          app.ui?.KeyHandler?.addCallback?.(
            `${modalId}en`,
            () => {
              if (!app.ui?.InteractionHandler?.check || app.ui.InteractionHandler.check(modalId)) {
                instance.els.bottom[0]?.click();
              }
            },
            [13],
          );
          runtimeWindow.setTimeout(() => {
            const input = instance.el?.getElementsByTagName('input')[0];
            if (!input) return;
            input.value = currentName;
            input.focus();
            input.selectionStart = 0;
            input.selectionEnd = input.value.length;
          }, 20);
        },
      });
      modal.Show();
    }

    function makeButton() {
      const toolbar = query<HTMLElement>('.pk_tb', app.el) ?? query<HTMLElement>('.pk_tb');
      if (!toolbar) return null;
      if (button?.parentNode === toolbar) return button;
      button = document.createElement('button');
      button.type = 'button';
      button.tabIndex = -1;
      button.className = 'pk_clip_rename_btn pk_disabled';
      button.title = 'Rename selected audio clip';
      button.setAttribute('aria-label', 'Rename selected audio clip');
      button.innerHTML = `${renameIcon()}<span>Name</span>`;
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openDialog();
      });
      const selection = query('.pk_selection', toolbar);
      if (selection) toolbar.insertBefore(button, selection);
      else toolbar.append(button);
      return button;
    }

    function syncButtonState() {
      if (!button) return;
      button.classList.toggle('pk_disabled', !canRename());
      if (selectedClip?.name) button.dataset.name = selectedClip.name;
      else button.removeAttribute('data-name');
    }

    function ensure() {
      installFrame = 0;
      makeButton();
      syncButtonState();
    }

    function schedule() {
      if (installFrame) return;
      installFrame = runtimeWindow.requestAnimationFrame(ensure);
    }

    app.listenFor?.('DidSelectClip', (clip) => {
      selectedClip = (clip as AMRuntimeClip | null | undefined) ?? null;
      schedule();
    });
    app.listenFor?.('DidDeselectClip', () => {
      selectedClip = null;
      schedule();
    });
    app.listenFor?.('DidUpdateMultitrack', schedule);
    app.listenFor?.('RequestResize', schedule);
    const observer = new MutationObserver(() => {
      if (!button?.parentNode) schedule();
      else syncButtonState();
    });
    observer.observe(app.el ?? document.body, { childList: true, subtree: true });
    schedule();
    runtimeWindow.setTimeout(schedule, 250);
    runtimeWindow.setTimeout(schedule, 1200);
  }

  const service: ClipRenameService = { cleanName, install };
  runtimeWindow.AMClipRenameToolbar = service;
  runtimeWindow.AMInstallClipRenameButton = install;
})();
