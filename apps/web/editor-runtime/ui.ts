type UiRuntimeValue = ReturnType<typeof JSON.parse>;

(() => {
  const runtimeGlobal: UiRuntimeValue = globalThis;
  const window: UiRuntimeValue = runtimeGlobal.window;
  const document: UiRuntimeValue = runtimeGlobal.document;
  const PKAudioEditor: UiRuntimeValue = runtimeGlobal.PKAudioEditor;
  const PKSimpleModal: UiRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('PKSimpleModal');
  const PKAudioFXModal: UiRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('PKAudioFXModal');
  const OneUp: UiRuntimeValue = runtimeGlobal.OneUp;
  const WaveSurfer: UiRuntimeValue = runtimeGlobal.WaveSurfer;
  const dragNDrop: UiRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('dragNDrop');
  const ID3v2: UiRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID3v2');
  const ID4: UiRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID4');
  const wasm_denoise_stream_perf: UiRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue(
    'wasm_denoise_stream_perf',
  );
  const app: UiRuntimeValue = PKAudioEditor;
  (function (this: UiRuntimeValue, w?: UiRuntimeValue, d?: UiRuntimeValue, PKAE?: UiRuntimeValue) {
    'use strict';
    //
    // MAIN UI CLASS
    function activeMultitrackFor(this: UiRuntimeValue, app?: UiRuntimeValue) {
      var mt: UiRuntimeValue = (app && app.multitrack) || (PKAE && PKAE.multitrack);
      var root: UiRuntimeValue = (app && app.el) || (PKAE && PKAE.el);
      return mt && mt.IsOn && (mt.IsOn() || (root && root.classList.contains('pk_mt_on')))
        ? mt
        : null;
    }
    function activeCursorTimeFor(this: UiRuntimeValue, app?: UiRuntimeValue) {
      var mt: UiRuntimeValue = activeMultitrackFor(app);
      var ws: UiRuntimeValue = app.engine && app.engine.wavesurfer;
      return mt ? mt.GetCursor() : ws ? ws.getCurrentTime() : 0;
    }
    function activeDurationFor(this: UiRuntimeValue, app?: UiRuntimeValue) {
      var mt: UiRuntimeValue = activeMultitrackFor(app);
      var ws: UiRuntimeValue = app.engine && app.engine.wavesurfer;
      return mt ? mt.GetDuration() : ws ? ws.getDuration() : 0;
    }
    function activeRegionFor(this: UiRuntimeValue, app?: UiRuntimeValue) {
      var mt: UiRuntimeValue = activeMultitrackFor(app);
      var ws: UiRuntimeValue = app.engine && app.engine.wavesurfer;
      return mt && mt.GetRegion ? mt.GetRegion() : ws && ws.regions ? ws.regions.list[0] : null;
    }
    function activeZoomFor(this: UiRuntimeValue, app?: UiRuntimeValue) {
      var mt: UiRuntimeValue = activeMultitrackFor(app);
      var ws: UiRuntimeValue = app.engine && app.engine.wavesurfer;
      return mt
        ? mt.GetSeekZoomFactor
          ? mt.GetSeekZoomFactor()
          : mt.GetZoomFactor()
        : ws
          ? ws.ZoomFactor
          : 1;
    }
    function activeSeekRampFor(this: UiRuntimeValue, app?: UiRuntimeValue) {
      return 0.15;
    }
    function activeSeekWarmupFor(this: UiRuntimeValue, app?: UiRuntimeValue) {
      return 2;
    }
    function activeReadyFor(this: UiRuntimeValue, app?: UiRuntimeValue) {
      return !!activeMultitrackFor(app) || !!(app.engine && app.engine.is_ready);
    }
    function setMenuItemChecked(
      this: UiRuntimeValue,
      button?: UiRuntimeValue,
      checked?: UiRuntimeValue,
    ) {
      if (!button) return;
      if (w.AMMenuChecks && w.AMMenuChecks.set) {
        w.AMMenuChecks.set(button, checked);
        return;
      }
      button.classList.toggle('pk_menu_checked', !!checked);
      button.setAttribute('role', 'menuitemcheckbox');
      button.setAttribute('aria-checked', checked ? 'true' : 'false');
    }
    function seekMarkerEdgeFor(this: UiRuntimeValue, app?: UiRuntimeValue, dir?: UiRuntimeValue) {
      return !!(app.mrk && app.mrk.edge && app.mrk.edge(dir));
    }
    function seekRegionMarkerEdgeFor(
      this: UiRuntimeValue,
      app?: UiRuntimeValue,
      dir?: UiRuntimeValue,
    ) {
      var mt: UiRuntimeValue = activeMultitrackFor(app);
      var r: UiRuntimeValue = activeRegionFor(app);
      var total: UiRuntimeValue = activeDurationFor(app);
      var pos: UiRuntimeValue, start: UiRuntimeValue, end: UiRuntimeValue;
      if (r && total > 0) {
        pos = mt
          ? mt.GetMarker
            ? mt.GetMarker()
            : mt.GetCursor()
          : app.engine.wavesurfer.ActiveMarker;
        start = mt ? r.start : r.start / total;
        end = mt ? r.end : r.end / total;
        if (dir < 0) {
          if (pos > end + 0.004) {
            app.fireEvent('RequestSeekTo', r.end / total - 0.0001);
            return true;
          }
          if (pos > start + 0.004) {
            app.fireEvent('RequestSeekTo', r.start / total);
            return true;
          }
        } else {
          if (pos < start - 0.004) {
            app.fireEvent('RequestSeekTo', r.start / total);
            return true;
          }
          if (pos < end - 0.004) {
            app.fireEvent('RequestSeekTo', r.end / total);
            return true;
          }
        }
      }
      if (seekMarkerEdgeFor(app, dir)) return true;
      app.fireEvent('RequestSeekTo', dir < 0 ? 0 : 1);
      return true;
    }
    var PKUI: UiRuntimeValue = function (this: UiRuntimeValue, app?: UiRuntimeValue) {
      var q: UiRuntimeValue = this;
      this.el = app.el;
      // if mobile add proper class
      this.el.className += ' pk_app' + (app.isMobile ? ' pk_mob' : '');
      // hold refferences to the event functions
      this.fireEvent = app.fireEvent;
      this.listenFor = app.listenFor;
      // keep track of the active UI element
      this.InteractionHandler = {
        on: false,
        by: null,
        arr: [],
        check: function (this: UiRuntimeValue, _name?: UiRuntimeValue) {
          if (this.on && this.by !== _name) {
            return false;
          }
          return true;
        },
        checkAndSet: function (this: UiRuntimeValue, _name?: UiRuntimeValue) {
          if (!this.check(_name)) return false;
          this.on = true;
          this.by = _name;
          return true;
        },
        forceSet: function (this: UiRuntimeValue, _name?: UiRuntimeValue) {
          if (this.on) {
            this.arr.push({
              on: this.on,
              by: this.by,
            });
          }
          this.on = true;
          this.by = _name;
        },
        forceUnset: function (this: UiRuntimeValue, _name?: UiRuntimeValue) {
          if (this.check(_name)) {
            var prev: UiRuntimeValue = this.arr.pop();
            if (prev) {
              this.on = prev.on;
              this.by = prev.by;
            } else {
              this.on = false;
              this.by = null;
            }
          }
          // ---
        },
      };
      if (app.isMobile) {
        d.body.className = 'pk_stndln';
        var fxd: UiRuntimeValue = d.createElement('div');
        fxd.className = 'pk_fxd';
        fxd.appendChild(this.el);
        d.body.appendChild(fxd);
        _makeMobileScroll(this);
      }
      this.KeyHandler = new app._deps.keyhandler(this); // initializing keyhandler
      this.TopHeader = new (_makeUITopHeader as UiRuntimeValue)(_topbarConfig(app), this); // topmost menu
      this.Toolbar = new (_makeUIToolbar as UiRuntimeValue)(this); // main toolbar and controls
      this.footer = new (_makeUIMainView as UiRuntimeValue)(this, app);
      this.BarBtm = new (_makeUIBarBottom as UiRuntimeValue)(this, app);
      this.MainHeight = function (this: UiRuntimeValue) {
        var h: UiRuntimeValue =
          app.isMobile && w.visualViewport ? w.visualViewport.height : w.innerHeight;
        var used: UiRuntimeValue = 0;
        var root: UiRuntimeValue = this.el;
        var hdr: UiRuntimeValue = root.getElementsByClassName('pk_hdr')[0];
        var tbc: UiRuntimeValue = root.getElementsByClassName('pk_tbc')[0];
        var ftr: UiRuntimeValue = root.getElementsByClassName('pk_ftr')[0];
        if (hdr) used += hdr.offsetHeight;
        if (tbc) used += tbc.offsetHeight;
        if (ftr) used += ftr.offsetHeight;
        if (this.BarBtm && this.BarBtm.on) used += this.BarBtm.height;
        return Math.max(112, h - used);
      };
      if (app.isMobile && w.visualViewport) {
        var resize_raf: UiRuntimeValue = 0;
        w.visualViewport.addEventListener('resize', function (this: UiRuntimeValue) {
          if (resize_raf) return;
          resize_raf = w.requestAnimationFrame(function (this: UiRuntimeValue) {
            resize_raf = 0;
            app.fireEvent('RequestResize');
          });
        });
      }
      this.Dock = function (
        this: UiRuntimeValue,
        id?: UiRuntimeValue,
        arg1?: UiRuntimeValue,
        arg2?: UiRuntimeValue,
      ) {
        app.fireEvent(id, arg1, arg2);
      };
      this.GetActiveCursor = function (this: UiRuntimeValue) {
        return activeCursorTimeFor(app);
      };
      app.listenFor('ShowError', function (this: UiRuntimeValue, message?: UiRuntimeValue) {
        new PKSimpleModal({
          title: 'Oops! Something is not right',
          clss: 'pk_modal_anim',
          ondestroy: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
            app.ui.InteractionHandler.on = false;
            app.ui.KeyHandler.removeCallback('modalTempErr');
          },
          buttons: [],
          body: '<p>' + message + '</p>',
          setup: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
            app.fireEvent('RequestPause');
            app.fireEvent('RequestRegionClear');
            app.ui.InteractionHandler.checkAndSet('modal');
            app.ui.KeyHandler.addCallback(
              'modalTempErr',
              function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                q.Destroy();
              },
              [27],
            );
          },
        }).Show();
      });
      app.listenFor('RequestKeyDown', function (this: UiRuntimeValue, key?: UiRuntimeValue) {
        q.KeyHandler.keyDown(key, null);
        q.KeyHandler.keyUp(key);
      });
    };
    //top bar config list
    function _topbarConfig(this: UiRuntimeValue, app?: UiRuntimeValue, ui?: UiRuntimeValue) {
      var menu: UiRuntimeValue = [
        {
          name: 'File',
          children: [
            {
              name: 'Export / Download',
              action: function (this: UiRuntimeValue) {
                new PKSimpleModal({
                  title: 'Export / Download',
                  ondestroy: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                    app.ui.InteractionHandler.on = false;
                    app.ui.KeyHandler.removeCallback('modalTemp');
                  },
                  buttons: [
                    {
                      title: 'Export',
                      clss: 'pk_modal_a_accpt',
                      callback: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                        var input: UiRuntimeValue = q.el_body.getElementsByTagName('input')[0];
                        var value: UiRuntimeValue = input.value.trim();
                        var format: UiRuntimeValue = 'mp3';
                        var kbps: UiRuntimeValue = 128;
                        var export_sel: UiRuntimeValue = false;
                        var stereo: UiRuntimeValue = false;
                        var bit_depth: UiRuntimeValue = 16;
                        var radios: UiRuntimeValue = q.el_body.getElementsByClassName('pk_check');
                        var l: UiRuntimeValue = radios.length;
                        while (l-- > 0) {
                          if (radios[l].checked) {
                            if (radios[l].name == 'frmtex') {
                              format = radios[l].value;
                            } else if (radios[l].name == 'xport') {
                              if (radios[l].value === 'sel') {
                                var region: UiRuntimeValue = activeRegionFor(app);
                                if (!region) export_sel = false;
                                else export_sel = [region.start, region.end];
                              }
                            } else if (radios[l].name == 'chnl') {
                              if (radios[l].value === 'stereo') {
                                stereo = true;
                              }
                            } else if (radios[l].name == 'wavbits') {
                              bit_depth = radios[l].value / 1;
                            } else {
                              kbps = radios[l].value / 1;
                            }
                          }
                        }
                        var dither_chk: UiRuntimeValue = document.getElementById('wav-dither');
                        var dither: UiRuntimeValue = !!(dither_chk && dither_chk.checked);
                        if (format === 'amss') {
                          var mt: UiRuntimeValue = activeMultitrackFor(app);
                          if (mt) mt.ExportSession(value);
                          q.Destroy();
                          return;
                        }
                        if (format == 'flac') {
                          kbps = document.getElementById('flac-comp').value / 1;
                        }
                        app.engine.DownloadFile(
                          value,
                          format,
                          kbps,
                          export_sel,
                          stereo,
                          bit_depth,
                          dither,
                        );
                        q.Destroy();
                        // -
                      },
                    },
                  ],
                  body:
                    '<div class="pk_row"><label for="k0">File Name</label>' +
                    '<input style="min-width:250px" placeholder="mp3 filename" value="audiomass-output.mp3" ' +
                    'class="pk_txt" type="text" id="k0" /></div>' +
                    '<div class="pk_row" id="frmtex" style="padding-bottom:4px"><label style="display:inline">Format</label>' +
                    '<input type="radio" class="pk_check" id="k01" name="frmtex" checked value="mp3">' +
                    '<label for="k01">mp3</label>' +
                    '<input type="radio" class="pk_check" id="k02" name="frmtex" value="wav">' +
                    '<label for="k02">wav <i>(44100hz)</i></label>' +
                    '<input type="radio" class="pk_check" id="k03" name="frmtex" value="flac">' +
                    '<label for="k03">flac</i></label>' +
                    '<br class="pk_amss"><input type="radio" class="pk_check pk_amss" id="k04" name="frmtex" value="amss">' +
                    '<label class="pk_amss" for="k04">session file (.amss)</label>' +
                    '</div>' +
                    '<div class="pk_row" id="frmtex-mp3"><input type="radio" class="pk_check" id="k1" name="rdslnc" checked value="128">' +
                    '<label  for="k1">128kbps</label>' +
                    '<input type="radio" class="pk_check"  id="k2" name="rdslnc" value="192">' +
                    '<label for="k2">192kbps</label>' +
                    '<input type="radio" class="pk_check"  id="k3" name="rdslnc" value="256">' +
                    '<label for="k3">256kbps</label></div>' +
                    '<div class="pk_row" style="display:none" id="frmtex-flac">' +
                    '<label>Flac: Compression Level</label>' +
                    '<input type="range" class="pk_horiz" min="0" max="8" step="1" value="5" id="flac-comp">' +
                    '<span class="pk_val" style="float:left;margin-left:15px">5</span></div>' +
                    '<div class="pk_row" style="display:none" id="frmtex-wav">' +
                    '<input type="radio" class="pk_check" id="kwb1" name="wavbits" checked value="16">' +
                    '<label for="kwb1">16-bit</label>' +
                    '<input type="radio" class="pk_check" id="kwb2" name="wavbits" value="24">' +
                    '<label for="kwb2">24-bit</label>' +
                    '<input type="radio" class="pk_check" id="kwb3" name="wavbits" value="32">' +
                    '<label for="kwb3">32-bit float</label>' +
                    '<div id="wav-dither-wrap" style="margin-top:6px">' +
                    '<input type="checkbox" class="pk_check" id="wav-dither">' +
                    '<label for="wav-dither">TPDF dither</label>' +
                    '</div></div>' +
                    '<div class="pk_row" style="padding-bottom:5px">' +
                    '<input type="radio" class="pk_check" id="k6" name="chnl" checked value="mono">' +
                    '<label for="k6">Mono</label>' +
                    '<input type="radio" class="pk_check pk_stereo" id="k7" name="chnl" value="stereo">' +
                    '<label for="k7">Stereo</label>' +
                    '</div>' +
                    '<div class="pk_row">' +
                    '<input type="radio" class="pk_check" id="k4" name="xport" checked value="whole">' +
                    '<label for="k4">Export whole file</label>' +
                    '<input type="radio" class="pk_check" id="k5" name="xport" value="sel">' +
                    '<label class="pk_lblmp3" for="k5">Export Selection Only</label></div>',
                  setup: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                    var wv: UiRuntimeValue = PKAudioEditor.engine.wavesurfer;
                    var mt_on: UiRuntimeValue = activeMultitrackFor(app);
                    // if no region
                    var region: UiRuntimeValue = activeRegionFor(app);
                    if (!region) {
                      var lbl: UiRuntimeValue = q.el_body.getElementsByClassName('pk_lblmp3')[0];
                      lbl.className = 'pk_dis';
                    }
                    var chan_num: UiRuntimeValue = mt_on
                      ? 2
                      : wv.backend.buffer
                        ? wv.backend.buffer.numberOfChannels
                        : 1;
                    if (chan_num === 2) {
                      q.el_body.getElementsByClassName('pk_stereo')[0].checked = true;
                    }
                    app.fireEvent('RequestPause');
                    app.ui.InteractionHandler.checkAndSet('modal');
                    app.ui.KeyHandler.addCallback(
                      'modalTemp',
                      function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                        q.Destroy();
                      },
                      [27],
                    );
                    setTimeout(function (this: UiRuntimeValue) {
                      if (!q.el) return;
                      var inputtxt: UiRuntimeValue = q.el.getElementsByTagName('input')[0];
                      inputtxt && inputtxt.select();
                      var format: UiRuntimeValue = document.getElementById('frmtex');
                      var mp3conf: UiRuntimeValue = document.getElementById('frmtex-mp3');
                      var flacconf: UiRuntimeValue = document.getElementById('frmtex-flac');
                      var wavconf: UiRuntimeValue = document.getElementById('frmtex-wav');
                      var ditherWrap: UiRuntimeValue = document.getElementById('wav-dither-wrap');
                      var amss: UiRuntimeValue = q.el_body.getElementsByClassName('pk_amss');
                      function setDitherFor(this: UiRuntimeValue, bits?: UiRuntimeValue) {
                        var on: UiRuntimeValue = bits === 16;
                        document.getElementById('wav-dither').disabled = !on;
                        ditherWrap.classList.toggle('pk_inact', !on);
                      }
                      function showConf(
                        this: UiRuntimeValue,
                        m?: UiRuntimeValue,
                        f?: UiRuntimeValue,
                        w?: UiRuntimeValue,
                      ) {
                        mp3conf.style.display = m ? 'block' : 'none';
                        flacconf.style.display = f ? 'block' : 'none';
                        wavconf.style.display = w ? 'block' : 'none';
                      }
                      var k6: UiRuntimeValue = document.getElementById('k6');
                      var k7: UiRuntimeValue = document.getElementById('k7');
                      if (!mt_on) {
                        for (var x: UiRuntimeValue = 0; x < amss.length; ++x)
                          amss[x].style.display = 'none';
                      }
                      function setExt(this: UiRuntimeValue, ext?: UiRuntimeValue) {
                        inputtxt.value =
                          inputtxt.value.replace(/\.(mp3|wav|flac|amss)$/i, '') + ext;
                      }
                      function chanOff(this: UiRuntimeValue, off?: UiRuntimeValue) {
                        k6.disabled = k7.disabled = !!off;
                      }
                      if (mt_on) {
                        document.getElementById('k01').checked = true;
                        showConf(1, 0, 0);
                        chanOff(false);
                        setExt('.mp3');
                      }
                      document.getElementById('flac-comp').oninput = function (
                        this: UiRuntimeValue,
                      ) {
                        this.parentNode.getElementsByTagName('span')[0].innerText = this.value;
                      };
                      setDitherFor(16);
                      wavconf.addEventListener(
                        'change',
                        function (this: UiRuntimeValue) {
                          var ws: UiRuntimeValue = wavconf.getElementsByTagName('input');
                          for (var i: UiRuntimeValue = 0; i < ws.length; ++i)
                            if (ws[i].name === 'wavbits' && ws[i].checked) {
                              setDitherFor(ws[i].value / 1);
                              break;
                            }
                        },
                        false,
                      );
                      format &&
                        format.addEventListener(
                          'change',
                          function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                            var inputs: UiRuntimeValue = this.getElementsByTagName('input');
                            for (var i: UiRuntimeValue = 0; i < inputs.length; ++i) {
                              if (inputs[i].checked) {
                                var v: UiRuntimeValue = inputs[i].value;
                                chanOff(v === 'amss');
                                showConf(v === 'mp3', v === 'flac', v === 'wav');
                                setExt('.' + v);
                              }
                            }
                          },
                          false,
                        );
                    }, 20);
                  },
                }).Show();
              },
              clss: 'pk_inact',
              setup: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                obj.setAttribute('data-id', 'dl');
                function setExportReady(this: UiRuntimeValue) {
                  var mt: UiRuntimeValue = activeMultitrackFor(app);
                  if (mt || (app.engine && app.engine.is_ready)) obj.classList.remove('pk_inact');
                  else obj.classList.add('pk_inact');
                }
                app.listenFor('DidUnloadFile', setExportReady);
                app.listenFor('DidLoadFile', setExportReady);
                app.listenFor('DidUpdateMultitrack', setExportReady);
                setExportReady();
              },
            },
            {
              name: 'Load from Computer',
              type: 'file',
              action: function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                app.fireEvent('RequestLoadLocalFile');
              },
            },
            {
              name: 'Load Sample File',
              action: function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                if (app.fireEvent('RequestLoadSampleFile') !== true)
                  app.engine.LoadSample('test.mp3');
              },
            },
            {
              name: 'Load From URL',
              action: function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                new PKSimpleModal({
                  title: 'Load audio from remote url',
                  ondestroy: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                    app.ui.InteractionHandler.on = false;
                    app.ui.KeyHandler.removeCallback('modalTemp');
                    app.ui.KeyHandler.removeCallback('modalTempEnter');
                  },
                  buttons: [
                    {
                      title: 'Load Asset',
                      clss: 'pk_modal_a_accpt',
                      callback: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                        var input: UiRuntimeValue = q.el_body.getElementsByTagName('input')[0];
                        var value: UiRuntimeValue = input.value.trim();
                        function isURL(this: UiRuntimeValue, str?: UiRuntimeValue) {
                          var pattern: UiRuntimeValue = new RegExp(
                            '^((https?:)?\\/\\/)?' + // protocol
                              '(?:\\S+(?::\\S*)?@)?' + // authentication
                              '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                              '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                              '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                              '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                              '(\\#[-a-z\\d_]*)?$',
                            'i',
                          ); // fragment locater
                          if (!pattern.test(str)) {
                            return false;
                          } else {
                            return true;
                          }
                        }
                        if (isURL(value)) {
                          // LOAD FROM URL....
                          if (app.fireEvent('RequestLoadURL', value) !== true)
                            app.engine.LoadURL(value);
                          q.Destroy();
                        } else {
                          OneUp('Invalid URL entered', 1100);
                        }
                        // -
                      },
                    },
                  ],
                  body:
                    '<label for="k00">Insert url</label>' +
                    '<input style="min-width:250px" placeholder="Please insert url" class="pk_txt" type="text" id="k00" />',
                  setup: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                    app.fireEvent('RequestPause');
                    app.ui.InteractionHandler.checkAndSet('modal');
                    app.ui.KeyHandler.addCallback(
                      'modalTemp',
                      function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                        q.Destroy();
                      },
                      [27],
                    );
                    app.ui.KeyHandler.addCallback(
                      'modalTempEnter',
                      function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                        q.els.bottom[0].click();
                      },
                      [13],
                    );
                    setTimeout(function (this: UiRuntimeValue) {
                      q.el && q.el.getElementsByTagName('input')[0].focus();
                    }, 20);
                  },
                }).Show();
              },
              // ---
            },
            {
              name: 'New Recording',
              action: function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                app.fireEvent('RequestActionNewRec');
              },
            },
            {
              name: 'Save Draft Locally',
              clss: 'pk_inact',
              action: function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                if (!app.engine.is_ready) return;
                var saving: UiRuntimeValue = function (
                  this: UiRuntimeValue,
                  type?: UiRuntimeValue,
                  name?: UiRuntimeValue,
                ) {
                  var buff: UiRuntimeValue = app.engine.wavesurfer.backend.buffer;
                  if (type === 'copy') buff = app.engine.GetCopyBuff();
                  else if (type === 'sel') buff = app.engine.GetSel();
                  var func: UiRuntimeValue = function (this: UiRuntimeValue, fls?: UiRuntimeValue) {
                    var rr: UiRuntimeValue = Math.random().toString(36).substring(7);
                    fls.SaveSession(buff, rr, name);
                    app.stopListeningFor('DidOpenDB', func);
                  };
                  app.listenFor('DidOpenDB', func);
                  if (!app.fls.on)
                    app.fls.Init(function (this: UiRuntimeValue, err?: UiRuntimeValue) {
                      if (err) {
                        alert('db error');
                      }
                    });
                  else app.fireEvent('DidOpenDB', app.fls);
                };
                // modal that asks for - full file, selection, copy buffer
                new PKSimpleModal({
                  title: 'Save Local Draft of...',
                  ondestroy: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                    app.ui.InteractionHandler.on = false;
                    app.ui.KeyHandler.removeCallback('modalTempErr');
                  },
                  buttons: [
                    {
                      title: 'Save',
                      clss: 'pk_modal_a_accpt',
                      callback: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                        var type: UiRuntimeValue = 'whole';
                        var input: UiRuntimeValue = q.el_body.getElementsByTagName('input');
                        var name: UiRuntimeValue = input[input.length - 1].value;
                        if (name) {
                          name = name.trim();
                          if (name.length >= 100) name = name.substr(0, 99).trim();
                          if (name.length === 0) name = null;
                        } else {
                          name = null;
                        }
                        for (var i: UiRuntimeValue = 0; i < input.length; ++i) {
                          if (input[i].checked) {
                            type = input[i].value;
                            break;
                          }
                        }
                        saving(type, name);
                        q.Destroy();
                      },
                    },
                  ],
                  body:
                    '<p>Please choose source...</p>' +
                    '<div class="pk_row"><input type="radio" class="pk_check" id="sl1" name="rdslnc" checked value="whole">' +
                    '<label style="vertical-align:top" for="sl1">Whole Track</label>' +
                    '<input type="radio" class="pk_check"  id="sl2" name="rdslnc" value="sel">' +
                    '<label style="vertical-align:top" class="pk_lblsel" for="sl2">Selection' +
                    '<i style="display:block;font-size:11px;margin-top:-5px"></i></label>' +
                    '<input type="radio" class="pk_check"  id="sl3" name="rdslnc" value="copy">' +
                    '<label style="vertical-align:top" class="pk_lblsel2" for="sl3">"Copy" clipboard/buffer</label></div>' +
                    '<div class="pk_row"><label for="slk0">Draft Name</label>' +
                    '<input style="min-width:250px" placeholder="(optional) filename" maxlength="100" ' +
                    'class="pk_txt" type="text" id="slk0" /></div>',
                  setup: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                    // check if selection
                    var wv: UiRuntimeValue = app.engine.wavesurfer;
                    // if no region
                    var region: UiRuntimeValue = wv.regions.list[0];
                    var lblr: UiRuntimeValue = q.el_body.getElementsByClassName('pk_lblsel')[0];
                    if (!region) {
                      lblr.className = 'pk_dis';
                    } else {
                      q.el_body.getElementsByClassName('pk_check')[1].checked = true;
                      lblr.childNodes[1].textContent =
                        app.ui.formatTime(region.start) + ' to ' + app.ui.formatTime(region.end);
                    }
                    // if no copy buffer
                    var copy: UiRuntimeValue = app.engine.GetCopyBuff();
                    if (!copy) {
                      var lbl: UiRuntimeValue = q.el_body.getElementsByClassName('pk_lblsel2')[0];
                      lbl.className = 'pk_dis';
                    }
                    if (!app.isMobile) {
                      setTimeout(function (this: UiRuntimeValue) {
                        q.el && q.el.getElementsByClassName('pk_txt')[0].focus();
                      }, 20);
                    }
                    app.fireEvent('RequestPause');
                    app.ui.InteractionHandler.checkAndSet('modal');
                    app.ui.KeyHandler.addCallback(
                      'modalTempErr',
                      function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                        q.Destroy();
                      },
                      [27],
                    );
                  },
                }).Show();
                return;
              },
              setup: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.listenFor('DidUnloadFile', function (this: UiRuntimeValue) {
                  obj.classList.add('pk_inact');
                });
                app.listenFor('DidLoadFile', function (this: UiRuntimeValue) {
                  obj.classList.remove('pk_inact');
                });
                app.listenFor(
                  'DidStoreDB',
                  function (this: UiRuntimeValue, obj?: UiRuntimeValue, e?: UiRuntimeValue) {
                    var name: UiRuntimeValue = obj.id;
                    var txt: UiRuntimeValue =
                      '<div style="padding:2px 0">id: ' +
                      name +
                      '</div>' +
                      '<div style="padding:2px 0"><span>durr: ' +
                      obj.durr +
                      's</span>' +
                      '&nbsp;&nbsp;&nbsp;' +
                      '<span>chan: ' +
                      (obj.chans === 1 ? 'mono' : 'stereo') +
                      '</span></div>' +
                      '<div style="padding:2px 0"><img src="' +
                      obj.thumb +
                      '" /></div>';
                    var storedTitle: UiRuntimeValue = 'Successfully Stored';
                    var openInNew: UiRuntimeValue = 'OPEN IN NEW WINDOW';
                    var askBody: UiRuntimeValue = '<p>Open in new window?</p>';
                    new PKSimpleModal({
                      title: storedTitle,
                      ondestroy: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                        app.ui.InteractionHandler.on = false;
                        app.ui.KeyHandler.removeCallback('modalTempErr');
                      },
                      buttons: [
                        {
                          title: openInNew,
                          callback: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                            window.open(window.location.pathname + '?local=' + name);
                            q.Destroy();
                          },
                        },
                      ],
                      body: askBody + txt,
                      setup: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                        app.fireEvent('RequestPause');
                        app.fireEvent('RequestRegionClear');
                        app.ui.InteractionHandler.checkAndSet('modal');
                        app.ui.KeyHandler.addCallback(
                          'modalTempErr',
                          function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                            q.Destroy();
                          },
                          [27],
                        );
                      },
                    }).Show();
                  },
                );
              },
            },
            {
              name: 'Open Local Drafts',
              action: function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                var datenow: UiRuntimeValue = new Date();
                var time_ago: UiRuntimeValue = function (
                  this: UiRuntimeValue,
                  arg?: UiRuntimeValue,
                ) {
                  var a: UiRuntimeValue = ((datenow - arg) / 1e3) >> 0;
                  if (59 >= a)
                    return ((datenow = 1 < a ? 's' : ''), a + ' second' + datenow + ' ago');
                  if (60 <= a && 3599 >= a)
                    return ((a = Math.floor(a / 60)), a + ' minute' + (1 < a ? 's' : '') + ' ago');
                  if (3600 <= a && 86399 >= a)
                    return ((a = Math.floor(a / 3600)), a + ' hour' + (1 < a ? 's' : '') + ' ago');
                  if (86400 <= a && 2592030 >= a)
                    return ((a = Math.floor(a / 86400)), a + ' day' + (1 < a ? 's' : '') + ' ago');
                  if (2592031 <= a)
                    return (
                      (a = Math.floor(a / 2592e3)),
                      a + ' month' + (1 < a ? 's' : '') + ' ago'
                    );
                };
                var func: UiRuntimeValue = function (this: UiRuntimeValue, fls?: UiRuntimeValue) {
                  fls.ListSessions(function (this: UiRuntimeValue, ret?: UiRuntimeValue) {
                    var msg: UiRuntimeValue = '';
                    if (ret.length === 0) {
                      msg += 'No drafts found...';
                    } else {
                      for (var i: UiRuntimeValue = 0; i < ret.length; ++i) {
                        var curr: UiRuntimeValue = ret[i];
                        var date: UiRuntimeValue = new Date(curr.created);
                        var datestr: UiRuntimeValue =
                          date.getMonth() +
                          1 +
                          '/' +
                          date.getDate() +
                          '/' +
                          date.getFullYear() +
                          '  ' +
                          date.getHours() +
                          ':' +
                          date.getMinutes() +
                          ':' +
                          date.getSeconds();
                        var agostr: UiRuntimeValue = time_ago(date);
                        var filename: UiRuntimeValue = curr.name || '-';
                        var duration: UiRuntimeValue = curr.durr;
                        var thumb: UiRuntimeValue = curr.thumb;
                        var chns: UiRuntimeValue = curr.chans === 1 ? 'mono' : 'stereo';
                        msg +=
                          '<div id="pk_' +
                          curr.id +
                          '" class="pk_lcldrf">' +
                          '<div style="padding-bottom:2px"><span><i class="pk_i">name:</i>' +
                          filename +
                          '</span></div>' +
                          '<div><span class="pk_lcls"><i class="pk_i">id:</i><strong>' +
                          curr.id +
                          '</strong><br/><i class="pk_i">chn:</i>' +
                          chns +
                          '</span>' +
                          '<span class="pk_lcls" style="width:50%;text-align:center"><i class="pk_i">date:</i><span>' +
                          datestr +
                          '<br/>' +
                          agostr +
                          '</span></span>' +
                          '<span style="text-align:right;float:right" class="pk_lcls"><i class="pk_i">durr:</i>' +
                          duration +
                          's</span></div><div>' +
                          '<img class="pk_lcli" src="' +
                          thumb +
                          '" />' +
                          '<a class="pk_lcla2" onclick="PKAudioEditor.fireEvent(\'LoadDraft\',\'' +
                          curr.id +
                          '\', 3);">PLAY</a>' +
                          '<a class="pk_lcla" onclick="PKAudioEditor.fireEvent(\'LoadDraft\',\'' +
                          curr.id +
                          '\');">Open</a>';
                        if (app.engine.is_ready) {
                          msg +=
                            "<a onclick=\"PKAudioEditor.fireEvent('LoadDraft','" +
                            curr.id +
                            '\',1);" class="pk_lcla">Append to Current Track</a>';
                        }
                        msg +=
                          '<a class="pk_lcla" style="color:#ad2b2b" onclick="PKAudioEditor.fireEvent(\'LoadDraft\',\'' +
                          curr.id +
                          '\',2);">Del</a>';
                        msg += '</div></div>';
                      }
                    }
                    var modal: UiRuntimeValue;
                    var closeModal: UiRuntimeValue = function (
                      this: UiRuntimeValue,
                      val?: UiRuntimeValue,
                      val2?: UiRuntimeValue,
                    ) {
                      if (val2 === 2 || val2 === 3) return;
                      modal.Destroy();
                      modal = null;
                    };
                    var set_act_btn: UiRuntimeValue = function (
                      this: UiRuntimeValue,
                      name?: UiRuntimeValue,
                      state?: UiRuntimeValue,
                    ) {
                      var act: UiRuntimeValue;
                      if (!state) {
                        act = modal.el_body.getElementsByClassName('pk_act')[0];
                        if (act) {
                          act.classList.remove('pk_act');
                        }
                      } else {
                        var el: UiRuntimeValue = document.getElementById('pk_' + name);
                        if (el) {
                          act = el.getElementsByClassName('pk_lcla2')[0];
                          act && act.classList.add('pk_act');
                        }
                      }
                      // --
                    };
                    app.listenFor('_lclStart', set_act_btn);
                    modal = new PKSimpleModal({
                      title: 'Local Drafts',
                      clss: 'pk_bigger',
                      ondestroy: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                        app.fireEvent('_lclStop');
                        app.ui.InteractionHandler.on = false;
                        app.ui.KeyHandler.removeCallback('modalTempErr');
                        app.stopListeningFor('LoadDraft', closeModal);
                        app.stopListeningFor('_lclStart', set_act_btn);
                      },
                      buttons: [],
                      body: '<div>' + msg + '</div>',
                      setup: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                        app.fireEvent('RequestPause');
                        app.fireEvent('RequestRegionClear');
                        app.listenFor('LoadDraft', closeModal);
                        app.ui.InteractionHandler.checkAndSet('modal');
                        app.ui.KeyHandler.addCallback(
                          'modalTempErr',
                          function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                            q.Destroy();
                          },
                          [27],
                        );
                      },
                    });
                    modal.Show();
                  });
                  app.stopListeningFor('DidOpenDB', func);
                };
                app.listenFor('DidOpenDB', func);
                if (!app.fls.on)
                  app.fls.Init(function (this: UiRuntimeValue, err?: UiRuntimeValue) {
                    if (err) {
                      alert('db error');
                    }
                  });
                else app.fireEvent('DidOpenDB', app.fls);
              },
              setup: function (this: UiRuntimeValue) {
                var source: UiRuntimeValue = {};
                app.listenFor(
                  '_lclStop',
                  function (this: UiRuntimeValue, name?: UiRuntimeValue, append?: UiRuntimeValue) {
                    if (source.src) {
                      source.src.stop();
                      source.src.disconnect();
                      source.src.onended = null;
                      source.aud.close && source.aud.close();
                      source = {};
                    }
                  },
                );
                app.listenFor(
                  'LoadDraft',
                  function (this: UiRuntimeValue, name?: UiRuntimeValue, append?: UiRuntimeValue) {
                    app.fls.Init(function (this: UiRuntimeValue, err?: UiRuntimeValue) {
                      if (err) return;
                      if (append === 2) {
                        if (source.id === name) {
                          app.fireEvent('_lclStart', source.id, 0);
                          source.src.stop();
                          source.src.disconnect();
                          source.src.onended = null;
                          source.aud.close && source.aud.close();
                          source = {};
                        }
                        app.fls.DelSession(
                          name,
                          function (this: UiRuntimeValue, name?: UiRuntimeValue) {
                            var id: UiRuntimeValue = 'pk_' + name;
                            var el: UiRuntimeValue = document.getElementById(id);
                            if (el) {
                              if (el.parentNode.children.length === 1) {
                                el.parentNode.innerHTML = 'No drafts found...';
                              } else el.parentNode.removeChild(el);
                              el = null;
                            }
                          },
                        );
                        return;
                      }
                      if (append === 3) {
                        if (source.id) {
                          var xt: UiRuntimeValue = false;
                          if (source.id === name) xt = true;
                          app.fireEvent('_lclStart', source.id, 0);
                          source.src.stop();
                          source.src.disconnect();
                          source.src.onended = null;
                          source.aud.close && source.aud.close();
                          source = {};
                          if (xt) return;
                        }
                        // generate audio context here...
                        var aud_cont: UiRuntimeValue = new (
                          w.AudioContext || w.webkitAudioContext
                        )();
                        if (aud_cont && aud_cont.state == 'suspended') {
                          aud_cont.resume && aud_cont.resume();
                        }
                        app.fls.GetSession(
                          name,
                          function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                            if (e && e.id === name) {
                              source.id = e.id;
                              source.aud = aud_cont;
                              source.src = app.engine.PlayBuff(
                                e.data,
                                e.chans,
                                e.samplerate,
                                aud_cont,
                              );
                              if (!source.src) {
                                source.aud && source.aud.close && source.aud.close();
                                source = {};
                                return;
                              }
                              source.src.onended = function (
                                this: UiRuntimeValue,
                                e?: UiRuntimeValue,
                              ) {
                                app.fireEvent('_lclStart', source.id, 0);
                                source.src.stop();
                                source.src.disconnect();
                                source.src.onended = null;
                                source.aud.close && source.aud.close();
                                source = {};
                              };
                              app.fireEvent('_lclStart', e.id, 1);
                            }
                          },
                        );
                        return;
                      }
                      var overwrite: UiRuntimeValue = (function (
                        this: UiRuntimeValue,
                        app?: UiRuntimeValue,
                        name?: UiRuntimeValue,
                        append?: UiRuntimeValue,
                      ) {
                        return function (this: UiRuntimeValue) {
                          app.fls.GetSession(
                            name,
                            function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                              if (e && e.id === name) {
                                app.fireEvent('RequestOriginalEditor');
                                app.engine.wavesurfer.backend._add = append ? 1 : 0;
                                app.engine.LoadDB(e);
                              }
                            },
                          );
                        };
                      })(app, name, append);
                      // --- ask if we want to click the first one
                      if (app.engine.is_ready && !append) {
                        // Keep the session destination dialog in the canonical locale.
                        (function (this: UiRuntimeValue) {
                          var openTitle: UiRuntimeValue = 'Open in Existing?';
                          var openBody: UiRuntimeValue =
                            '<div>Open in new window, or in the current one?</div>';
                          var openBtnExisting: UiRuntimeValue = 'OPEN';
                          var openBtnNew: UiRuntimeValue = 'OPEN IN NEW';
                          var mm: UiRuntimeValue = new PKSimpleModal({
                            title: openTitle,
                            body: openBody,
                            buttons: [
                              {
                                title: openBtnExisting,
                                clss: 'pk_modal_a_accpt',
                                callback: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                                  overwrite();
                                  q.Destroy();
                                },
                              },
                              {
                                title: openBtnNew,
                                clss: 'pk_modal_a_accpt',
                                callback: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                                  window.open(window.location.pathname + '?local=' + name);
                                  q.Destroy();
                                },
                              },
                            ],
                            setup: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                              app.ui.InteractionHandler.checkAndSet('mm');
                              app.ui.KeyHandler.addCallback(
                                'mmErr',
                                function (this: UiRuntimeValue, e?: UiRuntimeValue) {
                                  q.Destroy();
                                },
                                [27],
                              );
                            },
                            ondestroy: function (this: UiRuntimeValue, q?: UiRuntimeValue) {
                              overwrite = null;
                              app.ui.InteractionHandler.on = false;
                              app.ui.KeyHandler.removeCallback('mmErr');
                            },
                          });
                          setTimeout(function (this: UiRuntimeValue) {
                            mm.Show();
                          }, 0);
                        })();
                        return;
                      }
                      overwrite();
                      // --
                    });
                  },
                );
                // ---
              },
            },
          ],
        },
        {
          name: 'Edit',
          children: [
            {
              name: 'Undo <span class="pk_shrtct">Shft+Z</span>',
              clss: 'pk_inact',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('StateRequestUndo');
              },
              setup: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.listenFor(
                  'DidStateChange',
                  function (
                    this: UiRuntimeValue,
                    undo_states?: UiRuntimeValue,
                    redo_states?: UiRuntimeValue,
                  ) {
                    if (undo_states.length === 0) {
                      obj.innerHTML = 'Undo <span class="pk_shrtct">Shft+Z</span>';
                      obj.classList.add('pk_inact');
                    } else {
                      obj.innerHTML =
                        'Undo&nbsp;<i style="pointer-events:none">' +
                        undo_states[undo_states.length - 1].desc +
                        '</i><span class="pk_shrtct">Shft+Z</span>';
                      obj.classList.remove('pk_inact');
                    }
                  },
                );
              },
            },
            {
              name: 'Redo <span class="pk_shrtct">Shft+Y</span>',
              clss: 'pk_inact',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('StateRequestRedo');
              },
              setup: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.listenFor(
                  'DidStateChange',
                  function (
                    this: UiRuntimeValue,
                    undo_states?: UiRuntimeValue,
                    redo_states?: UiRuntimeValue,
                  ) {
                    if (redo_states.length === 0) {
                      obj.innerHTML = 'Redo <span class="pk_shrtct">Shft+Y</span>';
                      obj.classList.add('pk_inact');
                    } else {
                      obj.innerHTML =
                        'Redo&nbsp;<i style="pointer-events:none">' +
                        redo_states[0].desc +
                        '</i><span class="pk_shrtct">Shft+Y</span>';
                      obj.classList.remove('pk_inact');
                    }
                  },
                );
              },
            },
            {
              name: 'Play <span class="pk_shrtct">Space</span>',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestPlay');
              },
            },
            {
              name: 'Stop',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestStop');
              },
            },
            {
              name: 'Select All <span class="pk_shrtct">Shft+A</span>',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestSelect');
              },
            },
            {
              name: 'Deselect All <span class="pk_shrtct">~</span>',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestDeselect');
              },
            },
            {
              name: 'Channel Info/Flip',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFXUI_Flip');
              },
              clss: 'pk_inact',
              setup: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.listenFor('DidUnloadFile', function (this: UiRuntimeValue) {
                  obj.classList.add('pk_inact');
                });
                app.listenFor('DidLoadFile', function (this: UiRuntimeValue) {
                  obj.classList.remove('pk_inact');
                });
              },
            },
            {
              name: 'Seamless Loop',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFXUI_SeamlessLoop');
              },
            },
            {
              name: 'Zero Cross Selection',
              checkable: true,
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestSnapSelDrag');
              },
              setup: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                function set(this: UiRuntimeValue, val?: UiRuntimeValue) {
                  setMenuItemChecked(obj, val);
                }
                set(!w.AMPreferences || w.AMPreferences.get('snapZeroCrossing', true));
                app.listenFor('DidSnapSelDrag', set);
              },
            },
          ],
        },
        {
          name: 'Effects',
          children: [
            {
              name: 'Gain',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestFXUI_Gain');
              },
            },
            {
              name: 'Fade In',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFX_FadeIn');
              },
            },
            {
              name: 'Fade Out',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFX_FadeOut');
              },
            },
            {
              name: 'Noise Reduction (Voice)',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFX_NoiseRNN');
              },
            },
            {
              name: 'Paragraphic EQ',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFXUI_ParaGraphicEQ');
              },
            },
            {
              name: 'Compressor',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFXUI_Compressor');
              },
            },
            {
              name: 'Normalize',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFXUI_Normalize');
              },
            },
            {
              name: 'Graphic EQ',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFXUI_GraphicEQ', 10);
              },
            },
            {
              name: 'Graphic EQ (20 bands)',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFXUI_GraphicEQ', 20);
              },
            },
            {
              name: 'Hard Limiter',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFXUI_HardLimiter');
              },
            },
            {
              name: 'Delay',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFXUI_Delay');
              },
            },
            {
              name: 'Distortion',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFXUI_Distortion');
              },
            },
            {
              name: 'Reverb',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFXUI_Reverb');
              },
            },
            {
              name: 'Audio Repair',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFXUI_Repair');
              },
            },
            {
              name: 'Speed Up / Slow Down (pitch)',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFXUI_Speed');
              },
            },
            {
              name: 'Speed / Playback Rate',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFXUI_Rate');
              },
            },
            {
              name: 'Reverse',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFX_Reverse');
              },
            },
            {
              name: 'Invert',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFX_Invert');
              },
            },
            {
              name: 'Remove Silence',
              action: function (this: UiRuntimeValue) {
                app.fireEvent('RequestActionFX_RemSil');
              },
            },
          ],
        },
        {
          name: 'View',
          children: [
            {
              name: 'Follow Cursor',
              checkable: true,
              checked: true,
              action: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.fireEvent('RequestViewFollowCursorToggle');
              },
              setup: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                // perhaps read from stored settings?
                app.listenFor(
                  'DidViewFollowCursorToggle',
                  function (this: UiRuntimeValue, val?: UiRuntimeValue) {
                    setMenuItemChecked(obj, val);
                  },
                );
              },
            },
            {
              name: 'Peak Separators',
              checkable: true,
              checked: true,
              action: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.fireEvent('RequestViewPeakSeparatorToggle');
              },
              setup: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.listenFor(
                  'DidViewPeakSeparatorToggle',
                  function (this: UiRuntimeValue, val?: UiRuntimeValue) {
                    setMenuItemChecked(obj, val);
                  },
                );
              },
            },
            {
              name: 'Timeline',
              checkable: true,
              checked: true,
              action: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.fireEvent('RequestViewTimelineToggle');
              },
              setup: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.listenFor(
                  'DidViewTimelineToggle',
                  function (this: UiRuntimeValue, val?: UiRuntimeValue) {
                    setMenuItemChecked(obj, val);
                  },
                );
              },
            },
            {
              separator: true,
            },
            {
              name: 'Frequency Analyser',
              checkable: true,
              action: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.fireEvent('RequestShowFreqAn', 'eq', [1]);
              },
              setup: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.listenFor(
                  'DidToggleFreqAn',
                  function (this: UiRuntimeValue, url?: UiRuntimeValue, val?: UiRuntimeValue) {
                    if (url !== 'eq') return;
                    setMenuItemChecked(obj, val);
                  },
                );
              },
            },
            {
              name: 'Spectrum Analyser',
              checkable: true,
              action: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.fireEvent('RequestShowFreqAn', 'sp', [1]);
              },
              setup: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.listenFor(
                  'DidToggleFreqAn',
                  function (this: UiRuntimeValue, url?: UiRuntimeValue, val?: UiRuntimeValue) {
                    if (url !== 'sp') return;
                    setMenuItemChecked(obj, val);
                  },
                );
              },
            },
            {
              name: 'Multitrack Mixer',
              checkable: true,
              action: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                var mt: UiRuntimeValue = app.multitrack;
                if (mt && mt.IsOn && !mt.IsOn()) mt.Toggle(true);
                app.fireEvent('RequestMixerToggle');
              },
              setup: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.listenFor(
                  'DidToggleFreqAn',
                  function (this: UiRuntimeValue, url?: UiRuntimeValue, val?: UiRuntimeValue) {
                    if (url !== 'mix') return;
                    setMenuItemChecked(obj, val);
                  },
                );
              },
            },
            {
              name: 'Tempo Tools',
              action: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.fireEvent('RequestActionTempo');
              },
            },
            {
              name: 'ID3 Tags',
              action: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.fireEvent('RequestActionID3');
              },
            },
            {
              separator: true,
            },
            {
              name: 'Center to Cursor <span class="pk_shrtct">[Tab]</span>',
              action: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.fireEvent('RequestViewCenterToCursor');
              },
            },
            {
              name: 'Reset Zoom <span class="pk_shrtct">[0]</span>',
              action: function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                app.fireEvent('RequestZoomUI', 0);
              },
            },
          ],
        },
        {
          name: 'Help',
          children: [
            {
              name: 'Store Offline Version',
              action: function (this: UiRuntimeValue) {
                if (!('serviceWorker' in navigator)) {
                  OneUp('Offline mode is not supported by this browser', 2600, 'pk_r');
                  return;
                }
                OneUp('Saving AudioMass for offline use…', 1800);
                navigator.serviceWorker
                  .register('/sw.js', { scope: '/' })
                  .then(function (this: UiRuntimeValue, registration?: UiRuntimeValue) {
                    return navigator.serviceWorker.ready.then(function (this: UiRuntimeValue) {
                      var worker: UiRuntimeValue =
                        registration.active || registration.waiting || registration.installing;
                      var urls: UiRuntimeValue = ['/editor', window.location.href];
                      var resources: UiRuntimeValue =
                        window.performance && window.performance.getEntriesByType
                          ? window.performance.getEntriesByType('resource')
                          : [];
                      for (var i: UiRuntimeValue = 0; i < resources.length; ++i)
                        urls.push(resources[i].name);
                      try {
                        var shellResources: UiRuntimeValue =
                          window.parent.performance.getEntriesByType('resource');
                        for (var j: UiRuntimeValue = 0; j < shellResources.length; ++j)
                          urls.push(shellResources[j].name);
                      } catch (error: UiRuntimeValue) {}
                      worker && worker.postMessage({ type: 'CACHE_URLS', urls: urls });
                      OneUp('AudioMass is ready for offline use', 2600, 'pk_gr');
                    });
                  })
                  .catch(function (this: UiRuntimeValue) {
                    OneUp('Could not enable offline mode', 2600, 'pk_r');
                  });
              },
              setup: function (this: UiRuntimeValue) {},
            },
            {
              separator: true,
            },
            {
              name: 'About',
              action: function (this: UiRuntimeValue) {
                window.open('/about');
              },
            },
            {
              name: 'See Welcome Message',
              action: function (this: UiRuntimeValue) {
                PKAudioEditor._deps.Wlc();
              },
            },
            // {
            // 	name:'---'
            // },
          ],
        },
        {
          name: 'Language',
          children: [
            {
              name: 'English',
              action: function (this: UiRuntimeValue) {
                // Select English without reloading the editor.
                if (
                  window.PKAudioEditor &&
                  typeof window.PKAudioEditor.setLanguage === 'function'
                ) {
                  window.PKAudioEditor.setLanguage('en');
                }
              },
            },
            {
              name: 'Русский',
              action: function (this: UiRuntimeValue) {
                // Select Russian without reloading the editor.
                if (
                  window.PKAudioEditor &&
                  typeof window.PKAudioEditor.setLanguage === 'function'
                ) {
                  window.PKAudioEditor.setLanguage('ru');
                }
              },
            },
          ],
        },
      ];
      return menu;
    }
    //
    // TOP-BAR CLASS
    //
    function _makeUITopHeader(
      this: UiRuntimeValue,
      menu_tree?: UiRuntimeValue,
      UI?: UiRuntimeValue,
    ) {
      var header: UiRuntimeValue = d.createElement('div');
      header.className = 'pk_hdr pk_noselect';
      var _name: UiRuntimeValue = 'TopHeader',
        _default_class: UiRuntimeValue = 'pk_btn pk_noselect';
      var target_index: UiRuntimeValue = -1;
      var target_el: UiRuntimeValue = null;
      var target_el_old: UiRuntimeValue = null;
      var target_option: UiRuntimeValue = null;
      var top_els: UiRuntimeValue = [];
      var q: UiRuntimeValue = this;
      // recursively build the interface
      function build_menus(
        this: UiRuntimeValue,
        parent_el?: UiRuntimeValue,
        tree_obj?: UiRuntimeValue,
        level?: UiRuntimeValue,
      ) {
        for (var i: UiRuntimeValue = 0; i < tree_obj.length; ++i) {
          var btn_container: UiRuntimeValue = d.createElement('div');
          var curr_obj: UiRuntimeValue = tree_obj[i];
          if (level > 0 && curr_obj.separator) {
            btn_container.className = 'pk_menu_separator';
            btn_container.setAttribute('role', 'separator');
            parent_el.appendChild(btn_container);
            continue;
          }
          if (level === 0) {
            btn_container.className = _default_class;
            var btn: UiRuntimeValue = d.createElement('button');
            btn.innerHTML = curr_obj.name;
            btn_container.appendChild(btn);
          } else {
            btn_container.className = 'pk_menu_el';
            var btn: UiRuntimeValue = d.createElement('button');
            btn.className = 'pk_opt ' + (curr_obj.clss ? curr_obj.clss : '');
            btn.setAttribute('tab-index', '-1');
            btn.setAttribute('data-index', i);
            if (curr_obj.checkable && w.AMMenuChecks && w.AMMenuChecks.prepare) {
              w.AMMenuChecks.prepare(btn, curr_obj.name, curr_obj.checked);
            } else {
              btn.innerHTML = curr_obj.name;
            }
            btn_container.appendChild(btn);
            if (curr_obj.action) {
              (function (this: UiRuntimeValue, btn?: UiRuntimeValue, action?: UiRuntimeValue) {
                btn.onclick = function (this: UiRuntimeValue, obj?: UiRuntimeValue) {
                  if (this.classList.contains('pk_inact')) return;
                  q.closeMenu();
                  action(obj);
                };
              })(btn, curr_obj.action);
            }
            if (curr_obj.setup) {
              curr_obj.setup(btn);
            }
          }
          parent_el.appendChild(btn_container);
          if (level === 0) top_els[i] = btn_container.childNodes[0];
          if (curr_obj.children) {
            var ch: UiRuntimeValue = curr_obj.children;
            var list: UiRuntimeValue = d.createElement('div');
            list.className = 'pk_menu';
            build_menus(list, curr_obj.children, level + 1);
            btn_container.appendChild(list);
          }
          // ---
        }
      }
      build_menus(header, menu_tree, 0);
      this.getOpenElement = function (this: UiRuntimeValue) {
        return target_el;
      };
      this.closeMenu = function (this: UiRuntimeValue) {
        if (!target_el) return;
        target_el.parentNode.className = _default_class;
        target_el = target_el_old = null;
        if (target_option) {
          target_option.classList.remove('pk_act');
          target_option = null;
        }
        UI.InteractionHandler.on = false;
        d.removeEventListener('mouseup', mouseup);
        // de-register keys
        UI.KeyHandler.removeCallback(_name + 1);
        UI.KeyHandler.removeCallback(_name + 2);
        UI.KeyHandler.removeCallback(_name + 3);
        UI.KeyHandler.removeCallback(_name + 4);
        UI.KeyHandler.removeCallback(_name + 5);
        UI.KeyHandler.removeCallback(_name + 6);
      };
      this.openMenu = function (
        this: UiRuntimeValue,
        index?: UiRuntimeValue,
        is_mouse?: UiRuntimeValue,
      ) {
        if (target_el) {
          target_el.parentNode.className = _default_class;
        }
        if (index === -1) {
          index = target_index === -1 ? 0 : target_index;
        }
        var curr_target: UiRuntimeValue = top_els[index];
        target_el = curr_target;
        var parent: UiRuntimeValue = curr_target.parentNode;
        var left: UiRuntimeValue = parent.getBoundingClientRect().left;
        var max: UiRuntimeValue = window.innerWidth;
        var offset: UiRuntimeValue = 0;
        if (max - left < 200) {
          offset = (264 - (max - left)) >> 0;
          if (offset > 1)
            parent.getElementsByClassName('pk_menu')[0].style.left = -offset / 2 + 'px';
        }
        parent.className += ' pk_vis';
        setTimeout(function (this: UiRuntimeValue) {
          if (target_el === curr_target) parent.className += ' pk_act';
        }, 0);
        target_index = index;
        UI.InteractionHandler.checkAndSet(_name);
        if (!is_mouse) d.addEventListener('mouseup', mouseup, false);
        // register keystrokes
        UI.KeyHandler.addCallback(
          _name + 1,
          function (this: UiRuntimeValue, key?: UiRuntimeValue) {
            if (target_index === 0) target_index = top_els.length;
            q.closeMenu();
            q.openMenu(target_index - 1);
          },
          [37],
        );
        UI.KeyHandler.addCallback(
          _name + 2,
          function (this: UiRuntimeValue, key?: UiRuntimeValue) {
            if (target_index === top_els.length - 1) target_index = -1;
            q.closeMenu();
            q.openMenu(target_index + 1);
          },
          [39],
        );
        UI.KeyHandler.addCallback(
          _name + 3,
          function (this: UiRuntimeValue, key?: UiRuntimeValue) {
            q.closeMenu();
          },
          [27],
        );
        UI.KeyHandler.addCallback(
          _name + 4,
          function (
            this: UiRuntimeValue,
            key?: UiRuntimeValue,
            m?: UiRuntimeValue,
            e?: UiRuntimeValue,
          ) {
            if (!target_option) {
              var els: UiRuntimeValue = target_el.parentNode.getElementsByClassName('pk_opt');
              if (els[0]) {
                target_option = els[0];
                target_option.classList.add('pk_act');
              }
            } else {
              var ind: UiRuntimeValue = target_option.getAttribute('data-index') / 1;
              target_option.classList.remove('pk_act');
              target_option = target_el.parentNode.getElementsByClassName('pk_opt');
              if (ind - 1 < 0) {
                target_option = target_option[target_option.length - 1];
              } else {
                target_option = target_option[ind - 1];
              }
              target_option.classList.add('pk_act');
            }
          },
          [38],
        );
        UI.KeyHandler.addCallback(
          _name + 5,
          function (
            this: UiRuntimeValue,
            key?: UiRuntimeValue,
            m?: UiRuntimeValue,
            e?: UiRuntimeValue,
          ) {
            if (!target_option) {
              var els: UiRuntimeValue = target_el.parentNode.getElementsByClassName('pk_opt');
              if (els[0]) {
                target_option = els[0];
                target_option.classList.add('pk_act');
              }
            } else {
              var ind: UiRuntimeValue = target_option.getAttribute('data-index') / 1;
              target_option.classList.remove('pk_act');
              target_option = target_el.parentNode.getElementsByClassName('pk_opt');
              if (target_option.length <= ind + 1) {
                target_option = target_option[0];
              } else {
                target_option = target_option[ind + 1];
              }
              target_option.classList.add('pk_act');
            }
          },
          [40],
        );
        UI.KeyHandler.addCallback(
          _name + 6,
          function (this: UiRuntimeValue, key?: UiRuntimeValue) {
            if (target_option) target_option.click();
            else q.closeMenu();
          },
          [13],
        );
        return true;
      };
      UI.listenFor('DidReadyFire', function (this: UiRuntimeValue) {
        q.closeMenu();
      });
      // register hot keys for opening the menu
      function _checkForAct(this: UiRuntimeValue, x?: UiRuntimeValue) {
        if (target_el == x || !x) return false;
        var par: UiRuntimeValue = x.parentNode;
        while (par && target_el) {
          if (target_el.parentNode == par) {
            return false;
          }
          par = par.parentNode;
        }
        var l: UiRuntimeValue = top_els.length;
        while (l-- > 0) {
          if (top_els[l] === x) {
            return q.openMenu(l, true);
          }
        }
        return false;
      }
      // now make the buttons interactive
      var mousemove: UiRuntimeValue = function (this: UiRuntimeValue, e?: UiRuntimeValue) {
        if (!UI.InteractionHandler.check(_name)) {
          return false;
        }
        if (target_el || (UI.InteractionHandler.on && UI.InteractionHandler.by === _name)) {
          var x: UiRuntimeValue = e.target || e.srcElement;
          if (x.className.indexOf('pk_opt') >= 0) {
            if (target_option) target_option.classList.remove('pk_act');
            target_option = x;
            target_option.classList.add('pk_act');
          } else {
            if (target_option) target_option.classList.remove('pk_act');
            target_option = null;
          }
          return _checkForAct(x);
        }
        return false;
      };
      var mouseup: UiRuntimeValue = function (this: UiRuntimeValue, e?: UiRuntimeValue) {
        var x: UiRuntimeValue = e.target || e.srcElement;
        if (target_el) {
          // todo check for inner menu?
          var par: UiRuntimeValue = x;
          var found: UiRuntimeValue = false;
          while (par && target_el) {
            if (target_el.parentNode == par) {
              found = true;
              break;
            }
            par = par.parentNode;
          }
          if (!found || target_el_old === x) {
            q.closeMenu();
          }
        } else {
          UI.InteractionHandler.on = false;
          d.removeEventListener('mouseup', mouseup);
        }
        target_el_old = null;
      };
      header.addEventListener('mousemove', mousemove, false);
      header.addEventListener(
        'mousedown',
        function (this: UiRuntimeValue, e?: UiRuntimeValue) {
          if (!UI.InteractionHandler.checkAndSet(_name)) {
            return false;
          }
          d.removeEventListener('mouseup', mouseup);
          if (target_el) {
            if (!_checkForAct(e.target || e.srcElement)) target_el_old = target_el;
            else target_el_old = null;
            d.addEventListener('mouseup', mouseup, false);
          } else {
            target_el_old = null;
            d.addEventListener('mouseup', mouseup, false);
            _checkForAct(e.target || e.srcElement);
          }
          // -
        },
        false,
      );
      UI.el.appendChild(header);
      // -
    }
    // ####
    function _makeUIBarBottom(this: UiRuntimeValue, UI?: UiRuntimeValue, app?: UiRuntimeValue) {
      var q: UiRuntimeValue = this;
      var bar_bottom_el: UiRuntimeValue = d.createElement('div');
      bar_bottom_el.className = 'pk_dck';
      UI.el.appendChild(bar_bottom_el);
      q.el = bar_bottom_el;
      q.on = false;
      q.height = 130;
      q.SetHeight = function (this: UiRuntimeValue, height?: UiRuntimeValue) {
        q.height = height;
        if (q.on) bar_bottom_el.style.height = height + 'px';
      };
      q.Show = function (this: UiRuntimeValue) {
        q.on = true;
        bar_bottom_el.style.display = 'block';
        bar_bottom_el.style.height = q.height + 'px';
        app.fireEvent('RequestResize');
      };
      q.Hide = function (this: UiRuntimeValue) {
        q.on = false;
        bar_bottom_el.style.display = 'none';
        bar_bottom_el.style.height = '0';
        app.fireEvent('RequestResize');
      };
    }
    function _makeUIMainView(this: UiRuntimeValue, UI?: UiRuntimeValue, app?: UiRuntimeValue) {
      var q: UiRuntimeValue = this;
      var audio_container: UiRuntimeValue = d.createElement('div');
      audio_container.className = 'pk_av_cont';
      UI.el.appendChild(audio_container);
      var main_audio_view: UiRuntimeValue = d.createElement('div');
      main_audio_view.className = 'pk_av pk_noselect';
      main_audio_view.id = 'pk_av_' + app.id;
      audio_container.appendChild(main_audio_view);
      var footer: UiRuntimeValue = d.createElement('div');
      footer.className = 'pk_ftr pk_noselect';
      UI.el.appendChild(footer);
      // make panner buttons
      var btn_panner_cnt: UiRuntimeValue = d.createElement('div');
      btn_panner_cnt.className = 'pk_panner pk_noselect';
      var panner_col_left: UiRuntimeValue = d.createElement('div');
      panner_col_left.className = 'pk_pan_left';
      var panner_col_right: UiRuntimeValue = d.createElement('div');
      panner_col_right.className = 'pk_pan_right';
      var btn_panner_left: UiRuntimeValue = d.createElement('button');
      var btn_panner_right: UiRuntimeValue = d.createElement('button');
      btn_panner_left.setAttribute('tabIndex', -1);
      btn_panner_right.setAttribute('tabIndex', -1);
      btn_panner_left.className = 'pk_pan_btn';
      btn_panner_right.className = 'pk_pan_btn';
      btn_panner_left.innerHTML = '<strong>L</strong> ON';
      btn_panner_right.innerHTML = '<strong>R</strong> ON';
      panner_col_left.appendChild(btn_panner_left);
      panner_col_right.appendChild(btn_panner_right);
      btn_panner_cnt.appendChild(panner_col_left);
      btn_panner_cnt.appendChild(panner_col_right);
      audio_container.appendChild(btn_panner_cnt);
      btn_panner_left.onclick = function (this: UiRuntimeValue) {
        app.fireEvent('RequestChanToggle', 0);
        this.blur();
      };
      btn_panner_right.onclick = function (this: UiRuntimeValue) {
        app.fireEvent('RequestChanToggle', 1);
        this.blur();
      };
      app.listenFor(
        'DidChanToggle',
        function (this: UiRuntimeValue, chan?: UiRuntimeValue, val?: UiRuntimeValue) {
          if (chan === 0) {
            if (val) {
              btn_panner_left.classList.remove('pk_inact');
              btn_panner_left.innerHTML = '<strong>L</strong> ON';
            } else {
              btn_panner_left.classList.add('pk_inact');
              btn_panner_left.innerHTML = '<strong>L</strong> OFF';
            }
          } else {
            if (val) {
              btn_panner_right.classList.remove('pk_inact');
              btn_panner_right.innerHTML = '<strong>R</strong> ON';
            } else {
              btn_panner_right.classList.add('pk_inact');
              btn_panner_right.innerHTML = '<strong>R</strong> OFF';
            }
          }
        },
      );
      // zoom btns
      var btn_zoom_cnt: UiRuntimeValue = d.createElement('div');
      btn_zoom_cnt.className = 'pk_zoombtn';
      var btn_zoom_in_h: UiRuntimeValue = d.createElement('button');
      btn_zoom_in_h.className = 'pk_btn pk_zoom_in_h';
      btn_zoom_in_h.innerHTML = '+<span>Zoom In Horiz (+)</span>';
      btn_zoom_in_h.setAttribute('tabIndex', -1);
      btn_zoom_in_h.onclick = function (this: UiRuntimeValue) {
        app.fireEvent('RequestZoomUI', 'h', -1);
        this.blur();
      };
      var btn_zoom_out_h: UiRuntimeValue = d.createElement('button');
      btn_zoom_out_h.className = 'pk_btn pk_zoom_out_h pk_inact';
      btn_zoom_out_h.innerHTML = '&ndash;<span>Zoom Out Horiz (-)</span>';
      btn_zoom_out_h.setAttribute('tabIndex', -1);
      btn_zoom_out_h.onclick = function (this: UiRuntimeValue) {
        app.fireEvent('RequestZoomUI', 'h', 1);
        this.blur();
      };
      var btn_zoom_reset: UiRuntimeValue = d.createElement('button');
      btn_zoom_reset.className = 'pk_btn pk_zoom_reset pk_inact';
      btn_zoom_reset.innerHTML = '[R] <span>Reset Zoom (0)</span>';
      btn_zoom_reset.setAttribute('tabIndex', -1);
      btn_zoom_reset.onclick = function (this: UiRuntimeValue) {
        app.fireEvent('RequestZoomUI', 0);
        this.blur();
      };
      UI.KeyHandler.addCallback(
        'Key0',
        function (this: UiRuntimeValue, key?: UiRuntimeValue) {
          if (UI.InteractionHandler.on) return;
          app.fireEvent('RequestZoomUI', 0);
        },
        [48],
      );
      UI.KeyHandler.addCallback(
        'KeyZO',
        function (this: UiRuntimeValue, key?: UiRuntimeValue) {
          if (UI.InteractionHandler.on) return;
          app.fireEvent('RequestZoomUI', 'h', 1);
        },
        [189],
      );
      UI.KeyHandler.addCallback(
        'KeyZI',
        function (this: UiRuntimeValue, key?: UiRuntimeValue) {
          if (UI.InteractionHandler.on) return;
          app.fireEvent('RequestZoomUI', 'h', -1);
        },
        [187],
      );
      var btn_zoom_in_v: UiRuntimeValue = d.createElement('button');
      btn_zoom_in_v.className = 'pk_btn pk_zoom_in_v';
      btn_zoom_in_v.innerHTML = '&#x2195; +<span>Zoom In Vertically</span>';
      btn_zoom_in_v.setAttribute('tabIndex', -1);
      btn_zoom_in_v.onclick = function (this: UiRuntimeValue) {
        app.fireEvent('RequestZoomUI', 'v', -1);
        this.blur();
      };
      var btn_zoom_out_v: UiRuntimeValue = d.createElement('button');
      btn_zoom_out_v.className = 'pk_btn pk_zoom_out_v';
      btn_zoom_out_v.innerHTML = '&#x2195; &ndash;<span>Zoom Out Vertically</span>';
      btn_zoom_out_v.setAttribute('tabIndex', -1);
      btn_zoom_out_v.onclick = function (this: UiRuntimeValue) {
        app.fireEvent('RequestZoomUI', 'v', 1);
        this.blur();
      };
      btn_zoom_cnt.appendChild(btn_zoom_in_h);
      btn_zoom_cnt.appendChild(btn_zoom_out_h);
      btn_zoom_cnt.appendChild(btn_zoom_reset);
      btn_zoom_cnt.appendChild(btn_zoom_in_v);
      btn_zoom_cnt.appendChild(btn_zoom_out_v);
      footer.appendChild(btn_zoom_cnt);
      // end of zoom btns
      var wavezoom: UiRuntimeValue = d.createElement('div');
      wavezoom.className = 'pk_wavescroll';
      var wavepoint_visible: UiRuntimeValue = false;
      var wavepoint: UiRuntimeValue = d.createElement('div');
      wavepoint.className = 'pk_wavepoint';
      var wavedrag: UiRuntimeValue = d.createElement('div');
      var wavedrag_style: UiRuntimeValue = wavedrag.style;
      wavedrag.className = 'pk_wavedrag pk_inact';
      var wavedrag_left: UiRuntimeValue = d.createElement('div');
      wavedrag_left.className = 'pk_wavedrag_l';
      var wavedrag_right: UiRuntimeValue = d.createElement('div');
      wavedrag_right.className = 'pk_wavedrag_r';
      wavezoom.appendChild(wavepoint);
      wavedrag.appendChild(wavedrag_left);
      wavedrag.appendChild(wavedrag_right);
      wavezoom.appendChild(wavedrag);
      footer.appendChild(wavezoom);
      var temp: UiRuntimeValue = 0;
      var wavedrag_width: UiRuntimeValue = 100;
      wavezoom.onclick = function (this: UiRuntimeValue, e?: UiRuntimeValue) {
        if (window.performance.now() - temp < 20) {
          return;
        }
        var rect: UiRuntimeValue = e.target.getBoundingClientRect();
        var x: UiRuntimeValue = e.clientX - rect.left;
        UI.fireEvent('RequestPan', x, 2);
      };
      // add zoom event, and add seek event....
      UI.listenFor('DidZoom', function (this: UiRuntimeValue, v?: UiRuntimeValue) {
        var e: UiRuntimeValue = v[0];
        var o: UiRuntimeValue = v[1];
        if (e === 1) {
          btn_zoom_out_h.classList.add('pk_inact');
          btn_zoom_reset.classList.add('pk_inact');
        } else {
          btn_zoom_out_h.classList.remove('pk_inact');
          btn_zoom_reset.classList.remove('pk_inact');
        }
        if (v[2] != 1) {
          btn_zoom_reset.classList.remove('pk_inact');
        }
        if (e === 1) {
          if (wavepoint_visible) {
            wavepoint.style.display = 'none';
            wavepoint_visible = false;
          }
        } else {
          if (!wavepoint_visible) {
            wavepoint.style.display = 'block';
            wavepoint_visible = true;
          }
          var perc: UiRuntimeValue =
            v[3] !== undefined
              ? v[3]
              : app.engine.wavesurfer.getCurrentTime() / app.engine.wavesurfer.getDuration();
          // wavepoint.style.left = ((perc * 100).toFixed(2)/1) + '%';
          wavepoint.style.left = ((perc * 10000) >> 0) / 100 + '%';
        }
        // get zoom value and left...
        if (100 / e > 99) {
          wavedrag_width = 100;
          wavedrag_style.width = '100%';
          wavedrag_style.left = '0%';
          //wavedrag_style.transform = 'translate(0,0)';
          wavedrag.classList.add('pk_inact');
        } else {
          wavedrag_width = 100 / e;
          wavedrag_style.width = wavedrag_width + '%';
          wavedrag_style.left = o + '%';
          //wavedrag_style.transform = 'translate(' +  (e * o) + '%,0)';
          wavedrag.classList.remove('pk_inact');
        }
      });
      UI.listenFor(
        'DidCursorCenter',
        function (this: UiRuntimeValue, val?: UiRuntimeValue, zoom?: UiRuntimeValue) {
          requestAnimationFrame(function (this: UiRuntimeValue) {
            wavedrag_style.left = val * 100 + '%';
            //wavedrag_style.transform = 'translate(' + (val * zoom * 100) + '%,0)';
          });
        },
      );
      var drag_mode: UiRuntimeValue = 0;
      var startingX: UiRuntimeValue = 0;
      var waveScrollMouseMove: UiRuntimeValue = function (
          this: UiRuntimeValue,
          e?: UiRuntimeValue,
        ) {
          e.stopPropagation();
          e.preventDefault();
          var clx: UiRuntimeValue = e.clientX;
          if (e.touches) {
            if (e.touches.length > 1) return;
            clx = e.touches[0].clientX;
          }
          if (drag_mode === 2) {
            var rect: UiRuntimeValue = wavezoom.getBoundingClientRect();
            UI.fireEvent(
              'RequestPan',
              Math.max(0, Math.min(wavezoom.clientWidth, clx - rect.left)),
              2,
            );
            return;
          }
          var diff: UiRuntimeValue = -startingX + clx;
          if (drag_mode === 0) UI.fireEvent('RequestPan', diff, 1);
          else if (drag_mode === -1) {
            UI.fireEvent('RequestZoom', diff, -1);
          } else if (drag_mode === 1) {
            UI.fireEvent('RequestZoom', diff, 1);
          }
          startingX = clx;
        },
        waveScrollMouseUp: UiRuntimeValue = function (this: UiRuntimeValue, e?: UiRuntimeValue) {
          if (e.touches && e.touches.length > 1) return;
          PKAudioEditor.engine.wavesurfer.Interacting &= ~(1 << 1);
          e.stopPropagation();
          e.preventDefault();
          drag_mode = 0;
          temp = window.performance.now();
          wavedrag.classList.remove('pk_drag');
          document.removeEventListener('mousemove', waveScrollMouseMove);
          document.removeEventListener('mouseup', waveScrollMouseUp);
          document.removeEventListener('touchmove', waveScrollMouseMove, { passive: false });
          document.removeEventListener('touchend', waveScrollMouseUp);
        };
      var mdown: UiRuntimeValue = function (this: UiRuntimeValue, e?: UiRuntimeValue) {
        var mt_on: UiRuntimeValue = activeMultitrackFor(app);
        if (!PKAudioEditor.engine.is_ready && !mt_on) return;
        if (e.target === wavezoom && !mt_on) return;
        if (e.target === wavedrag) {
          drag_mode = 0;
        } else if (e.target === wavedrag_left) {
          drag_mode = -1;
        } else if (e.target === wavedrag_right) {
          drag_mode = 1;
        } else if (mt_on) {
          drag_mode = 2;
        } else return;
        e.stopPropagation();
        e.preventDefault();
        wavedrag.className += ' pk_drag';
        startingX = e.clientX;
        if (drag_mode === 2) waveScrollMouseMove(e);
        PKAudioEditor.engine.wavesurfer.Interacting |= 1 << 1;
        if (e.is_touch) {
          document.addEventListener('touchmove', waveScrollMouseMove, { passive: false });
          document.addEventListener('touchend', waveScrollMouseUp, false);
        } else {
          document.addEventListener('mousemove', waveScrollMouseMove, false);
          document.addEventListener('mouseup', waveScrollMouseUp, false);
        }
      };
      wavezoom.addEventListener('mousedown', mdown, false);
      if ('ontouchstart' in window) {
        wavedrag.addEventListener(
          'touchstart',
          function (this: UiRuntimeValue, e?: UiRuntimeValue) {
            e.preventDefault();
            e.stopPropagation();
            if (e.touches.length > 1) {
              return;
            }
            var ev: UiRuntimeValue = {
              is_touch: true,
              target: wavedrag,
              clientX: e.touches[0].clientX,
              stopPropagation: function (this: UiRuntimeValue) {},
              preventDefault: function (this: UiRuntimeValue) {},
            };
            mdown(ev);
          },
          false,
        );
      }
      this.volumeGauge = d.createElement('div');
      this.volumeGauge2 = d.createElement('div');
      this.volumeGaugeInner = d.createElement('div');
      this.volumeGaugeInner2 = d.createElement('div');
      this.volumeGaugePeaker = d.createElement('div');
      this.volumeGaugePeaker2 = d.createElement('div');
      var volume_parent: UiRuntimeValue = d.createElement('div');
      this.volumeGauge.className = 'pk_volpar';
      this.volumeGauge2.className = 'pk_volpar';
      this.volumeGaugeInner.className = 'pk_vol';
      this.volumeGaugeInner2.className = 'pk_vol';
      this.volumeGaugePeaker.className = 'pk_peaker';
      this.volumeGaugePeaker2.className = 'pk_peaker';
      this.volumeGauge.appendChild(this.volumeGaugeInner);
      this.volumeGauge.appendChild(this.volumeGaugePeaker);
      this.volumeGauge2.appendChild(this.volumeGaugeInner2);
      this.volumeGauge2.appendChild(this.volumeGaugePeaker2);
      var markers: UiRuntimeValue = d.createElement('div');
      markers.className = 'pk_markers pk_noselect';
      var str: UiRuntimeValue = '<span class="pk_mark1">-Inf</span>';
      for (var i: UiRuntimeValue = 35; i >= 0; --i) {
        str += '<span class="pk_mark1 ' + (i % 2 ? 'pk_odd' : '') + '">' + -(i * 2) + '</span>';
      }
      markers.innerHTML = str;
      volume_parent.appendChild(this.volumeGauge);
      volume_parent.appendChild(this.volumeGauge2);
      volume_parent.appendChild(markers);
      volume_parent.onclick = function (this: UiRuntimeValue) {
        q.volumeGaugePeaker.className = 'pk_peaker';
        q.volumeGaugePeaker2.className = 'pk_peaker';
      };
      footer.appendChild(volume_parent);
      var ttmp: UiRuntimeValue = d.createElement('div');
      ttmp.className = 'pk_tmpMsg pk_ed_empty';
      var dragText: UiRuntimeValue = 'Drag n drop an Audio File in this window, or click ';
      var hereText: UiRuntimeValue = 'here to use a sample';
      ttmp.innerHTML =
        dragText +
        '<a style="white-space:nowrap;border:1px solid;border-radius:23px;padding:5px 18px;font-size:0.94em;margin-left:5px" ' +
        'onclick="PKAudioEditor.engine.LoadSample()">' +
        hereText +
        '</a>';
      main_audio_view.appendChild(ttmp);
      var ttmp2: UiRuntimeValue = d.createElement('div');
      ttmp2.className = 'pk_tmpMsg2';
      var waitText: UiRuntimeValue = 'Please Wait...';
      var cancelText: UiRuntimeValue = 'cancel';
      ttmp2.innerHTML =
        '<span>' +
        waitText +
        '</span><div class="pk_mload"><div></div></div>' +
        '<div class="pk_prc"><span>0%</span>' +
        '<button tabIndex="-1" class="pk_btn" ' +
        'onclick="PKAudioEditor.fireEvent(\'RequestCancelModal\');">' +
        cancelText +
        '</button></div>';
      d.body.appendChild(ttmp2);
      UI.loaderEl = ttmp2;
      UI.listenFor('WillDownloadFile', function (this: UiRuntimeValue) {
        UI.loaderEl.classList.add('pk_act');
        UI.loaderEl.getElementsByTagName('span')[1].style.display = 'none';
      });
      UI.listenFor('DidDownloadFile', function (this: UiRuntimeValue) {
        UI.loaderEl.classList.remove('pk_act');
      });
      UI.listenFor('DidProgressModal', function (this: UiRuntimeValue, val?: UiRuntimeValue) {
        UI.loaderEl.getElementsByTagName('span')[1].style.display = 'block';
        UI.loaderEl.getElementsByTagName('span')[1].textContent = val + '%';
      });
    }
    function _bindToolbarTips(
      this: UiRuntimeValue,
      UI?: UiRuntimeValue,
      container?: UiRuntimeValue,
    ) {
      if (!container || !UI || !UI.el || UI.el.classList.contains('pk_mob')) return;
      var tip: UiRuntimeValue = d.createElement('div');
      var active: UiRuntimeValue = null;
      var raf: UiRuntimeValue = 0;
      tip.className = 'pk_ttip';
      UI.el.appendChild(tip);
      function tipButton(this: UiRuntimeValue, node?: UiRuntimeValue) {
        while (node && node !== container) {
          if (node.classList && node.classList.contains('pk_btn')) return node;
          node = node.parentNode;
        }
        return null;
      }
      function hide(this: UiRuntimeValue) {
        active = null;
        tip.classList.remove('pk_act');
        if (raf) {
          w.cancelAnimationFrame(raf);
          raf = 0;
        }
      }
      function place(this: UiRuntimeValue) {
        raf = 0;
        if (!active) return;
        var span: UiRuntimeValue = active.getElementsByTagName('span')[0];
        var txt: UiRuntimeValue = span && span.textContent;
        if (!txt || active.classList.contains('pk_inact')) return hide();
        var r: UiRuntimeValue = active.getBoundingClientRect();
        tip.textContent = txt;
        tip.classList.add('pk_act');
        var tw: UiRuntimeValue = tip.offsetWidth;
        var x: UiRuntimeValue = Math.max(
          4,
          Math.min(w.innerWidth - tw - 4, r.left + (r.width - tw) / 2),
        );
        tip.style.left = (x >> 0) + 'px';
        tip.style.top = ((r.bottom + 6) >> 0) + 'px';
      }
      function show(this: UiRuntimeValue, e?: UiRuntimeValue) {
        var btn: UiRuntimeValue = tipButton(e.target);
        if (!btn || btn === active) return;
        active = btn;
        if (!raf) raf = w.requestAnimationFrame(place);
      }
      container.addEventListener('mouseover', show, false);
      container.addEventListener('focusin', show, false);
      container.addEventListener(
        'mouseout',
        function (this: UiRuntimeValue, e?: UiRuntimeValue) {
          if (!active || tipButton(e.relatedTarget) === active) return;
          hide();
        },
        false,
      );
      container.addEventListener('focusout', hide, false);
      container.addEventListener('scroll', hide, false);
      w.addEventListener('resize', hide, false);
    }
    function _makeUIToolbar(this: UiRuntimeValue, UI?: UiRuntimeValue) {
      var container: UiRuntimeValue = d.createElement('div');
      container.className = 'pk_tbc';
      var toolbar: UiRuntimeValue = d.createElement('div');
      toolbar.className = 'pk_tb pk_noselect';
      var btn_groups: UiRuntimeValue = d.createElement('div');
      btn_groups.className = 'pk_btngroup';
      var transport: UiRuntimeValue = d.createElement('div');
      transport.className = 'pk_transport';
      // play button
      var btn_stop: UiRuntimeValue = d.createElement('button');
      btn_stop.setAttribute('tabIndex', -1);
      btn_stop.innerHTML = '<span>Stop Playback (Space)</span>';
      btn_stop.className = 'pk_btn pk_stop icon-stop2';
      btn_stop.onclick = function (this: UiRuntimeValue) {
        UI.fireEvent('RequestStop');
        this.blur();
      };
      transport.appendChild(btn_stop);
      var btn_play: UiRuntimeValue = d.createElement('button');
      btn_play.setAttribute('tabIndex', -1);
      btn_play.className = 'pk_btn pk_play icon-play3';
      btn_play.innerHTML = '<span>Play (Space)</span>';
      transport.appendChild(btn_play);
      btn_play.onclick = function (this: UiRuntimeValue) {
        UI.fireEvent('RequestPlay');
        this.blur();
      };
      UI.listenFor('DidStopPlay', function (this: UiRuntimeValue) {
        btn_play.classList.remove('pk_act');
      });
      UI.listenFor('DidPlay', function (this: UiRuntimeValue) {
        btn_play.classList.add('pk_act');
      });
      var btn_pause: UiRuntimeValue = d.createElement('button');
      btn_pause.setAttribute('tabIndex', -1);
      btn_pause.className = 'pk_btn pk_pause icon-pause2';
      btn_pause.innerHTML = '<span>Pause (Shift+Space)</span>';
      transport.appendChild(btn_pause);
      btn_pause.onclick = function (this: UiRuntimeValue) {
        UI.fireEvent('RequestPause');
        this.blur();
      };
      var btn_loop: UiRuntimeValue = d.createElement('button');
      btn_loop.setAttribute('tabIndex', -1);
      btn_loop.className = 'pk_btn pk_loop icon-loop';
      btn_loop.innerHTML = '<span>Toggle Loop (L)</span>';
      transport.appendChild(btn_loop);
      btn_loop.onclick = function (this: UiRuntimeValue) {
        UI.fireEvent('RequestSetLoop');
        this.blur();
      };
      UI.listenFor('DidSetLoop', function (this: UiRuntimeValue, val?: UiRuntimeValue) {
        val ? btn_loop.classList.add('pk_act') : btn_loop.classList.remove('pk_act');
      });
      var btn_back_jump: UiRuntimeValue = d.createElement('button');
      btn_back_jump.setAttribute('tabIndex', -1);
      btn_back_jump.className = 'pk_btn pk_back_jump icon-backward2';
      btn_back_jump.innerHTML = '<span>Seek (left arrow)</span>';
      transport.appendChild(btn_back_jump);
      ///////////////////////////////////////////////////////////
      // REWING / BACK BTN
      var btn_back_focus: UiRuntimeValue = false;
      var btn_back_hold: UiRuntimeValue = false;
      var btn_back_tm: UiRuntimeValue = null;
      btn_back_jump.onclick = function (this: UiRuntimeValue) {
        if (!btn_back_focus) {
          if (btn_back_tm) {
            clearTimeout(btn_back_tm);
            btn_back_tm = null;
          }
          var big_step: UiRuntimeValue = activeDurationFor(app) / 20;
          var zoom: UiRuntimeValue = activeZoomFor(app);
          big_step /= zoom / 2 + 0.5;
          if (big_step > 1) big_step = big_step << 0;
          UI.fireEvent('RequestSkipBack', big_step);
        }
        this.blur();
        btn_back_focus = false;
        btn_back_hold = false;
      };
      btn_back_jump.onmousedown = function (this: UiRuntimeValue) {
        btn_back_hold = true;
        this.focus();
        if (!btn_back_tm) this.onfocus();
      };
      btn_back_jump.onmouseup = function (this: UiRuntimeValue) {
        btn_back_hold = false;
      };
      btn_back_jump.onmouseleave = function (this: UiRuntimeValue) {
        btn_back_hold = false;
        if (btn_back_tm) {
          clearTimeout(btn_back_tm);
          btn_back_tm = null;
        }
        this.blur();
      };
      btn_back_jump.onfocus = function (this: UiRuntimeValue) {
        var btn: UiRuntimeValue = this;
        btn_back_focus = false;
        if (btn_back_tm) clearTimeout(btn_back_tm);
        var step: UiRuntimeValue = function (
          this: UiRuntimeValue,
          num?: UiRuntimeValue,
          count?: UiRuntimeValue,
        ) {
          if (btn_back_hold || document.activeElement === btn) {
            btn_back_focus = true;
            UI.fireEvent('RequestSkipBack', num);
            if (count >= activeSeekWarmupFor(app)) num += num * activeSeekRampFor(app);
            btn_back_tm = setTimeout(function (this: UiRuntimeValue) {
              step(num, ++count);
            }, 40);
          }
        };
        btn_back_tm = setTimeout(function (this: UiRuntimeValue) {
          var small: UiRuntimeValue = activeDurationFor(app) / 2000;
          var zoom: UiRuntimeValue = activeZoomFor(app);
          small /= zoom;
          if (small < 0.01) {
            small = 0.01;
          }
          step(small, 0);
        }, 220);
      };
      ////////////////////////
      var btn_front_jump: UiRuntimeValue = d.createElement('button');
      btn_front_jump.setAttribute('tabIndex', -1);
      btn_front_jump.className = 'pk_btn pk_front_jump icon-forward3';
      btn_front_jump.innerHTML = '<span>Seek (right arrow)</span>';
      transport.appendChild(btn_front_jump);
      var btn_frnt_focus: UiRuntimeValue = false;
      var btn_frnt_hold: UiRuntimeValue = false;
      var btn_frnt_tm: UiRuntimeValue = null;
      btn_front_jump.onclick = function (this: UiRuntimeValue) {
        if (!btn_frnt_focus) {
          if (btn_frnt_tm) {
            clearTimeout(btn_frnt_tm);
            btn_frnt_tm = null;
          }
          var big_step: UiRuntimeValue = activeDurationFor(app) / 20;
          var zoom: UiRuntimeValue = activeZoomFor(app);
          big_step /= zoom / 2 + 0.5;
          if (big_step > 1) big_step = big_step << 0;
          UI.fireEvent('RequestSkipFront', big_step);
        }
        this.blur();
        btn_frnt_focus = false;
        btn_frnt_hold = false;
      };
      btn_front_jump.onmousedown = function (this: UiRuntimeValue) {
        btn_frnt_hold = true;
        this.focus();
        if (!btn_frnt_tm) this.onfocus();
      };
      btn_front_jump.onmouseup = function (this: UiRuntimeValue) {
        btn_frnt_hold = false;
      };
      btn_front_jump.onmouseleave = function (this: UiRuntimeValue) {
        btn_frnt_hold = false;
        if (btn_frnt_tm) {
          clearTimeout(btn_frnt_tm);
          btn_frnt_tm = null;
        }
        this.blur();
      };
      btn_front_jump.onfocus = function (this: UiRuntimeValue) {
        var btn: UiRuntimeValue = this;
        btn_frnt_focus = false;
        if (btn_frnt_tm) clearTimeout(btn_frnt_tm);
        var step: UiRuntimeValue = function (
          this: UiRuntimeValue,
          num?: UiRuntimeValue,
          count?: UiRuntimeValue,
        ) {
          if (btn_frnt_hold || document.activeElement === btn) {
            btn_frnt_focus = true;
            UI.fireEvent('RequestSkipFront', num);
            if (count >= activeSeekWarmupFor(app)) num += num * activeSeekRampFor(app);
            btn_frnt_tm = setTimeout(function (this: UiRuntimeValue) {
              step(num, ++count);
            }, 40);
          }
        };
        btn_frnt_tm = setTimeout(function (this: UiRuntimeValue) {
          var small: UiRuntimeValue = activeDurationFor(app) / 2000;
          var zoom: UiRuntimeValue = activeZoomFor(app);
          small /= zoom;
          if (small < 0.01) {
            small = 0.01;
          }
          step(small, 0);
        }, 220);
      };
      ////////////////////////
      var k_arr_bck_time: UiRuntimeValue = 0;
      var k_arr_bck_mult: UiRuntimeValue = 1;
      var k_arr_bck_skip_frames: UiRuntimeValue = 4;
      UI.KeyHandler.addCallback(
        'KeyArrowBack',
        function (
          this: UiRuntimeValue,
          key?: UiRuntimeValue,
          c?: UiRuntimeValue,
          ev?: UiRuntimeValue,
        ) {
          var mt_on: UiRuntimeValue = activeMultitrackFor(app);
          if (UI.InteractionHandler.on || (!PKAudioEditor.engine.is_ready && !mt_on)) return;
          if (c[16] || (ev && ev.shiftKey)) return;
          if (mt_on && ev) ev.preventDefault();
          var time: UiRuntimeValue = ev ? ev.timeStamp : w.performance.now();
          var diff: UiRuntimeValue = time - k_arr_bck_time;
          if (diff > 158) {
            k_arr_bck_mult = 1;
            k_arr_bck_skip_frames = mt_on ? activeSeekWarmupFor(app) : 4;
          } else {
            if (--k_arr_bck_skip_frames < 0 && k_arr_bck_mult < 6.0)
              k_arr_bck_mult += mt_on ? activeSeekRampFor(app) : 0.05;
          }
          k_arr_bck_time = time;
          // get zoom factor
          var jump: UiRuntimeValue = 0.5;
          var zoom: UiRuntimeValue = mt_on
            ? activeZoomFor(app)
            : PKAudioEditor.engine.wavesurfer.ZoomFactor;
          var total_dur: UiRuntimeValue = mt_on
            ? activeDurationFor(app)
            : PKAudioEditor.engine.wavesurfer.getDuration();
          jump = Math.max(total_dur / 200, 0.05);
          jump /= zoom;
          jump *= k_arr_bck_mult;
          UI.fireEvent('RequestSkipBack', jump);
        },
        [37],
      );
      var k_arr_frnt_time: UiRuntimeValue = 0;
      var k_arr_frnt_mult: UiRuntimeValue = 1;
      var k_arr_frnt_skip_frames: UiRuntimeValue = 4;
      UI.KeyHandler.addCallback(
        'KeyArrowFront',
        function (
          this: UiRuntimeValue,
          key?: UiRuntimeValue,
          c?: UiRuntimeValue,
          ev?: UiRuntimeValue,
        ) {
          var mt_on: UiRuntimeValue = activeMultitrackFor(app);
          if (UI.InteractionHandler.on || (!PKAudioEditor.engine.is_ready && !mt_on)) return;
          if (c[16] || (ev && ev.shiftKey)) return;
          if (mt_on && ev) ev.preventDefault();
          var time: UiRuntimeValue = ev ? ev.timeStamp : w.performance.now();
          var diff: UiRuntimeValue = time - k_arr_frnt_time;
          if (diff > 158) {
            k_arr_frnt_mult = 1;
            k_arr_frnt_skip_frames = mt_on ? activeSeekWarmupFor(app) : 4;
          } else {
            if (--k_arr_frnt_skip_frames < 0 && k_arr_frnt_mult < 6.0)
              k_arr_frnt_mult += mt_on ? activeSeekRampFor(app) : 0.05;
          }
          k_arr_frnt_time = time;
          var jump: UiRuntimeValue = 0.5;
          var zoom: UiRuntimeValue = mt_on
            ? activeZoomFor(app)
            : PKAudioEditor.engine.wavesurfer.ZoomFactor;
          var total_dur: UiRuntimeValue = mt_on
            ? activeDurationFor(app)
            : PKAudioEditor.engine.wavesurfer.getDuration();
          jump = Math.max(total_dur / 200, 0.05);
          jump /= zoom;
          jump *= k_arr_frnt_mult;
          UI.fireEvent('RequestSkipFront', jump);
        },
        [39],
      );
      function mtSelectChannelKey(
        this: UiRuntimeValue,
        diff?: UiRuntimeValue,
        ev?: UiRuntimeValue,
      ) {
        var mt_on: UiRuntimeValue = activeMultitrackFor(app);
        var target: UiRuntimeValue = ev && ev.target;
        if (
          !mt_on ||
          UI.InteractionHandler.on ||
          (UI.TopHeader.getOpenElement && UI.TopHeader.getOpenElement()) ||
          (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName))
        )
          return;
        ev && ev.preventDefault();
        ev && ev.stopPropagation();
        UI.fireEvent('RequestChannelSelect', diff);
      }
      UI.KeyHandler.addCallback(
        'KeyMtChannelUp',
        function (
          this: UiRuntimeValue,
          key?: UiRuntimeValue,
          c?: UiRuntimeValue,
          ev?: UiRuntimeValue,
        ) {
          mtSelectChannelKey(-1, ev);
        },
        [38],
      );
      UI.KeyHandler.addCallback(
        'KeyMtChannelDown',
        function (
          this: UiRuntimeValue,
          key?: UiRuntimeValue,
          c?: UiRuntimeValue,
          ev?: UiRuntimeValue,
        ) {
          mtSelectChannelKey(1, ev);
        },
        [40],
      );
      UI.KeyHandler.addCallback(
        'KeyShiftArrowBack',
        function (
          this: UiRuntimeValue,
          key?: UiRuntimeValue,
          c?: UiRuntimeValue,
          ev?: UiRuntimeValue,
        ) {
          var mt_on: UiRuntimeValue = activeMultitrackFor(app);
          if (
            UI.InteractionHandler.on ||
            (ev && (ev.ctrlKey || ev.metaKey)) ||
            (!PKAudioEditor.engine.is_ready && !mt_on)
          )
            return;
          ev && ev.preventDefault();
          seekRegionMarkerEdgeFor(PKAE, -1);
        },
        [16, 37],
      );
      UI.KeyHandler.addCallback(
        'KeyShiftArrowFront',
        function (
          this: UiRuntimeValue,
          key?: UiRuntimeValue,
          c?: UiRuntimeValue,
          ev?: UiRuntimeValue,
        ) {
          var mt_on: UiRuntimeValue = activeMultitrackFor(app);
          if (
            UI.InteractionHandler.on ||
            (ev && (ev.ctrlKey || ev.metaKey)) ||
            (!PKAudioEditor.engine.is_ready && !mt_on)
          )
            return;
          ev && ev.preventDefault();
          seekRegionMarkerEdgeFor(PKAE, 1);
        },
        [16, 39],
      );
      UI.KeyHandler.addCallback(
        'killctx',
        function (this: UiRuntimeValue, e?: UiRuntimeValue) {
          var event: UiRuntimeValue = new Event('killCTX', { bubbles: true });
          document.body.dispatchEvent(event);
        },
        [27],
      );
      var btn_back_total: UiRuntimeValue = d.createElement('button');
      btn_back_total.setAttribute('tabIndex', -1);
      btn_back_total.className = 'pk_btn icon-previous2';
      btn_back_total.innerHTML = '<span>Seek Start (Shift + left arrow)</span>';
      transport.appendChild(btn_back_total);
      btn_back_total.onclick = function (this: UiRuntimeValue) {
        seekRegionMarkerEdgeFor(PKAE, -1);
        this.blur();
      };
      var btn_front_total: UiRuntimeValue = d.createElement('button');
      btn_front_total.setAttribute('tabIndex', -1);
      btn_front_total.className = 'pk_btn icon-next2';
      btn_front_total.innerHTML = '<span>Seek End (Shift + right arrow)</span>';
      btn_front_total.onclick = function (this: UiRuntimeValue) {
        seekRegionMarkerEdgeFor(PKAE, 1);
        this.blur();
      };
      transport.appendChild(btn_front_total);
      var btn_rec: UiRuntimeValue = d.createElement('button');
      btn_rec.setAttribute('tabIndex', -1);
      btn_rec.className = 'pk_btn icon-rec';
      btn_rec.innerHTML = '<span>Record (R)</span>';
      btn_rec.onclick = function (this: UiRuntimeValue) {
        if (this.getAttribute('disabled') === 'disabled') {
          this.blur();
          return;
        }
        UI.fireEvent('RequestActionRecordToggle');
        this.blur();
      };
      UI.listenFor('ErrorRec', function (this: UiRuntimeValue) {
        btn_rec.style.opacity = 0.6;
        btn_rec.setAttribute('disabled', 'disabled');
      });
      transport.appendChild(btn_rec);
      UI.KeyHandler.addCallback(
        'KeyRecR',
        function (this: UiRuntimeValue, k?: UiRuntimeValue) {
          if (UI.InteractionHandler.on) return;
          btn_rec.click();
        },
        [82],
      );
      UI.listenFor('DidActionRecordStart', function (this: UiRuntimeValue) {
        btn_rec.classList.add('pk_act');
      });
      UI.listenFor('DidActionRecordStop', function (this: UiRuntimeValue) {
        btn_rec.classList.remove('pk_act');
      });
      UI.KeyHandler.addCallback(
        'KeyTab',
        function (this: UiRuntimeValue, key?: UiRuntimeValue) {
          if (UI.InteractionHandler.on || !activeReadyFor(app)) return;
          UI.fireEvent('RequestViewCenterToCursor');
        },
        [9],
      );
      var is_chrome: UiRuntimeValue = !!window.chrome;
      var timing: UiRuntimeValue = d.createElement('div');
      timing.className = 'pk_timecontainer';
      var timingspan: UiRuntimeValue = d.createElement('span');
      if (!is_chrome) {
        timingspan.textContent = '00:00:000';
        timingspan.className = 'pk_timing';
        timing.appendChild(timingspan);
      }
      /////
      var pk_timingcnv: UiRuntimeValue = d.createElement('canvas');
      pk_timingcnv.className = 'pk_timingcnv';
      pk_timingcnv.width = 150;
      pk_timingcnv.height = 40;
      var pk_timingnum: UiRuntimeValue = '00:00:000';
      var pk_timingctx: UiRuntimeValue = pk_timingcnv.getContext('2d');
      var timing_caches: UiRuntimeValue = {};
      if (is_chrome) {
        timing.appendChild(pk_timingcnv);
        pk_timingctx.clearRect(0, 0, 150, 40);
        for (var ii: UiRuntimeValue = 0; ii < 11; ++ii) {
          var curr_cache: UiRuntimeValue = d.createElement('canvas');
          curr_cache.width = 18;
          curr_cache.height = 26;
          var curr_ctx: UiRuntimeValue = curr_cache.getContext('2d');
          curr_ctx.font = '29px Helvetica, Arial, sans-serif';
          curr_ctx.textAlign = 'center';
          curr_ctx.clearRect(0, 0, 18, 26);
          curr_ctx.fillStyle = '#fff';
          curr_ctx.textBaseline = 'middle';
          if (ii === 10) {
            curr_ctx.fillText(':', 8, 14);
            timing_caches[':'] = curr_cache;
          } else {
            curr_ctx.fillText(ii + '', 9, 14);
            timing_caches[ii + ''] = curr_cache;
          }
          // timing_caches.push (curr_cache);
          // document.body.appendChild( curr_cache );
        }
        (function (
          this: UiRuntimeValue,
          pk_timingctx?: UiRuntimeValue,
          timing_caches?: UiRuntimeValue,
        ) {
          var ttm: UiRuntimeValue = '00:00:000';
          for (var jk: UiRuntimeValue = 0; jk < ttm.length; ++jk) {
            pk_timingctx.drawImage(timing_caches[ttm[jk]], jk * 16, 10);
          }
        })(pk_timingctx, timing_caches);
      }
      function refreshTimingTheme(this: UiRuntimeValue) {
        if (!is_chrome || !w.AMTheme) return;
        var fg: UiRuntimeValue = w.AMTheme.color('foreground', '#fff');
        pk_timingctx.clearRect(0, 0, 150, 40);
        for (var key in timing_caches) {
          if (!Object.prototype.hasOwnProperty.call(timing_caches, key)) continue;
          var cache: UiRuntimeValue = timing_caches[key];
          var cache_ctx: UiRuntimeValue = cache.getContext('2d');
          cache_ctx.clearRect(0, 0, 18, 26);
          cache_ctx.fillStyle = fg;
          cache_ctx.font = '29px Helvetica, Arial, sans-serif';
          cache_ctx.textAlign = 'center';
          cache_ctx.textBaseline = 'middle';
          cache_ctx.fillText(key, key === ':' ? 8 : 9, 14);
        }
        for (var ti: UiRuntimeValue = 0; ti < pk_timingnum.length; ++ti) {
          pk_timingctx.drawImage(timing_caches[pk_timingnum[ti]], ti * 16, 10);
        }
      }
      w.addEventListener('am:themechange', function (this: UiRuntimeValue) {
        (w.requestAnimationFrame || w.setTimeout)(refreshTimingTheme);
      });
      refreshTimingTheme();
      /////
      var total_duration: UiRuntimeValue = d.createElement('span');
      total_duration.textContent = '00:00:000';
      total_duration.className = 'pk_total_dur';
      timing.appendChild(total_duration);
      var hover_duration: UiRuntimeValue = d.createElement('span');
      hover_duration.textContent = '00:00:000';
      hover_duration.className = 'pk_hover_dur';
      timing.appendChild(hover_duration);
      var tb: UiRuntimeValue = null,
        tc: UiRuntimeValue = 0,
        td: UiRuntimeValue = 0;
      function closeTB(this: UiRuntimeValue) {
        if (!tb) return;
        d.removeEventListener('mousedown', tb._off);
        tb.parentNode && tb.parentNode.removeChild(tb);
        tb = null;
      }
      function tnav(
        this: UiRuntimeValue,
        b?: UiRuntimeValue,
        a?: UiRuntimeValue,
        go?: UiRuntimeValue,
        cl?: UiRuntimeValue,
      ) {
        b.onkeydown = function (this: UiRuntimeValue, ev?: UiRuntimeValue) {
          var k: UiRuntimeValue = ev.keyCode,
            j: UiRuntimeValue;
          ev.stopPropagation();
          if (k === 13) go();
          else if (k === 27) cl();
          else if (k > 36 && k < 41 && (j = a.indexOf(ev.target)) > -1) {
            if (
              (k === 37 || k === 39) &&
              ev.target.tagName === 'INPUT' &&
              (ev.target.selectionStart !== ev.target.selectionEnd ||
                (k === 37 && ev.target.selectionStart > 0) ||
                (k === 39 && ev.target.selectionEnd < ev.target.value.length))
            )
              return;
            j = (j + (k < 39 ? -1 : 1) + a.length) % a.length;
            a[j].focus();
            a[j].tagName === 'INPUT' && a[j].select();
            ev.preventDefault();
          }
        };
      }
      function openTB(this: UiRuntimeValue, e?: UiRuntimeValue) {
        e && e.stopPropagation();
        e && e.preventDefault();
        var dur: UiRuntimeValue = activeDurationFor(app) || td || 0;
        closeTB();
        var t: UiRuntimeValue = Math.max(0, Math.min(dur, tc || activeCursorTimeFor(app) || 0));
        var s: UiRuntimeValue = t >> 0;
        var ms: UiRuntimeValue = ((t - s) * 1000 + 0.5) >> 0;
        if (ms > 999) {
          ms = 0;
          ++s;
        }
        var m: UiRuntimeValue = (s / 60) >> 0;
        s %= 60;
        var b: UiRuntimeValue = (tb = d.createElement('div'));
        b.className = 'pk_pgeq_freq';
        b.style.padding = '3px 16px';
        b.style.paddingRight = '6px';
        b.innerHTML =
          '<input class="pk_mtbeat_bpm" style=width:46px> <b>:</b> <input class="pk_mtbeat_bpm" style=width:46px>' +
          ' <b>:</b> <input class="pk_mtbeat_bpm" style=width:46px> <button class="pk_modal_a_bottom pk_modal_a_accpt" style="float:none;display:inline-block;vertical-align:middle">Go</button>';
        d.body.appendChild(b);
        var i: UiRuntimeValue = b.getElementsByTagName('input');
        var g: UiRuntimeValue = b.lastChild;
        var a: UiRuntimeValue = [i[0], i[1], i[2], g];
        i[0].value = m;
        i[1].value = s;
        i[2].value = ms;
        var r: UiRuntimeValue = timing.getBoundingClientRect();
        b.style.left = (r.left | 0) + 'px';
        b.style.top = ((r.top + 3) | 0) + 'px';
        function go(this: UiRuntimeValue) {
          var durr: UiRuntimeValue = activeDurationFor(app) || td || 0;
          if (!(durr > 0)) return closeTB();
          var v: UiRuntimeValue = Math.max(
            0,
            Math.min(durr, (i[0].value | 0) * 60 + (i[1].value | 0) + (i[2].value | 0) / 1000),
          );
          tc = v;
          drawT(v);
          UI.fireEvent('RequestSeekTo', v / durr);
          closeTB();
        }
        b._off = function (this: UiRuntimeValue, ev?: UiRuntimeValue) {
          if (!b.contains(ev.target) && !timing.contains(ev.target)) closeTB();
        };
        tnav(b, a, go, closeTB);
        g.onclick = go;
        d.addEventListener('mousedown', b._off);
        i[0].focus();
        i[0].select();
      }
      timing.onmousedown = openTB;
      setTimeout(function (this: UiRuntimeValue) {
        UI.listenFor(
          'DidZoom',
          function (this: UiRuntimeValue, v?: UiRuntimeValue, f?: UiRuntimeValue) {
            // do something smarter for f (event) ####
            if (f)
              hover_duration.textContent = formatTime(
                PKAudioEditor.engine.wavesurfer.drawer.handleEvent(f) *
                  PKAudioEditor.engine.wavesurfer.VisibleDuration +
                  PKAudioEditor.engine.wavesurfer.LeftProgress,
              );
          },
        );
        var old_refresh: UiRuntimeValue = 0;
        var avv: UiRuntimeValue = d.getElementsByClassName('pk_av')[0];
        avv.addEventListener(
          'mousemove',
          function (this: UiRuntimeValue, e?: UiRuntimeValue) {
            // re-run the mousemove fam on zoom based on the pointer position)
            // throttle this as well ####  violation
            var new_refresh: UiRuntimeValue = e.timeStamp;
            if (new_refresh - old_refresh < 58) {
              return;
            }
            old_refresh = new_refresh;
            hover_duration.textContent = formatTime(
              PKAudioEditor.engine.wavesurfer.drawer.handleEvent(e) *
                PKAudioEditor.engine.wavesurfer.VisibleDuration +
                PKAudioEditor.engine.wavesurfer.LeftProgress,
            );
          },
          false,
        );
        var main_context: UiRuntimeValue = PKAudioEditor._deps.ContextMenu(avv);
        main_context.addOption(
          'Select Visible View',
          function (
            this: UiRuntimeValue,
            e?: UiRuntimeValue,
            x?: UiRuntimeValue,
            i?: UiRuntimeValue,
          ) {
            UI.fireEvent('RequestRegionSet');
          },
          false,
        );
        main_context.addOption(
          'Reset Zoom',
          function (this: UiRuntimeValue, e?: UiRuntimeValue) {
            UI.fireEvent('RequestZoomUI', 0);
          },
          false,
        );
        UI.listenFor('DidHoverTime', function (this: UiRuntimeValue, time?: UiRuntimeValue) {
          hover_duration.textContent = formatTime(time);
        });
        main_context.addOption(
          'Set Volume/Gain',
          function (this: UiRuntimeValue, e?: UiRuntimeValue) {
            UI.fireEvent('RequestFXUI_Gain');
          },
          false,
        );
        main_context.addOption(
          'Seamless Loop...',
          function (this: UiRuntimeValue, e?: UiRuntimeValue) {
            UI.fireEvent('RequestActionFXUI_SeamlessLoop');
          },
          false,
        );
        main_context.addOption(
          'Copy',
          function (this: UiRuntimeValue, e?: UiRuntimeValue) {
            var region: UiRuntimeValue = PKAudioEditor.engine.wavesurfer.regions.list[0];
            if (!region) return;
            UI.fireEvent('RequestActionCopy');
          },
          false,
        );
        main_context.addOption(
          'Paste',
          function (this: UiRuntimeValue, e?: UiRuntimeValue) {
            if (!copable) return;
            UI.fireEvent('RequestActionPaste');
          },
          false,
        );
        main_context.addOption(
          'Cut',
          function (this: UiRuntimeValue, e?: UiRuntimeValue) {
            var region: UiRuntimeValue = PKAudioEditor.engine.wavesurfer.regions.list[0];
            if (!region) return;
            UI.fireEvent('RequestActionCut', 1);
          },
          false,
        );
        main_context.addOption(
          'Insert Silence',
          function (this: UiRuntimeValue, e?: UiRuntimeValue) {
            UI.fireEvent('RequestFXUI_Silence', 0); // #### call effect
          },
          false,
        );
        // ---
        var copable: UiRuntimeValue = false;
        UI.listenFor('DidSetClipboard', function (this: UiRuntimeValue, val?: UiRuntimeValue) {
          if (val) copable = true;
          else copable = false;
        });
        main_context.onOpen = function (
          this: UiRuntimeValue,
          menu?: UiRuntimeValue,
          div?: UiRuntimeValue,
        ) {
          var divs: UiRuntimeValue = div.childNodes;
          if (!copable) divs[5].className += ' pk_inact';
          UI.fireEvent('RequestPause');
          var region: UiRuntimeValue = PKAudioEditor.engine.wavesurfer.regions.list[0];
          if (region) return;
          divs[3].className += ' pk_inact';
          divs[4].className += ' pk_inact';
          divs[6].className += ' pk_inact';
        };
      }, 1000);
      UI.listenFor('DidUpdateLen', function (this: UiRuntimeValue, val?: UiRuntimeValue) {
        td = val || 0;
        total_duration.textContent = formatTime(val);
      });
      function formatTime(this: UiRuntimeValue, time?: UiRuntimeValue) {
        var time_s: UiRuntimeValue = time >> 0;
        var miliseconds: UiRuntimeValue = time - time_s;
        if (time_s < 10) {
          if (time === 0) return '00:00:000';
          time_s = '00:0' + time_s;
        } else if (time_s < 60) {
          time_s = '00:' + time_s;
        } else {
          var m: UiRuntimeValue = (time_s / 60) >> 0;
          var s: UiRuntimeValue = time_s % 60;
          time_s = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' + s : s);
        }
        if (miliseconds < 0.1) {
          return time_s + ':0' + (miliseconds < 0.01 ? '0' : '') + ((miliseconds * 1000) >> 0);
        }
        return time_s + ':' + ((miliseconds * 1000) >> 0); // (miliseconds+'').substr(2, 3);
      }
      UI.formatTime = formatTime;
      function drawT(this: UiRuntimeValue, time?: UiRuntimeValue) {
        var ttm: UiRuntimeValue = formatTime(time);
        if (!is_chrome) {
          timingspan.textContent = ttm;
          return;
        }
        if (ttm === pk_timingnum) return;
        pk_timingctx.clearRect(0, 0, 150, 40);
        for (var jk: UiRuntimeValue = 0; jk < ttm.length; ++jk) {
          pk_timingctx.drawImage(timing_caches[ttm[jk]], jk * 16, 10);
        }
        pk_timingnum = ttm;
      }
      function formatTimelineTime(
        this: UiRuntimeValue,
        time?: UiRuntimeValue,
        format?: UiRuntimeValue,
      ) {
        var time_s: UiRuntimeValue = time >> 0;
        var miliseconds: UiRuntimeValue = time - time_s;
        if (time_s < 10) time_s = '00:0' + time_s;
        else if (time_s < 60) time_s = '00:' + time_s;
        else {
          var m: UiRuntimeValue = (time_s / 60) >> 0;
          var s: UiRuntimeValue = time_s % 60;
          time_s = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' + s : s);
        }
        if (format === 1) return time_s + ':' + (miliseconds + '').substr(2, 2);
        return time_s;
      }
      UI.formatTimelineTime = formatTimelineTime;
      function timelineRuler(
        this: UiRuntimeValue,
        total?: UiRuntimeValue,
        width?: UiRuntimeValue,
        left_offset?: UiRuntimeValue,
        visible_width?: UiRuntimeValue,
      ) {
        var data: UiRuntimeValue = { step: 0, ticks: [], halves: [] };
        if (!total || !width) return data;
        var pixel_distance: UiRuntimeValue = width / total;
        if (pixel_distance < 60) pixel_distance = 60;
        else if (pixel_distance > 160) pixel_distance /= ((pixel_distance / 160) >> 0) + 1;
        data.step = pixel_distance;
        left_offset = left_offset || 0;
        visible_width = visible_width || width;
        var step_time: UiRuntimeValue = (pixel_distance / width) * total;
        var format: UiRuntimeValue = step_time < 1.0 ? 1 : step_time < 60 ? 2 : 3;
        var x: UiRuntimeValue = Math.max(
          0,
          (((left_offset - 2) / pixel_distance) >> 0) * pixel_distance,
        );
        var end: UiRuntimeValue = left_offset + visible_width + 2;
        for (; x <= end && x < width - 2; x += pixel_distance) {
          if (x >= left_offset - 2)
            data.ticks.push({
              x: x,
              time: (x / width) * total,
              label: formatTimelineTime((x / width) * total, format),
            });
        }
        x = Math.max(
          pixel_distance / 2,
          (((left_offset - 2 - pixel_distance / 2) / pixel_distance) >> 0) * pixel_distance +
            pixel_distance / 2,
        );
        for (; x <= end && x < width - 2; x += pixel_distance)
          if (x >= left_offset - 2) data.halves.push(x);
        return data;
      }
      UI.timelineRuler = timelineRuler;
      function drawTimelineRuler(
        this: UiRuntimeValue,
        ctx?: UiRuntimeValue,
        total?: UiRuntimeValue,
        width?: UiRuntimeValue,
        left_offset?: UiRuntimeValue,
        visible_width?: UiRuntimeValue,
      ) {
        var data: UiRuntimeValue = timelineRuler(total, width, left_offset, visible_width);
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, visible_width, 24);
        ctx.fillStyle = '#aaa';
        ctx.strokeStyle = '#aaa';
        ctx.textAlign = 'center';
        for (var i: UiRuntimeValue = 0; i < data.ticks.length; ++i)
          ctx.fillText(data.ticks[i].label, data.ticks[i].x - left_offset, 12);
        ctx.beginPath();
        for (i = 0; i < data.ticks.length; ++i) {
          var x: UiRuntimeValue = data.ticks[i].x - left_offset;
          ctx.moveTo(x, 16);
          ctx.lineTo(x, 24);
        }
        for (i = 0; i < data.halves.length; ++i) {
          x = data.halves[i] - left_offset;
          ctx.moveTo(x, 19);
          ctx.lineTo(x, 24);
        }
        ctx.stroke();
        return data;
      }
      UI.drawTimelineRuler = drawTimelineRuler;
      var volume1: UiRuntimeValue = 0;
      var volume2: UiRuntimeValue = 0;
      var old_refresh: UiRuntimeValue = 0;
      var wvpnt: UiRuntimeValue = document.querySelector('.pk_wavepoint');
      UI.listenFor('DidAudioProcess', function (this: UiRuntimeValue, val?: UiRuntimeValue) {
        var time: UiRuntimeValue = val[0];
        var loudness: UiRuntimeValue = val[1];
        if (time > -1) tc = time;
        var new_refresh: UiRuntimeValue = val[2] || w.performance.now();
        if (new_refresh - old_refresh < 50) {
          return;
        }
        old_refresh = new_refresh;
        if (time > -1) {
          drawT(time);
          var mt_on: UiRuntimeValue = activeMultitrackFor(app);
          var zoomed: UiRuntimeValue = mt_on
            ? mt_on.GetZoomFactor() > 1
            : PKAudioEditor.engine.wavesurfer.ZoomFactor > 1;
          if (zoomed) {
            var perc: UiRuntimeValue = mt_on
              ? mt_on.GetCursorPercent()
              : time / PKAudioEditor.engine.wavesurfer.getDuration();
            if (!wvpnt) wvpnt = document.querySelector('.pk_wavepoint');
            wvpnt.style.left = ((perc * 10000) >> 0) / 100 + '%';
            // wvpnt.style.left = ((perc * 100).toFixed(2)/1) + '%';
          }
        }
        if (!loudness) {
          UI.footer.volumeGaugePeaker.className = 'pk_peaker';
          UI.footer.volumeGaugePeaker2.className = 'pk_peaker';
          UI.footer.volumeGaugeInner.style.transform = 'translate3d(0,0,0)';
          UI.footer.volumeGaugeInner2.style.transform = 'translate3d(0,0,0)';
          // UI.footer.volumeGaugeInner.style.width = '100%';
          // UI.footer.volumeGaugeInner2.style.width = '100%';
        } else if (loudness[0] > 0) {
          UI.footer.volumeGaugePeaker.className = 'pk_peaker pk_act';
          UI.footer.volumeGaugeInner.style.transform = 'translate3d(100%,0,0)';
          // UI.footer.volumeGaugeInner.style.width = '0%';
          volume1 = 100;
          var peak_time: UiRuntimeValue = activeCursorTimeFor(app);
          UI.footer.volumeGaugePeaker.setAttribute('title', 'Peak at ' + peak_time.toFixed(2));
          if (loudness[1] > 0) {
            UI.footer.volumeGaugePeaker2.className = 'pk_peaker pk_act';
            UI.footer.volumeGaugeInner2.style.transform = 'translate3d(100%,0,0)';
            // UI.footer.volumeGaugeInner2.style.width = '0%';
            volume2 = 100;
            UI.footer.volumeGaugePeaker2.setAttribute('title', 'Peak at ' + peak_time.toFixed(2));
          }
        } else if (loudness[1] > 0) {
          UI.footer.volumeGaugePeaker2.className = 'pk_peaker pk_act';
          UI.footer.volumeGaugeInner2.style.transform = 'translate3d(100%,0,0)';
          // UI.footer.volumeGaugeInner2.style.width = '0%';
          volume2 = 100;
          var peak_time2: UiRuntimeValue = activeCursorTimeFor(app);
          UI.footer.volumeGaugePeaker2.setAttribute('title', 'Peak at ' + peak_time2.toFixed(2));
        } else {
          var tmp: UiRuntimeValue = 100 + loudness[0];
          if (tmp < -100)
            volume1 = 0; // tmp = -100;
          else {
            volume1 = volume1 + (tmp - volume1) / 4;
            if (isNaN(volume1)) volume1 = 0;
          }
          tmp = 100 + loudness[1];
          if (tmp < -100)
            volume2 = 0; //tmp = -100;
          else {
            volume2 = volume2 + (tmp - volume2) / 4;
            if (isNaN(volume2)) volume2 = 0;
          }
          UI.footer.volumeGaugeInner.style.transform = 'translate3d(' + volume1 + '%,0,0)';
          UI.footer.volumeGaugeInner2.style.transform = 'translate3d(' + volume2 + '%,0,0)';
          // UI.footer.volumeGaugeInner.style.width = (100 - volume1) + '%';
          // UI.footer.volumeGaugeInner2.style.width = (100 - volume2) + '%';
        }
      });
      var actions: UiRuntimeValue = d.createElement('div');
      actions.className = 'pk_ctns';
      var copy_btn: UiRuntimeValue = d.createElement('button');
      copy_btn.setAttribute('tabIndex', -1);
      copy_btn.className = 'pk_btn icon-files-empty pk_inact';
      copy_btn.innerHTML = '<span>Copy Selection (Shift + C)</span>';
      actions.appendChild(copy_btn);
      copy_btn.onclick = function (this: UiRuntimeValue) {
        UI.fireEvent('RequestActionCopy');
        this.blur();
      };
      UI.listenFor('DidSetClipboard', function (this: UiRuntimeValue, val?: UiRuntimeValue) {
        if (val) paste_btn.classList.remove('pk_inact');
        else paste_btn.classList.add('pk_inact');
      });
      var paste_btn: UiRuntimeValue = d.createElement('button');
      paste_btn.setAttribute('tabIndex', -1);
      paste_btn.className = 'pk_btn icon-file-text2 pk_inact';
      paste_btn.innerHTML = '<span>Paste Selection (Shift + V)</span>';
      actions.appendChild(paste_btn);
      paste_btn.onclick = function (this: UiRuntimeValue) {
        UI.fireEvent('RequestActionPaste');
        this.blur();
      };
      var cut_btn: UiRuntimeValue = d.createElement('button');
      cut_btn.setAttribute('tabIndex', -1);
      cut_btn.className = 'pk_btn icon-scissors pk_inact';
      cut_btn.innerHTML = '<span>Cut Selection (Shift + X)</span>';
      actions.appendChild(cut_btn);
      cut_btn.onclick = function (this: UiRuntimeValue) {
        UI.fireEvent('RequestActionCut', 1);
        this.blur();
      };
      UI.listenFor('DidSelectClip', function (this: UiRuntimeValue) {
        copy_btn.classList.remove('pk_inact');
        cut_btn.classList.remove('pk_inact');
        btn_clear_selection.classList.remove('pk_inact');
      });
      UI.listenFor('DidDeselectClip', function (this: UiRuntimeValue) {
        copy_btn.classList.add('pk_inact');
        cut_btn.classList.add('pk_inact');
      });
      var silence_btn: UiRuntimeValue = d.createElement('button');
      silence_btn.setAttribute('tabIndex', -1);
      silence_btn.className = 'pk_btn icon-silence';
      silence_btn.innerHTML = '<span>Insert Silence (Shift + N)</span>';
      actions.appendChild(silence_btn);
      UI.KeyHandler.addCallback(
        'KeyShiftN',
        function (
          this: UiRuntimeValue,
          k?: UiRuntimeValue,
          m?: UiRuntimeValue,
          e?: UiRuntimeValue,
        ) {
          if (UI.InteractionHandler.on || (e && (e.ctrlKey || e.metaKey))) return;
          silence_btn.click();
        },
        [16, 78],
      );
      silence_btn.onclick = function (this: UiRuntimeValue) {
        UI.fireEvent('RequestFXUI_Silence');
        this.blur();
      };
      var selection: UiRuntimeValue = d.createElement('div');
      selection.className = 'pk_selection';
      var selTitle: UiRuntimeValue = 'Selection:';
      var selStart: UiRuntimeValue = 'Start:';
      var selEnd: UiRuntimeValue = 'End:';
      var selDur: UiRuntimeValue = 'Duration:';
      selection.innerHTML =
        '<div class="pk_sellist">' +
        '<span class="pk_title">' +
        selTitle +
        '</span>' +
        '<div><span class="title">' +
        selStart +
        '</span><span class="s_s pk_dat">-</span></div>' +
        '<div><span class="title">' +
        selEnd +
        '</span><span class="s_e pk_dat">-</span></div>' +
        '<div><span  class="title">' +
        selDur +
        '</span><span class="s_d pk_dat">-</span></div>' +
        '</div>';
      var btn_clear_selection: UiRuntimeValue = d.createElement('button');
      btn_clear_selection.setAttribute('tabIndex', -1);
      btn_clear_selection.className = 'pk_btn icon-clearsel pk_inact';
      btn_clear_selection.setAttribute('data-label', 'Clear');
      var selClearText: UiRuntimeValue = 'Clear Selection (Q key)';
      btn_clear_selection.innerHTML = '<span>' + selClearText + '</span>';
      var sel_spans: UiRuntimeValue = selection.getElementsByClassName('pk_dat');
      var sb: UiRuntimeValue = null,
        sr: UiRuntimeValue = null,
        sd: UiRuntimeValue = 0;
      function closeSB(this: UiRuntimeValue) {
        if (!sb) return;
        d.removeEventListener('mousedown', sb._off);
        sb.parentNode && sb.parentNode.removeChild(sb);
        sb = null;
      }
      function openSB(this: UiRuntimeValue, e?: UiRuntimeValue) {
        var rg: UiRuntimeValue = sr,
          dur: UiRuntimeValue = sd || activeDurationFor(app);
        if (!rg || !(dur > 0)) return;
        e.stopPropagation();
        e.preventDefault();
        closeSB();
        var b: UiRuntimeValue = (sb = d.createElement('div'));
        b.className = 'pk_pgeq_freq';
        b.style.cssText = 'padding:6px 10px;width:auto;white-space:nowrap';
        b.innerHTML =
          '<b style=font-size:12px>Start</b> <input class="pk_mtbeat_bpm" style=width:62px> <b style=font-size:12px>End</b> <input class="pk_mtbeat_bpm" style=width:62px> <button class="pk_modal_a_bottom pk_modal_a_accpt" style="float:none;display:inline-block;vertical-align:middle">Go</button>';
        d.body.appendChild(b);
        var i: UiRuntimeValue = b.getElementsByTagName('input');
        var g: UiRuntimeValue = b.lastChild;
        var a: UiRuntimeValue = [i[0], i[1], g];
        i[0].value = rg.start.toFixed(3);
        i[1].value = rg.end.toFixed(3);
        var r: UiRuntimeValue = selection.getBoundingClientRect();
        b.style.left = (r.left | 0) + 'px';
        b.style.top = ((r.top + 3) | 0) + 'px';
        function go(this: UiRuntimeValue) {
          var rg: UiRuntimeValue = sr;
          var a: UiRuntimeValue = parseFloat(i[0].value),
            z: UiRuntimeValue = parseFloat(i[1].value);
          if (!rg) return closeSB();
          dur = sd || activeDurationFor(app) || dur;
          if (!(a >= 0)) a = rg.start;
          if (!(z >= 0)) z = rg.end;
          a = Math.max(0, Math.min(dur, a));
          z = Math.max(0, Math.min(dur, z));
          if (Math.abs(z - a) > 0.001) UI.fireEvent('RequestRegionSet', a, z);
          closeSB();
        }
        b._off = function (this: UiRuntimeValue, ev?: UiRuntimeValue) {
          if (!b.contains(ev.target) && !selection.contains(ev.target)) closeSB();
        };
        tnav(b, a, go, closeSB);
        g.onclick = go;
        d.addEventListener('mousedown', b._off);
        i[e.target === sel_spans[1] ? 1 : 0].focus();
      }
      sel_spans[0].onmousedown = sel_spans[1].onmousedown = sel_spans[2].onmousedown = openSB;
      UI.listenFor('DidCreateRegion', function (this: UiRuntimeValue, region?: UiRuntimeValue) {
        if (region && region.mt) {
          copy_btn.classList.add('pk_inact');
          cut_btn.classList.add('pk_inact');
        } else {
          copy_btn.classList.remove('pk_inact');
          cut_btn.classList.remove('pk_inact');
        }
        btn_clear_selection.classList.remove('pk_inact');
        if (region) {
          sr = region;
          sd = activeDurationFor(app) || region.end || 0;
          if (!sel_spans[0]) sel_spans = document.querySelectorAll('.pk_sellist .pk_dat');
          sel_spans[0].textContent = region.start.toFixed(3);
          sel_spans[1].textContent = region.end.toFixed(3);
          sel_spans[2].textContent = (region.end - region.start).toFixed(3);
        }
      });
      UI.listenFor('DidDestroyRegion', function (this: UiRuntimeValue) {
        copy_btn.classList.add('pk_inact');
        cut_btn.classList.add('pk_inact');
        btn_clear_selection.classList.add('pk_inact');
        closeSB();
        sr = null;
        sd = 0;
        if (!sel_spans[0]) sel_spans = document.querySelectorAll('.pk_sellist .pk_dat');
        sel_spans[0].textContent = '-';
        sel_spans[1].textContent = '-';
        sel_spans[2].textContent = '-';
      });
      btn_clear_selection.onclick = function (this: UiRuntimeValue) {
        UI.fireEvent('RequestRegionClear');
        this.blur();
      };
      selection.appendChild(btn_clear_selection);
      toolbar.appendChild(timing);
      UI.listenFor(
        'DidChanToggle',
        function (this: UiRuntimeValue, chan?: UiRuntimeValue, val?: UiRuntimeValue) {
          var region: UiRuntimeValue = PKAudioEditor.engine.wavesurfer.regions.list[0];
          if (!region) return;
          if (val === 1) {
            region.element.style.top = '0';
            region.element.style.height = '100%';
            return;
          }
          if (chan === 0) {
            region.element.style.top = '50%';
            region.element.style.height = '50%';
            return;
          }
          if (chan === 1) {
            region.element.style.top = '0';
            region.element.style.height = '50%';
          }
          //
        },
      );
      // end
      toolbar.appendChild(btn_groups);
      btn_groups.appendChild(transport);
      btn_groups.appendChild(actions);
      toolbar.appendChild(selection);
      container.appendChild(toolbar);
      UI.el.appendChild(container);
      _bindToolbarTips(UI, container);
      var _appEl: UiRuntimeValue = d.getElementById('app');
      _appEl.addEventListener(
        'dragover',
        function (this: UiRuntimeValue, e?: UiRuntimeValue) {
          var mt: UiRuntimeValue = PKAudioEditor && PKAudioEditor.multitrack;
          if (mt && mt.IsOn && mt.IsOn()) {
            e.preventDefault();
          }
        },
        true,
      );
      _appEl.addEventListener(
        'drop',
        function (this: UiRuntimeValue, e?: UiRuntimeValue) {
          var mt: UiRuntimeValue = PKAudioEditor && PKAudioEditor.multitrack;
          if (!mt || !mt.IsOn || !mt.IsOn()) return;
          var t: UiRuntimeValue = e.target;
          while (t && t !== _appEl) {
            if (
              t.classList &&
              (t.classList.contains('pk_mt_lane') || t.classList.contains('pk_mt_track'))
            )
              return;
            t = t.parentNode;
          }
          if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
          e.preventDefault();
          e.stopPropagation();
          mt.AddFilesAuto(e.dataTransfer.files);
        },
        true,
      );
      dragNDrop(
        _appEl,
        'pk_overlay',
        function (this: UiRuntimeValue, e?: UiRuntimeValue, name?: UiRuntimeValue) {
          var mt: UiRuntimeValue = PKAudioEditor && PKAudioEditor.multitrack;
          if (mt && mt.IsOn && mt.IsOn()) return;
          if (mt && mt.LoadSessionBuffer) {
            if (mt.LoadSessionBuffer(e, name)) return;
            if (/\.amss$/i.test(name || '')) {
              OneUp('Could not load session', 1400);
              return;
            }
          }
          PKAudioEditor.engine.LoadArrayBuffer(new Blob([e]));
        },
        'arrayBuffer',
      );
      // -
    }
    function _makeMobileScroll(this: UiRuntimeValue, UI?: UiRuntimeValue) {
      var isControlTouch: UiRuntimeValue = function (
        this: UiRuntimeValue,
        target?: UiRuntimeValue,
      ) {
        while (target && target !== d.body) {
          if (/^(BUTTON|A|INPUT|SELECT|TEXTAREA|LABEL)$/i.test(target.tagName || '')) return true;
          if (
            target.classList &&
            (target.classList.contains('pk_btn') ||
              target.classList.contains('pk_mt') ||
              target.classList.contains('pk_mt_topbtn') ||
              target.classList.contains('pk_modal_a_bottom'))
          )
            return true;
          target = target.parentNode;
        }
        return false;
      };
      var getFactor: UiRuntimeValue = function (this: UiRuntimeValue) {
        var screen_h: UiRuntimeValue = window.screen.height;
        var screen_w: UiRuntimeValue = window.screen.width;
        var iw: UiRuntimeValue = window.innerWidth;
        var ih: UiRuntimeValue = window.innerHeight;
        var bars_visible: UiRuntimeValue = false;
        var ratio: UiRuntimeValue = 0;
        if (window.orientation === 0) {
          ratio = ih / screen_h;
        } else if (window.orientation === 90 || window.orientation === -90) {
          ratio = ih / screen_w;
        }
        if (ratio < 0.8) bars_visible = true;
        return bars_visible;
      };
      var ex: UiRuntimeValue = -1;
      var ey: UiRuntimeValue = -1;
      var allow: UiRuntimeValue = false;
      // var first = false;
      d.body.addEventListener('touchstart', function (this: UiRuntimeValue, e?: UiRuntimeValue) {
        ex = e.touches[0].pageX;
        ey = e.touches[0].pageY;
        // first = true;
        allow = false;
      });
      d.body.addEventListener('touchend', function (this: UiRuntimeValue, e?: UiRuntimeValue) {
        ex = -1;
        ey = -1;
        // first = false;
        allow = false;
      });
      d.body.addEventListener(
        'touchmove',
        function (this: UiRuntimeValue, e?: UiRuntimeValue) {
          if (isControlTouch(e.target)) return;
          if (allow) return;
          var ny: UiRuntimeValue = e.touches[0].pageY;
          var nx: UiRuntimeValue = e.touches[0].pageX;
          var direction: UiRuntimeValue = ey - ny;
          var direction2: UiRuntimeValue = ex - nx;
          // if (first) {
          //	first = false;
          // }
          if (
            direction === 0 ||
            (Math.abs(direction) < 3 && Math.abs(direction2) > 3) ||
            (Math.abs(direction) < 6 && Math.abs(direction2) > 10)
          ) {
            ey = ny;
            ex = nx;
            allow = true;
            return;
          }
          ey = ny;
          ex = nx;
          var xx: UiRuntimeValue = document.getElementsByClassName('pk_modal_back');
          if (xx[0]) {
            xx = xx[0];
            if (xx.scrollHeight > window.innerHeight) {
              var scrolled: UiRuntimeValue = xx.scrollTop;
              if (direction > 0) {
                var modal_h: UiRuntimeValue =
                  document.getElementsByClassName('pk_modal')[0].clientHeight;
                if (modal_h - scrolled < window.innerHeight - 80) {
                  e.preventDefault();
                }
              } else {
                if (scrolled <= 0) {
                  e.preventDefault();
                }
              }
              allow = true;
              return;
            } else {
              e.preventDefault();
              allow = true;
              return;
            }
          }
          if (!getFactor()) {
            e.preventDefault();
            allow = true;
          }
        },
        { passive: false },
      );
    }
    // ---
    PKAE._deps.ui = PKUI;
  })(window, document, PKAudioEditor);
})();
