type ModalRuntimeValue = ReturnType<typeof JSON.parse>;

(() => {
  const runtimeGlobal: ModalRuntimeValue = globalThis;
  const window: ModalRuntimeValue = runtimeGlobal.window;
  const document: ModalRuntimeValue = runtimeGlobal.document;
  const PKAudioEditor: ModalRuntimeValue = runtimeGlobal.PKAudioEditor;
  const PKSimpleModal: ModalRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('PKSimpleModal');
  const PKAudioFXModal: ModalRuntimeValue =
    runtimeGlobal.window.AMLateRuntimeValue('PKAudioFXModal');
  const OneUp: ModalRuntimeValue = runtimeGlobal.OneUp;
  const WaveSurfer: ModalRuntimeValue = runtimeGlobal.WaveSurfer;
  const dragNDrop: ModalRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('dragNDrop');
  const ID3v2: ModalRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID3v2');
  const ID4: ModalRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID4');
  const wasm_denoise_stream_perf: ModalRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue(
    'wasm_denoise_stream_perf',
  );
  const app: ModalRuntimeValue = PKAudioEditor;
  (function (this: ModalRuntimeValue, w?: ModalRuntimeValue, d?: ModalRuntimeValue) {
    var _id: ModalRuntimeValue = 0;
    function PKSimpleModal(this: ModalRuntimeValue, config?: ModalRuntimeValue) {
      var q: ModalRuntimeValue = this;
      this.id = config.id ? config.id : ++_id;
      var el: ModalRuntimeValue = d.createElement('div');
      this.els = {
        toolbar: [],
        bottom: [],
      };
      el.className = 'pk_modal ' + (config.clss ? config.clss : '');
      q.el = el;
      // backdrop
      var el_back: ModalRuntimeValue = d.createElement('div');
      el_back.className = 'pk_modal_back';
      this.el_back = el_back;
      // var centerer
      var el_cont: ModalRuntimeValue = d.createElement('div');
      el_cont.className = 'pk_modal_cnt';
      this.el_cont = el_cont;
      // title
      var el_title: ModalRuntimeValue = d.createElement('div');
      el_title.className = 'pk_noselect pk_modal_title';
      el_title.innerHTML = '<span>' + (config.title || '') + '</span>';
      el.appendChild(el_title);
      this.el_title = el_title;
      // main
      var el_main: ModalRuntimeValue = d.createElement('div');
      el_main.className = 'pk_modal_main';
      el.appendChild(el_main);
      this.el_body = el_main;
      // bottom buttons
      var el_bottom: ModalRuntimeValue = d.createElement('div');
      el_bottom.className = 'pk_noselect pk_modal_bottom';
      // -----------
      var a_cancel: ModalRuntimeValue = d.createElement('a');
      a_cancel.innerHTML = 'CANCEL';
      a_cancel.className = 'pk_modal_cancel pk_modal_a_bottom';
      a_cancel.onclick = function (this: ModalRuntimeValue) {
        q.Destroy();
      };
      el_bottom.appendChild(a_cancel);
      // check if we need to construct more buttons from the config...
      if (config.buttons && config.buttons.length > 0) {
        for (var i: ModalRuntimeValue = 0; i < config.buttons.length; ++i) {
          var curr: ModalRuntimeValue = config.buttons[i];
          if (!curr.title || !curr.callback) continue;
          var a_bottom: ModalRuntimeValue = d.createElement('a');
          a_bottom.innerHTML = curr.title;
          a_bottom.className = 'pk_modal_a_bottom ' + (curr.clss ? curr.clss : '');
          if (curr.callback) {
            (function (this: ModalRuntimeValue, callback?: ModalRuntimeValue) {
              a_bottom.onclick = function (this: ModalRuntimeValue) {
                callback(q);
              };
            })(curr.callback);
          }
          q.els.bottom.push(a_bottom);
          el_bottom.appendChild(a_bottom);
        }
      }
      el.appendChild(el_bottom);
      // -----
      if (config.toolbar && config.toolbar.length > 0) {
        for (var i: ModalRuntimeValue = 0; i < config.toolbar.length; ++i) {
          var curr: ModalRuntimeValue = config.toolbar[i];
          if (!curr.title || !curr.callback) continue;
          var a_link: ModalRuntimeValue = d.createElement('a');
          a_link.innerHTML = curr.title + (curr.tooltip ? '<span>' + curr.tooltip + '</span>' : '');
          a_link.className = 'pk_modal_a_top ' + (curr.clss ? curr.clss : '');
          el_title.appendChild(a_link);
          if (curr.callback) {
            (function (this: ModalRuntimeValue, callback?: ModalRuntimeValue) {
              a_link.onclick = function (this: ModalRuntimeValue) {
                callback(q, this);
              };
            })(curr.callback);
          }
          q.els.toolbar.push(a_link);
        }
      }
      this.ondestroy = config.ondestroy;
      if (config.body) q.el_body.innerHTML = config.body;
      if (config.onpreset) this.onpreset = config.onpreset;
      if (config.setup) config.setup(this);
    }
    PKSimpleModal.prototype.Show = function (this: ModalRuntimeValue) {
      this.el_back.appendChild(this.el_cont);
      this.el_cont.appendChild(this.el);
      d.body.appendChild(this.el_back);
      return this;
    };
    PKSimpleModal.prototype.Destroy = function (this: ModalRuntimeValue) {
      if (this.ondestroy) {
        this.ondestroy(this);
        this.ondestroy = null;
      }
      this.els = null;
      d.body.removeChild(this.el_back);
    };
    // Extended modal
    function PKAudioFXModal(
      this: ModalRuntimeValue,
      config?: ModalRuntimeValue,
      app?: ModalRuntimeValue,
    ) {
      var toolbar: ModalRuntimeValue = null;
      if (config.preview) {
        toolbar = [
          {
            title: 'ON',
            clss: 'pk_inact',
            tooltip: 'Toggle Bypass',
            callback: function (
              this: ModalRuntimeValue,
              q?: ModalRuntimeValue,
              el?: ModalRuntimeValue,
            ) {
              app.fireEvent('RequestActionFX_TOGGLE');
            },
          },
          {
            title: 'Preview',
            callback: function (this: ModalRuntimeValue, q?: ModalRuntimeValue) {
              config.preview && config.preview(q);
            },
          },
        ];
      }
      var inner_modal: ModalRuntimeValue = new (PKSimpleModal as ModalRuntimeValue)({
        id: config.id,
        title: config.title,
        clss: config.clss,
        presets: config.presets,
        updateFilter: config.updateFilter,
        ondestroy: function (this: ModalRuntimeValue, q?: ModalRuntimeValue) {
          app.fireEvent('DidCloseFX_UI');
          app.stopListeningFor('DidStartPreview', q._evstart);
          app.stopListeningFor('DidStopPreview', q._evstop);
          app.stopListeningFor('DidTogglePreview', q._evtoggle);
          app.stopListeningFor('DidSetPresets', q._updatePresets);
          app.stopListeningFor('RequestActionFX_UPDATE_PREVIEW', q._updpreview);
          app.stopListeningFor('RequestSetPresetActive', q._updpreset);
          if (q._upd_t) {
            w.clearTimeout(q._upd_t);
            q._upd_t = 0;
          }
          app.fireEvent('RequestActionFX_PREVIEW_STOP');
          // if preview remove callback
          app.ui.KeyHandler.removeCallback('ksp' + q.id);
          config.ondestroy && config.ondestroy(q);
        },
        toolbar: toolbar,
        buttons: config.buttons,
        body: config.body,
        onpreset: config.onpreset,
        setup: function (this: ModalRuntimeValue, q?: ModalRuntimeValue) {
          app.fireEvent('RequestActionFX_TOGGLE', 1);
          var slf: ModalRuntimeValue = this;
          app.ui.KeyHandler.addCallback(
            'ksp' + q.id,
            function (this: ModalRuntimeValue, key?: ModalRuntimeValue, map?: ModalRuntimeValue) {
              if (!app.ui.InteractionHandler.check('modalfx')) return;
              var tb: ModalRuntimeValue = slf.toolbar;
              if (tb && tb.length > 0) {
                var k: ModalRuntimeValue = tb.length;
                while (k-- > 0) {
                  if (tb[k].title === 'Preview') {
                    tb[k].callback(q);
                    break;
                  }
                }
              }
            },
            [32],
          );
          q._evstart = function (this: ModalRuntimeValue) {
            q.els.toolbar[0].classList.remove('pk_inact');
            q.els.toolbar[1].classList.add('pk_act');
          };
          q._evstop = function (this: ModalRuntimeValue) {
            q.els.toolbar[0].classList.add('pk_inact');
            q.els.toolbar[1].classList.remove('pk_act');
          };
          q._evtoggle = function (this: ModalRuntimeValue, val?: ModalRuntimeValue) {
            var el: ModalRuntimeValue = q.els.toolbar[0];
            el.firstChild.nodeValue = val ? 'ON' : 'OFF';
          };
          q._updpreview = function (this: ModalRuntimeValue, val?: ModalRuntimeValue) {
            var sel_opt: ModalRuntimeValue = q.el_presets.options[q.el_presets.selectedIndex];
            var btn: ModalRuntimeValue = q.el.getElementsByClassName('pk_sel_edt')[0];
            if (val === 't') {
              if (q._upd_t) w.clearTimeout(q._upd_t);
              q._upd_t = 0;
              if (sel_opt && sel_opt.getAttribute('data-custom')) {
                btn.style.visibility = 'visible';
                btn.style.opacity = '1';
                app.stopListeningFor('RequestActionFX_UPDATE_PREVIEW', q._updpreview);
              } else {
                btn.style.visibility = 'hidden';
                btn.style.opacity = '0';
                app.stopListeningFor('RequestActionFX_UPDATE_PREVIEW', q._updpreview);
                q._upd_t = w.setTimeout(function (this: ModalRuntimeValue) {
                  q._upd_t = 0;
                  app.listenFor('RequestActionFX_UPDATE_PREVIEW', q._updpreview);
                }, 100);
              }
              return;
            }
            btn.style.visibility = 'visible';
            btn.style.opacity = '1';
            app.stopListeningFor('RequestActionFX_UPDATE_PREVIEW', q._updpreview);
          };
          q._updpreset = function (
            this: ModalRuntimeValue,
            fx_id?: ModalRuntimeValue,
            preset_id?: ModalRuntimeValue,
          ) {
            if (fx_id && fx_id !== q.id) {
              return;
            }
            var opts: ModalRuntimeValue = q.el_presets.getElementsByTagName('option');
            var ll: ModalRuntimeValue = opts.length;
            var curr: ModalRuntimeValue = null;
            while (ll-- > 0) {
              curr = opts[ll];
              if (curr.getAttribute('data-custom') === preset_id) {
                curr.selected = 'selected';
                break;
              }
            }
          };
          q._updatePresets = function (
            this: ModalRuntimeValue,
            fx_id?: ModalRuntimeValue,
            presets?: ModalRuntimeValue,
          ) {
            if (fx_id && fx_id !== q.id) {
              return;
            }
            var d: ModalRuntimeValue = document;
            var sel_presets: ModalRuntimeValue = q.el.getElementsByClassName('pk_sel');
            // if presets exist remove them
            if (sel_presets.length > 0) {
              sel_presets = sel_presets[0];
              var opts: ModalRuntimeValue = sel_presets.getElementsByTagName('option');
              var ll: ModalRuntimeValue = opts.length;
              var curr: ModalRuntimeValue = null;
              while (ll-- > 0) {
                curr = opts[ll];
                if (curr.getAttribute('data-custom')) {
                  sel_presets.removeChild(curr);
                }
              }
              if (presets.length === 0) return;
              var opt: ModalRuntimeValue = d.createElement('option');
              // opt.value = '---custom----';
              opt.setAttribute('disabled', '1');
              opt.setAttribute('data-custom', '1');
              opt.innerHTML = '----custom-----';
              sel_presets.appendChild(opt);
              for (var i: ModalRuntimeValue = 0; i < presets.length; ++i) {
                var opt: ModalRuntimeValue = d.createElement('option');
                var curr: ModalRuntimeValue = presets[i];
                opt.value = curr.val;
                opt.setAttribute('data-custom', curr.id);
                opt.innerHTML = curr.name;
                sel_presets.appendChild(opt);
              }
              return;
            } else {
              sel_presets = d.createElement('select');
              sel_presets.className = 'pk_sel';
            }
            if (presets.length === 0) return;
            for (var i: ModalRuntimeValue = -1; i < presets.length; ++i) {
              var opt: ModalRuntimeValue = d.createElement('option');
              if (i === -1) {
                opt.value = 'null';
                opt.innerHTML = 'Presets';
              } else {
                var curr: ModalRuntimeValue = presets[i];
                opt.value = curr.val;
                opt.innerHTML = curr.name;
              }
              sel_presets.appendChild(opt);
            }
            sel_presets.onchange = function (this: ModalRuntimeValue) {
              var val_arr: ModalRuntimeValue = this.value.split(',');
              var els: ModalRuntimeValue = q.el.getElementsByTagName('input');
              q._updpreview('t');
              if (q.onpreset) {
                q.onpreset(this.value);
                return;
              }
              var len: ModalRuntimeValue = els.length;
              for (var i: ModalRuntimeValue = 0; i < len; ++i) {
                if (!val_arr[i]) break;
                var curr_val: ModalRuntimeValue = val_arr[i].trim();
                var curr_input: ModalRuntimeValue = els[i];
                if (curr_val === 'null') continue;
                if (curr_input.type === 'checkbox' || curr_input.type === 'radio')
                  curr_input.checked = curr_val;
                else {
                  curr_input.value = curr_val;
                  curr_input.oninput && curr_input.oninput.apply(curr_input);
                }
              }
            };
            var btm: ModalRuntimeValue = q.el.getElementsByClassName('pk_modal_bottom')[0];
            btm.appendChild(sel_presets);
            q.el_presets = sel_presets;
            // now add preset edit button
            var edit_presets: ModalRuntimeValue = d.createElement('a');
            edit_presets.className = 'pk_sel_edt';
            edit_presets.innerHTML = '...<span>Save or Modify preset</span>';
            edit_presets.onclick = function (this: ModalRuntimeValue) {
              app.fireEvent('RequestSavePreset');
            };
            btm.appendChild(edit_presets);
            app.listenFor('RequestActionFX_UPDATE_PREVIEW', q._updpreview);
            app.listenFor('RequestSetPresetActive', q._updpreset);
          };
          app.listenFor('DidStartPreview', q._evstart);
          app.listenFor('DidStopPreview', q._evstop);
          app.listenFor('DidTogglePreview', q._evtoggle);
          app.fireEvent('DidOpenFX_UI', q);
          if (config.updateFilter) q.updateFilter = config.updateFilter;
          if (config.presets) {
            q._updatePresets(null, config.presets);
            if (config.custom_pres) q._updatePresets(null, config.custom_pres);
            app.listenFor('DidSetPresets', q._updatePresets);
          }
          config.setup && config.setup(q);
        },
      });
      return inner_modal;
    }
    w.PKSimpleModal = PKSimpleModal;
    w.PKAudioFXModal = PKAudioFXModal;
  })(window, document);
})();
