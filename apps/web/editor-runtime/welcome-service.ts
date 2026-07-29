(() => {
  type WelcomeService = { show(): void; showScrollHint(): void };
  type WelcomeWindow = Window & {
    AMPreferences?: {
      get<Value>(key: string, fallback: Value): Value;
      set<Value>(key: string, value: Value): Value;
    };
    AMWelcomeService?: WelcomeService;
  };

  const runtimeWindow = window as WelcomeWindow;
  const editor = PKAudioEditor;
  let scrollHintShown = false;

  function showScrollHint() {
    if (!editor.isMobile || scrollHintShown) return;
    scrollHintShown = true;
    const toolbarContent = editor.ui?.el?.getElementsByClassName('pk_tbc')[0] as
      HTMLElement | undefined;
    if (!toolbarContent || toolbarContent.scrollWidth <= toolbarContent.clientWidth + 2) return;
    const hint = document.createElement('i');
    const bounds = toolbarContent.getBoundingClientRect();
    hint.className = 'pk_tbhint';
    hint.innerHTML = '&#8250;';
    hint.style.top = `${Math.trunc(bounds.top + bounds.height / 2 - 12)}px`;
    editor.ui?.el?.append(hint);
    runtimeWindow.setTimeout(() => hint.remove(), 3000);
  }

  function show() {
    let tips = '';
    let source = '';
    let mobileNote = '';
    if (editor.isMobile) {
      mobileNote = '(Optimized for desktop — sorry)<br/><br/>';
      tips =
        'Tips:<br/>Please make sure your device is not in silent mode. You may need to physically switch the silent-mode slider. ' +
        '<img src="phone-switch.jpg" style="max-width:224px;max-height:126px;width:40%;margin: 10px auto; display: block;"/>' +
        '<br/><br/>';
    } else {
      tips =
        'Tips:<br/>Keep in mind that most shortcuts use the <strong>Shift + <u>key</u></strong> combination. ' +
        '(for example, Shift+Z is undo, Shift+C is copy, Shift+X is cut, and so on.)<br/><br/>';
      source =
        'See the source code on <a href="https://github.com/pkalogiros/audiomass" target="_blank">GitHub</a><br/><br/>';
    }

    const modal = new PKSimpleModal({
      title: '<font style="font-size:15px">Welcome to AM</font>',
      ondestroy() {
        if (editor.ui?.InteractionHandler) editor.ui.InteractionHandler.on = false;
        editor.ui?.KeyHandler?.removeCallback?.('modalTemp');
        showScrollHint();
      },
      body:
        '<div style="overflow:auto;-webkit-overflow-scrolling:touch;max-width:580px;width:calc(100vw - 40px);max-height:calc(100vh - 340px);min-height:110px;font-size:13px; color:#95c6c6;padding-top:7px;">' +
        mobileNote +
        'AM is a free, open-source web-based audio and waveform editor.<br />It runs entirely in your browser without a server or plug-ins!' +
        '<br/><br/>' +
        tips +
        'You can load any audio format supported by your browser, edit it with fades, cuts, trims and gain changes, ' +
        'and apply many audio effects.<br/><br/>' +
        source +
        'I hope you enjoy the little music compositions. I wrote them a long time ago :)' +
        '</div>',
      setup(instance) {
        editor.ui?.InteractionHandler?.checkAndSet?.('modal');
        editor.ui?.KeyHandler?.addCallback?.('modalTemp', () => instance.Destroy(), [27]);
        const scroll = instance.el_body.getElementsByTagName('div')[0];
        const stopTouch = (event: TouchEvent) => event.stopPropagation();
        scroll?.addEventListener('touchstart', stopTouch, false);
        scroll?.addEventListener('touchmove', stopTouch, false);
      },
    });
    modal.Show();
    const cancel = document.getElementsByClassName('pk_modal_cancel')[0] as HTMLElement | undefined;
    if (cancel) cancel.innerHTML = '&nbsp; &nbsp; &nbsp; OK &nbsp; &nbsp; &nbsp;';
  }

  runtimeWindow.AMWelcomeService = { show, showScrollHint };
  runtimeWindow.setTimeout(() => {
    if (/(^|[?&])skipintro=1(&|$)/.test(runtimeWindow.location.search)) return;
    editor._deps.Wlc = show;
    let skipChance = 99;
    const seen = runtimeWindow.AMPreferences?.get('welcomeSeen', false) ?? false;
    if (!seen) {
      skipChance = 0;
      runtimeWindow.AMPreferences?.set('welcomeSeen', true);
    }
    if (Math.trunc(Math.random() * 100) < skipChance) return;
    show();
  }, 320);
})();
