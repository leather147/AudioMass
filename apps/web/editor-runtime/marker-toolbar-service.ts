(() => {
  type MarkerApp = AMEditorRuntimeApp & { __markerCreateButtonInstalled?: boolean };
  type MarkerService = { cleanName(value?: string | null): string; install(app: MarkerApp): void };
  type MarkerWindow = Window & {
    AMInstallMarkerCreateButton?: (app: MarkerApp) => void;
    AMMarkerToolbar?: MarkerService;
    OneUp?(message: string, duration?: number): void;
  };

  const runtimeWindow = window as MarkerWindow;
  const MAX_NAME_LENGTH = 11;

  function cleanName(value?: string | null) {
    return (value ?? '')
      .replace(/[\r\n\t]/g, ' ')
      .trim()
      .slice(0, MAX_NAME_LENGTH);
  }

  function markerIcon() {
    return (
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M12 3v14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M12 3l7 4.2-7 4.2L5 7.2 12 3z" fill="currentColor" opacity=".94"/>' +
      '<path d="M12 17l-3 4h6l-3-4z" fill="currentColor" opacity=".86"/>' +
      '</svg>'
    );
  }

  function install(app: MarkerApp) {
    if (!app || app.__markerCreateButtonInstalled) return;
    app.__markerCreateButtonInstalled = true;
    let button: HTMLButtonElement | null = null;
    let installFrame = 0;

    const query = <ElementType extends Element>(selector: string, root?: ParentNode | null) =>
      (root ?? document).querySelector<ElementType>(selector);

    function canCreateMarker() {
      if (app.multitrack?.IsOn?.()) return Boolean(app.multitrack.HasClips?.());
      return Boolean(app.engine?.wavesurfer?.getDuration?.());
    }

    function openDialog() {
      if (!canCreateMarker()) {
        runtimeWindow.OneUp?.('Load audio before adding a marker', 1200);
        return;
      }
      const modalId = 'mrk_add_named';
      const modal = new PKSimpleModal({
        title: 'New marker',
        clss: 'pk_fnt10 pk_new_marker_modal',
        ondestroy() {
          app.ui?.InteractionHandler?.forceUnset?.(modalId);
          app.ui?.KeyHandler?.removeCallback?.(`${modalId}esc`);
          app.ui?.KeyHandler?.removeCallback?.(`${modalId}en`);
        },
        buttons: [
          {
            title: 'Create',
            clss: 'pk_modal_a_accpt',
            callback(instance) {
              const input = instance.el_body.getElementsByTagName('input')[0];
              const name = cleanName(input?.value);
              if (!name) {
                runtimeWindow.OneUp?.('Enter a marker name', 1200);
                return;
              }
              app.fireEvent?.('MrkrAdd', { name });
              instance.Destroy();
            },
          },
        ],
        body:
          '<label for="k_new_mrkr">Marker name</label>' +
          '<p class="pk_marker_name_hint">The marker will be created at the current cursor position.</p>' +
          `<input style="width:100%;box-sizing:border-box;min-width:0" maxlength="${MAX_NAME_LENGTH}" class="pk_txt" type="text" id="k_new_mrkr" />`,
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
            input.value = 'Marker';
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
      button.className = 'pk_marker_add_btn';
      button.title = 'Create a new marker';
      button.setAttribute('aria-label', 'Create a new marker');
      button.innerHTML = `${markerIcon()}<span>Marker</span>`;
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openDialog();
      });
      const selection = query('.pk_selection', toolbar);
      const wave = query('.pk_comp_wave_badge', toolbar);
      if (selection) toolbar.insertBefore(button, selection);
      else if (wave?.nextSibling) toolbar.insertBefore(button, wave.nextSibling);
      else toolbar.append(button);
      return button;
    }

    function syncButtonState() {
      button?.classList.toggle('pk_disabled', !canCreateMarker());
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

    for (const event of ['DidUpdateMultitrack', 'DidUpdateLen', 'RequestResize', 'DidUnloadFile']) {
      app.listenFor?.(event, schedule);
    }
    const observer = new MutationObserver(() => {
      if (!button?.parentNode) schedule();
    });
    observer.observe(app.el ?? document.body, { childList: true, subtree: true });
    schedule();
    runtimeWindow.setTimeout(schedule, 250);
    runtimeWindow.setTimeout(schedule, 1200);
  }

  const service: MarkerService = { cleanName, install };
  runtimeWindow.AMMarkerToolbar = service;
  runtimeWindow.AMInstallMarkerCreateButton = install;
})();
