type FxAutoRuntimeValue = ReturnType<typeof JSON.parse>;

(() => {
  const runtimeGlobal: FxAutoRuntimeValue = globalThis;
  const window: FxAutoRuntimeValue = runtimeGlobal.window;
  const document: FxAutoRuntimeValue = runtimeGlobal.document;
  const PKAudioEditor: FxAutoRuntimeValue = runtimeGlobal.PKAudioEditor;
  const PKSimpleModal: FxAutoRuntimeValue =
    runtimeGlobal.window.AMLateRuntimeValue('PKSimpleModal');
  const PKAudioFXModal: FxAutoRuntimeValue =
    runtimeGlobal.window.AMLateRuntimeValue('PKAudioFXModal');
  const OneUp: FxAutoRuntimeValue = runtimeGlobal.OneUp;
  const WaveSurfer: FxAutoRuntimeValue = runtimeGlobal.WaveSurfer;
  const dragNDrop: FxAutoRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('dragNDrop');
  const ID3v2: FxAutoRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID3v2');
  const ID4: FxAutoRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID4');
  const wasm_denoise_stream_perf: FxAutoRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue(
    'wasm_denoise_stream_perf',
  );
  const app: FxAutoRuntimeValue = PKAudioEditor;
  (function (
    this: FxAutoRuntimeValue,
    w?: FxAutoRuntimeValue,
    d?: FxAutoRuntimeValue,
    PKAE?: FxAutoRuntimeValue,
  ) {
    'use strict';
    var _pid: FxAutoRuntimeValue = 0;
    var _aid: FxAutoRuntimeValue = 0;
    function FXAutomation(
      this: FxAutoRuntimeValue,
      app?: FxAutoRuntimeValue,
      filter_modal?: FxAutoRuntimeValue,
      val_cb?: FxAutoRuntimeValue,
      preview_cb?: FxAutoRuntimeValue,
    ) {
      var q: FxAutoRuntimeValue = this;
      q.modal = filter_modal;
      q.app = app;
      q.wv = app.engine.wavesurfer;
      var mt: FxAutoRuntimeValue = app.multitrack;
      var mt_buffer: FxAutoRuntimeValue =
        mt && mt.IsOn && mt.IsOn() && mt.GetFxBuffer ? mt.GetFxBuffer() : null;
      if (mt_buffer)
        q.wv = {
          backend: { buffer: mt_buffer },
          regions: { list: [] },
          getDuration: function (this: FxAutoRuntimeValue) {
            return mt_buffer.duration;
          },
        };
      q.points = {};
      q.act = null;
      q.act_point = null;
      q.in_auto = false;
      q.rbuff = null;
      q.waveDarken = filter_modal.waveDarken || 0;
      q.btn_auto = _make_btn_auto(q);
      q.GetValue = function (this: FxAutoRuntimeValue) {
        var data: FxAutoRuntimeValue = [];
        var inputs: FxAutoRuntimeValue = q.modal.el_body.getElementsByTagName('input');
        var plen: FxAutoRuntimeValue = q.points.length;
        for (var i: FxAutoRuntimeValue = 0; i < inputs.length; ++i) {
          var curr: FxAutoRuntimeValue = inputs[i];
          if (q.points[curr.id]) {
            var arr: FxAutoRuntimeValue = [];
            var p: FxAutoRuntimeValue = q.points[curr.id];
            for (var j: FxAutoRuntimeValue = 0; j < p.length; ++j) {
              var tmp: FxAutoRuntimeValue = {
                time: p[j].time,
                val: p[j].val,
              };
              arr.push(tmp);
              val_cb && val_cb(tmp, curr);
            }
            data.push(arr);
          } else {
            var tmp: FxAutoRuntimeValue = {
              val: curr.value,
            };
            data.push(tmp);
            val_cb && val_cb(tmp, curr);
          }
        }
        return data;
      };
      q.DelAct = function (this: FxAutoRuntimeValue, min?: FxAutoRuntimeValue) {
        var p: FxAutoRuntimeValue = q.act && q.points[q.act.id],
          i: FxAutoRuntimeValue = p && p.indexOf(q.act_point);
        if (!p || i < 0 || p.length <= min) return;
        p.splice(i, 1);
        q.act_point = p[Math.min(i, p.length - 1)];
        q.Render();
        return 1;
      };
      q.cw = 500;
      q.ch = 200;
      var els: FxAutoRuntimeValue = (_make_canvas as FxAutoRuntimeValue)(q, q.cw, q.ch);
      q.canvas = els[0];
      q.ctx = els[1];
      var _fillstyle: FxAutoRuntimeValue = '#d9d955';
      q.Render = function (this: FxAutoRuntimeValue) {
        var ctx: FxAutoRuntimeValue = q.ctx;
        var cw: FxAutoRuntimeValue = q.cw;
        var ch: FxAutoRuntimeValue = q.ch;
        if (q.rbuff) {
          q.app.engine.GetWave(q.rbuff, 500, 200, null, null, q.canvas, q.ctx);
          if (q.waveDarken) {
            ctx.fillStyle = 'rgba(0,0,0,' + q.waveDarken + ')';
            ctx.fillRect(0, 0, cw, ch);
          }
        }
        // ctx.clearRect (0, 0, q.cw, q.ch);
        ctx.fillStyle = _fillstyle;
        ctx.strokeStyle = '#FF0000';
        if (!q.act) return;
        ctx.beginPath();
        ctx.moveTo(0, ch / 2);
        var last_y: FxAutoRuntimeValue = ch / 2;
        for (var o: FxAutoRuntimeValue = 0; o < q.points[q.act.id].length; ++o) {
          var curr: FxAutoRuntimeValue = q.points[q.act.id][o];
          var center_x: FxAutoRuntimeValue = curr.ax;
          var center_y: FxAutoRuntimeValue = curr.ay;
          ctx.lineTo(center_x, center_y);
          last_y = center_y;
        }
        ctx.lineTo(cw, last_y);
        ctx.stroke();
        var radius: FxAutoRuntimeValue = 6;
        for (var o: FxAutoRuntimeValue = 0; o < q.points[q.act.id].length; ++o) {
          var curr: FxAutoRuntimeValue = q.points[q.act.id][o];
          var center_x: FxAutoRuntimeValue = curr.ax;
          var center_y: FxAutoRuntimeValue = curr.ay;
          ctx.beginPath();
          ctx.arc(center_x, center_y, radius, 0, 2 * Math.PI, false);
          if (curr === q.act_point) {
            ctx.shadowBlur = 24;
            if (curr._on) ctx.fillStyle = '#fff';
            else ctx.fillStyle = '#686868';
            ctx.stroke();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = _fillstyle;
          } else if (curr._hov) {
            if (curr._on) ctx.fillStyle = 'blue';
            else ctx.fillStyle = 'darkblue';
            ctx.stroke();
            ctx.fill();
            ctx.fillStyle = _fillstyle;
          } else if (curr._on) {
            ctx.fill();
          } else {
            ctx.fillStyle = '#555';
            ctx.fill();
            ctx.fillStyle = _fillstyle;
          }
        }
      };
      _make_controls(q);
      // -------
      function _make_controls(this: FxAutoRuntimeValue, q?: FxAutoRuntimeValue) {
        var click_time: FxAutoRuntimeValue = 0,
          seek_t: FxAutoRuntimeValue = 0,
          no_seek: FxAutoRuntimeValue = 0;
        q.canvas.addEventListener(
          'click',
          function (this: FxAutoRuntimeValue, e?: FxAutoRuntimeValue) {
            if (!q.act) return;
            var h: FxAutoRuntimeValue = q.app.engine.FXPreviewHost;
            if (seek_t) {
              clearTimeout(seek_t);
              seek_t = 0;
            }
            if (e.timeStamp - click_time < 260) {
              var bounds: FxAutoRuntimeValue = q.canvas.getBoundingClientRect();
              var cw: FxAutoRuntimeValue = q.cw;
              var ch: FxAutoRuntimeValue = q.ch;
              var posx: FxAutoRuntimeValue = e.clientX - bounds.left;
              var posy: FxAutoRuntimeValue = e.clientY - bounds.top;
              var rel_x: FxAutoRuntimeValue = posx / cw;
              var rel_y: FxAutoRuntimeValue = posy / ch;
              if (!q.points[q.act.id]) q.points[q.act.id] = [];
              var duration: FxAutoRuntimeValue;
              var region: FxAutoRuntimeValue = q.wv.regions.list[0];
              if (region) {
                duration = region.end - region.start;
              } else {
                duration = q.wv.getDuration();
              }
              q.points[q.act.id].push({
                // el:q.act.el,
                id: ++_pid,
                x: rel_x,
                y: rel_y,
                ax: rel_x * cw,
                ay: rel_y * ch,
                time: duration * rel_x,
                val: (1 - rel_y) * (q.act.max - q.act.min) + q.act.min,
                _on: true,
                _hov: false,
              });
              q.points[q.act.id].sort(_compare);
              q.act_point = q.points[q.act.id][q.points[q.act.id].length - 1];
              //_process ( q, q.wv.backend.buffer );
              q.Render();
              // ----
            } else if (!no_seek && preview_cb && h && (h.previewing || h.MTPreviewing)) {
              var bounds: FxAutoRuntimeValue = q.canvas.getBoundingClientRect();
              var sx: FxAutoRuntimeValue = Math.max(
                0,
                Math.min(1, (e.clientX - bounds.left) / bounds.width),
              );
              seek_t = setTimeout(function (this: FxAutoRuntimeValue) {
                seek_t = 0;
                preview_cb(sx);
              }, 260);
            }
            no_seek = 0;
            click_time = e.timeStamp;
          },
          false,
        );
        var is_dragging: FxAutoRuntimeValue = false;
        var skip: FxAutoRuntimeValue = 3;
        q.canvas.addEventListener(
          'mousemove',
          function (this: FxAutoRuntimeValue, e?: FxAutoRuntimeValue) {
            if (!is_dragging || !q.act_point) return;
            var ex: FxAutoRuntimeValue = 0;
            var ey: FxAutoRuntimeValue = 0;
            if (e.touches) {
              if (e.touches.length > 1) {
                return;
              }
              ex = e.touches[0].clientX;
              ey = e.touches[0].clientY;
            } else {
              ex = e.clientX;
              ey = e.clientY;
            }
            var bounds: FxAutoRuntimeValue = q.canvas.getBoundingClientRect();
            var cw: FxAutoRuntimeValue = q.cw;
            var ch: FxAutoRuntimeValue = q.ch;
            var posx: FxAutoRuntimeValue = ex - bounds.left;
            var posy: FxAutoRuntimeValue = ey - bounds.top;
            var rel_x: FxAutoRuntimeValue = posx / cw;
            var rel_y: FxAutoRuntimeValue = posy / ch;
            q.act_point.ax = posx;
            q.act_point.ay = posy;
            q.act_point.x = rel_x;
            q.act_point.y = rel_y;
            var duration: FxAutoRuntimeValue;
            var region: FxAutoRuntimeValue = q.wv.regions.list[0];
            if (region) {
              duration = region.end - region.start;
            } else {
              duration = q.wv.getDuration();
            }
            q.act_point.time = duration * rel_x;
            q.act_point.val = (1 - rel_y) * (q.act.max - q.act.min) + q.act.min;
            no_seek = 1;
            q.Render();
            if (--skip === 0) {
              skip = 4;
              _process(q, q.wv.backend.buffer);
            }
          },
        );
        q.canvas.addEventListener(
          'mousedown',
          function (this: FxAutoRuntimeValue, e?: FxAutoRuntimeValue) {
            is_dragging = false;
            if (!q.act) return;
            var bounds: FxAutoRuntimeValue = q.canvas.getBoundingClientRect();
            var cw: FxAutoRuntimeValue = q.cw;
            var ch: FxAutoRuntimeValue = q.ch;
            var posx: FxAutoRuntimeValue = e.clientX - bounds.left;
            var posy: FxAutoRuntimeValue = e.clientY - bounds.top;
            var dist_x: FxAutoRuntimeValue = e.is_touch ? 20 : 10;
            var dist_y: FxAutoRuntimeValue = e.is_touch ? 20 : 9;
            if (!q.points[q.act.id]) q.points[q.act.id] = [];
            for (var o: FxAutoRuntimeValue = 0; o < q.points[q.act.id].length; ++o) {
              var curr: FxAutoRuntimeValue = q.points[q.act.id][o];
              if (Math.abs(curr.ax - posx) < dist_x && Math.abs(curr.ay - posy) < dist_y) {
                is_dragging = true;
                no_seek = 1;
                q.act_point = curr;
                q.Render();
                break;
              }
            }
            if (!is_dragging) {
              q.act_point = null;
              q.Render();
            }
          },
        );
        q.canvas.addEventListener(
          'mouseup',
          function (this: FxAutoRuntimeValue, e?: FxAutoRuntimeValue) {
            is_dragging = false;
          },
        );
        var act_el: FxAutoRuntimeValue = null;
        q.modal.el_body.addEventListener(
          'mouseover',
          function (this: FxAutoRuntimeValue, e?: FxAutoRuntimeValue) {
            if (!q.in_auto) return;
            if (e.target.tagName === 'INPUT') {
              e.target.classList.add('pk_aut');
            }
          },
        );
        q.modal.el_body.addEventListener(
          'mouseout',
          function (this: FxAutoRuntimeValue, e?: FxAutoRuntimeValue) {
            if (!q.in_auto) return;
            if (e.target.tagName === 'INPUT') {
              e.target.classList.remove('pk_aut');
            }
          },
        );
        q.modal.el_body.addEventListener(
          'click',
          function (this: FxAutoRuntimeValue, e?: FxAutoRuntimeValue) {
            if (!q.in_auto) return;
            if (e.target.classList.contains('pk_aut')) {
              if (act_el) {
                act_el.classList.remove('pk_aut_act');
                act_el = null;
              }
              e.target.classList.add('pk_aut_act');
              act_el = e.target;
              if (!e.target.id) e.target.id = 'pk' + ++_aid;
              q.act = {
                id: e.target.id,
                el: e.target,
                type: e.target.range,
                min: e.target.min / 1,
                max: e.target.max / 1,
                step: e.target.step / 1,
              };
              if (!q.points[q.act.id]) q.points[q.act.id] = [];
              q.Render();
            }
            // console.log( 'click ', e.target );
          },
        );
      }
      function _make_btn_auto(this: FxAutoRuntimeValue, q?: FxAutoRuntimeValue) {
        var btn_automate: FxAutoRuntimeValue = d.createElement('a');
        btn_automate.className = 'pk_modal_a_bottom';
        btn_automate.innerHTML = 'AUTOMATE';
        var in_auto: FxAutoRuntimeValue = false;
        btn_automate.onclick = function (this: FxAutoRuntimeValue) {
          q.in_auto = !q.in_auto;
          if (q.in_auto) {
            btn_automate.classList.add('pk_act');
          } else {
            btn_automate.classList.remove('pk_act');
          }
        };
        q.modal.el_body.appendChild(btn_automate);
        return btn_automate;
      }
      function _make_canvas(this: FxAutoRuntimeValue, q?: FxAutoRuntimeValue) {
        var cc: FxAutoRuntimeValue = document.createElement('canvas');
        cc.width = 500;
        cc.height = 200;
        cc.style.background = '#000';
        var ctx: FxAutoRuntimeValue = cc.getContext('2d');
        q.modal.el_body.appendChild(cc);
        var buff: FxAutoRuntimeValue = q.wv.backend.buffer;
        if (!buff) return [cc, ctx];
        var img: FxAutoRuntimeValue = new Image();
        img.onload = function (this: FxAutoRuntimeValue) {
          ctx.drawImage(img, 0, 0);
          if (q.waveDarken) {
            ctx.fillStyle = 'rgba(0,0,0,' + q.waveDarken + ')';
            ctx.fillRect(0, 0, q.cw, q.ch);
          }
          if (q.act) q.Render();
        };
        var offset: FxAutoRuntimeValue;
        var length: FxAutoRuntimeValue;
        var region: FxAutoRuntimeValue = q.wv.regions.list[0];
        if (region) {
          offset = (region.start * buff.sampleRate) >> 0;
          length = (region.end * buff.sampleRate) >> 0;
        }
        _process(q, buff);
        img.src = q.app.engine.GetWave(buff, 500, 200, offset, length);
        return [cc, ctx];
      }
      function _compare(this: FxAutoRuntimeValue, a?: FxAutoRuntimeValue, b?: FxAutoRuntimeValue) {
        if (a.x > b.x) return 1;
        return -1;
      }
      function _process(
        this: FxAutoRuntimeValue,
        q?: FxAutoRuntimeValue,
        buffer?: FxAutoRuntimeValue,
      ) {
        if (!buffer) return;
        var getOfflineAudioContext: FxAutoRuntimeValue = function (
          this: FxAutoRuntimeValue,
          channels?: FxAutoRuntimeValue,
          sampleRate?: FxAutoRuntimeValue,
          duration?: FxAutoRuntimeValue,
        ) {
          return new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
            channels,
            duration,
            sampleRate,
          );
        };
        var region: FxAutoRuntimeValue = q.wv.regions.list[0];
        var offs: FxAutoRuntimeValue = 0;
        var durr: FxAutoRuntimeValue = buffer.duration;
        if (region) {
          offs = region.start;
          durr = region.end - region.start;
        }
        var rate: FxAutoRuntimeValue = buffer.sampleRate;
        var from: FxAutoRuntimeValue = Math.min(buffer.length, Math.max(0, (offs * rate) >> 0));
        var to: FxAutoRuntimeValue = Math.min(buffer.length, ((offs + durr) * rate) >> 0);
        var len: FxAutoRuntimeValue = Math.max(1, to - from);
        durr = len / rate;
        var audio_ctx: FxAutoRuntimeValue = getOfflineAudioContext(
          1, // orig_buffer.numberOfChannels,
          8000,
          Math.max(1, (durr * 8000) >> 0),
        );
        var newbuffer: FxAutoRuntimeValue = audio_ctx.createBuffer(1, len, rate);
        newbuffer.getChannelData(0).set(buffer.getChannelData(0).subarray(from, to));
        var source: FxAutoRuntimeValue = audio_ctx.createBufferSource();
        source.buffer = newbuffer;
        //var fx = q.app.engine.GetFX ('Gain', q.GetValue ());
        //console.log ( fx.filter ( audio_ctx, audio_ctx.destination, source ) );
        source.connect(audio_ctx.destination);
        source.start(0); //, offs, durr);
        var offline_callback: FxAutoRuntimeValue = function (
          this: FxAutoRuntimeValue,
          rendered_buffer?: FxAutoRuntimeValue,
        ) {
          q.rbuff = rendered_buffer;
          // var img = new Image();
          // img.src = q.app.engine.GetWave (rendered_buffer, 500, 200);
          q.Render();
        };
        var offline_renderer: FxAutoRuntimeValue = audio_ctx.startRendering();
        if (offline_renderer)
          offline_renderer.then(offline_callback).catch(function (this: FxAutoRuntimeValue) {});
        else
          audio_ctx.oncomplete = function (this: FxAutoRuntimeValue, e?: FxAutoRuntimeValue) {
            offline_callback(e.renderedBuffer);
          };
        // ---------
      }
    }
    PKAudioEditor._deps.FxAUT = FXAutomation;
  })(window, document, PKAudioEditor);
})();
