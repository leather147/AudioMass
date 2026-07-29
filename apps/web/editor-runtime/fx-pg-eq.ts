type FxPgEqRuntimeValue = ReturnType<typeof JSON.parse>;

(() => {
  const runtimeGlobal: FxPgEqRuntimeValue = globalThis;
  const window: FxPgEqRuntimeValue = runtimeGlobal.window;
  const document: FxPgEqRuntimeValue = runtimeGlobal.document;
  const PKAudioEditor: FxPgEqRuntimeValue = runtimeGlobal.PKAudioEditor;
  const PKSimpleModal: FxPgEqRuntimeValue =
    runtimeGlobal.window.AMLateRuntimeValue('PKSimpleModal');
  const PKAudioFXModal: FxPgEqRuntimeValue =
    runtimeGlobal.window.AMLateRuntimeValue('PKAudioFXModal');
  const OneUp: FxPgEqRuntimeValue = runtimeGlobal.OneUp;
  const WaveSurfer: FxPgEqRuntimeValue = runtimeGlobal.WaveSurfer;
  const dragNDrop: FxPgEqRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('dragNDrop');
  const ID3v2: FxPgEqRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID3v2');
  const ID4: FxPgEqRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID4');
  const wasm_denoise_stream_perf: FxPgEqRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue(
    'wasm_denoise_stream_perf',
  );
  const app: FxPgEqRuntimeValue = PKAudioEditor;
  (function (
    this: FxPgEqRuntimeValue,
    w?: FxPgEqRuntimeValue,
    d?: FxPgEqRuntimeValue,
    PKAE?: FxPgEqRuntimeValue,
  ) {
    'use strict';
    var modal_name: FxPgEqRuntimeValue = 'modalfx';
    var modal_esc_key: FxPgEqRuntimeValue = modal_name + 'esc';
    var max_db_val: FxPgEqRuntimeValue = 35;
    function PK_FX_PGEQ(this: FxPgEqRuntimeValue) {
      var q: FxPgEqRuntimeValue = this;
      var _id: FxPgEqRuntimeValue = 0;
      var _is_render_scheduled: FxPgEqRuntimeValue = false;
      var _is_render_scheduled2: FxPgEqRuntimeValue = false;
      var _render_raf: FxPgEqRuntimeValue = 0;
      var _bars_raf: FxPgEqRuntimeValue = 0;
      q.act = null;
      q.ranges = [];
      q.ui = {};
      this.Callback = function (this: FxPgEqRuntimeValue) {};
      this.Init = function (this: FxPgEqRuntimeValue, container?: FxPgEqRuntimeValue) {
        var q: FxPgEqRuntimeValue = this;
        q.el = container;
        _make_ui(q);
        _make_evs(q);
        q.Render();
      };
      this.Add = function (
        this: FxPgEqRuntimeValue,
        type?: FxPgEqRuntimeValue,
        is_on?: FxPgEqRuntimeValue,
        freq?: FxPgEqRuntimeValue,
        gain?: FxPgEqRuntimeValue,
        qval?: FxPgEqRuntimeValue,
        coords_x?: FxPgEqRuntimeValue,
        coords_y?: FxPgEqRuntimeValue,
      ) {
        var q: FxPgEqRuntimeValue = this;
        var new_range: FxPgEqRuntimeValue = {
          id: ++_id,
          type: type ? type : 'peaking',
          freq: freq || 0,
          gain: gain || 0,
          q: qval || 5,
          // interface
          _on: is_on,
          _hov: false,
          _el: null,
          _coords: {
            x: coords_x || 0,
            y: coords_y || 0,
          },
          _arr: [],
        };
        q.ranges.push(new_range);
        q.ranges.sort(_compare);
        if (q.act) {
          q.act.el.classList.remove('pk_act');
        }
        q.act = new_range;
        _range_compute_arr(new_range);
        new_range.el = _range_render_el(q, new_range, ' pk_act');
        q.Callback && q.Callback();
        q.Render();
      };
      this.Remove = function (this: FxPgEqRuntimeValue, range?: FxPgEqRuntimeValue) {
        var q: FxPgEqRuntimeValue = this;
        var l: FxPgEqRuntimeValue = q.ranges.length;
        while (l-- > 0) {
          if (q.ranges[l] === range) {
            q.ranges.splice(l, 1);
            break;
          }
        }
        if (range.el) {
          range.el.parentNode.removeChild(range.el);
          range.el = null;
        }
        if (q.act && q.act === range) {
          q.act = null;
        }
        q.Render();
      };
      var _fillstyle: FxPgEqRuntimeValue = '#d9d955';
      var _anim_render: FxPgEqRuntimeValue = function (this: FxPgEqRuntimeValue) {
        _render_raf = 0;
        _render(q);
      };
      this.Render = function (this: FxPgEqRuntimeValue) {
        var q: FxPgEqRuntimeValue = this;
        if (_is_render_scheduled) return;
        _is_render_scheduled = true;
        _render_raf = requestAnimationFrame(_anim_render);
      };
      this.RenderBars = function (
        this: FxPgEqRuntimeValue,
        _?: FxPgEqRuntimeValue,
        freq?: FxPgEqRuntimeValue,
      ) {
        var q: FxPgEqRuntimeValue = this;
        if (_is_render_scheduled2) return;
        _is_render_scheduled2 = true;
        _bars_raf = requestAnimationFrame(function (this: FxPgEqRuntimeValue) {
          _bars_raf = 0;
          _render_bars(q, freq);
        });
      };
      this.Destroy = function (this: FxPgEqRuntimeValue) {
        if (_render_raf) {
          cancelAnimationFrame(_render_raf);
          _render_raf = 0;
          _is_render_scheduled = false;
        }
        if (_bars_raf) {
          cancelAnimationFrame(_bars_raf);
          _bars_raf = 0;
          _is_render_scheduled2 = false;
        }
      };
      var _render_bars: FxPgEqRuntimeValue = function (
        this: FxPgEqRuntimeValue,
        q?: FxPgEqRuntimeValue,
        freq?: FxPgEqRuntimeValue,
      ) {
        _is_render_scheduled2 = false;
        if (!freq) return;
        var ctx: FxPgEqRuntimeValue = q.ui.ctx_bars;
        var canvas: FxPgEqRuntimeValue = q.ui.canvas_bars;
        var cw: FxPgEqRuntimeValue = canvas.width;
        var ch: FxPgEqRuntimeValue = canvas.height;
        // ctx.fillStyle = '#000';
        // ctx.fillRect (0, 0, cw, ch);
        ctx.clearRect(0, 0, cw, ch);
        var bufferLength: FxPgEqRuntimeValue = 512; // 256
        var max_bars: FxPgEqRuntimeValue = 117 * 2;
        var barWidth: FxPgEqRuntimeValue = Number((cw / max_bars).toFixed(1));
        var barHeight: FxPgEqRuntimeValue = 0;
        var x: FxPgEqRuntimeValue = 0;
        //
        for (var i: FxPgEqRuntimeValue = 0; i < 117; ++i) {
          barHeight = freq[i];
          // map.push ( i * 43 );
          var newheight: FxPgEqRuntimeValue = ((barHeight / 256) * ch) >> 0;
          ctx.fillRect(x, ch - newheight, barWidth, newheight);
          x += barWidth; // + 1;
        }
        for (var i: FxPgEqRuntimeValue = 0; i < 117; ++i) {
          // (116*3.4)
          barHeight = freq[117 + ((i * 3.34) >> 0)];
          // map.push ( (120 + (i * 3)) * 43 );
          var newheight: FxPgEqRuntimeValue = ((barHeight / 256) * ch) >> 0;
          ctx.fillRect(x, ch - newheight, barWidth, newheight);
          x += barWidth; // + 1;
        }
        //			console.log( map );
        // what if we care for the small bars first
        /*
                        var steps = (total_freq/bufferLength) >> 0;

                        // we care for

                        // 256 bars

                        // 32
                        // 64
                        // 125
                        // 250
                        // 500
                        // 1000
                        // 2000
                        // 4000
                        // 8000
                        // 16000
                        // 20000
                        var arr = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000, 20000];
                        var curr = 0;
                        var curr_bars = 0;
                        var bars_per_entry = (bufferLength / 10) >> 0;

                        for (var i = 0; i < bufferLength; ++i) {

                            if (++curr_bars < bars_per_entry)
                            {

                                var ff = arr[ curr ];
                                var ff_next = arr[ curr + 1];

                                var m = 0;
                                for (; m < bufferLength; ++m)
                                {
                                    if (m * steps > ff) {
                                        --m;
                                        break;
                                    }
                                }

                                barHeight = freq[ m ];

                                var newheight = ((barHeight / 256) * ch) >> 0;
                                ctx.fillRect (x, ch - newheight, barWidth, newheight);
                                x += barWidth;// + 1;
                            }
                            else
                            {
                                ++curr;
                                curr_bars = 0;
                            }
                        }
            */
        //			for (var i = 0; i < bufferLength; ++i) {
        //				barHeight = freq[i];
        //				var newheight = ((barHeight / 256) * ch) >> 0;
        //				ctx.fillRect (x, ch - newheight, barWidth, newheight);
        //				x += barWidth;// + 1;
        //			}
      };
      var line_arr: FxPgEqRuntimeValue = new Array(1000);
      var _render: FxPgEqRuntimeValue = function (
        this: FxPgEqRuntimeValue,
        q?: FxPgEqRuntimeValue,
      ) {
        _is_render_scheduled = false;
        var ctx: FxPgEqRuntimeValue = q.ui.ctx_eq;
        var canvas: FxPgEqRuntimeValue = q.ui.canvas_eq;
        var cw: FxPgEqRuntimeValue = canvas.width;
        var ch: FxPgEqRuntimeValue = canvas.height;
        var ch_half: FxPgEqRuntimeValue = ch / 2;
        // --------------------
        ctx.clearRect(0, 0, cw, ch);
        ctx.fillStyle = _fillstyle;
        if (q.ranges.length === 0) {
          ctx.beginPath();
          ctx.moveTo(0, ch_half);
          ctx.lineTo(cw, ch_half);
          ctx.stroke();
          return;
        }
        // render the line based on the elements
        var first: FxPgEqRuntimeValue = true;
        var arr: FxPgEqRuntimeValue = [];
        for (var i: FxPgEqRuntimeValue = 0; i < total; ++i) {
          arr[i] = 0;
        }
        for (var o: FxPgEqRuntimeValue = 0; o < q.ranges.length; ++o) {
          var curr: FxPgEqRuntimeValue = q.ranges[o];
          if (!curr._on) continue;
          if (first) {
            first = false;
            for (var i: FxPgEqRuntimeValue = 0; i < total; ++i) {
              line_arr[i] = curr._arr[i];
            }
          } else {
            for (var i: FxPgEqRuntimeValue = 0; i < total; ++i) {
              line_arr[i] += curr._arr[i];
            }
          }
          // ---
        }
        if (first) {
          ctx.beginPath();
          ctx.moveTo(0, ch_half);
          ctx.lineTo(cw, ch_half);
          ctx.stroke();
        } else {
          // --
          ctx.beginPath();
          ctx.moveTo(0, ch_half - line_arr[0] * (ch_half / max_db_val));
          for (var i: FxPgEqRuntimeValue = 0; i < total / 4; i += 1) {
            var el: FxPgEqRuntimeValue = line_arr[i];
            var x: FxPgEqRuntimeValue = i * 2 * (cw / total);
            var y: FxPgEqRuntimeValue = ch_half - el * (ch_half / max_db_val);
            ctx.lineTo(x, y);
          }
          var hh: FxPgEqRuntimeValue = 0;
          for (var i: FxPgEqRuntimeValue = total / 4; i < total; i += 3) {
            var el: FxPgEqRuntimeValue = line_arr[i];
            hh += 2;
            var x: FxPgEqRuntimeValue = (total / 2 + hh) * (cw / total);
            var y: FxPgEqRuntimeValue = ch_half - el * (ch_half / max_db_val);
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        // ---
        // draw the dots
        var radius: FxPgEqRuntimeValue = 6;
        for (var o: FxPgEqRuntimeValue = 0; o < q.ranges.length; ++o) {
          var curr: FxPgEqRuntimeValue = q.ranges[o];
          var center_x: FxPgEqRuntimeValue = curr._coords.x;
          var center_y: FxPgEqRuntimeValue = curr._coords.y;
          ctx.beginPath();
          ctx.arc(center_x, center_y, radius, 0, 2 * Math.PI, false);
          if (curr === q.act) {
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
        // ---
      };
      ////////////////////////////////////////////
      // helpers
      var _dbncr: FxPgEqRuntimeValue = null;
      var total_freq: FxPgEqRuntimeValue = 20000; // 22000
      var total: FxPgEqRuntimeValue = 1000;
      var jump: FxPgEqRuntimeValue = (total_freq / total) >> 0;
      function _range_update(
        this: FxPgEqRuntimeValue,
        q?: FxPgEqRuntimeValue,
        range?: FxPgEqRuntimeValue,
        new_range?: FxPgEqRuntimeValue,
        compute_coords?: FxPgEqRuntimeValue,
      ) {
        var modified: FxPgEqRuntimeValue = false;
        var old_val: FxPgEqRuntimeValue = null;
        for (var key in new_range) {
          if (range[key] !== new_range[key]) {
            modified = true;
            old_val = range[key];
            range[key] = new_range[key];
            if (key === '_on') {
              var el: FxPgEqRuntimeValue = document.getElementById('pgon' + range.id);
              el.checked = range[key];
            } else if (key === 'freq') {
              var el: FxPgEqRuntimeValue = range.el.getElementsByClassName('pk_freq')[0];
              //requestAnimationFrame (function () {
              el.value = range[key];
              //});
            } else if (key === 'gain') {
              var el: FxPgEqRuntimeValue = range.el.getElementsByClassName('pk_gain')[0];
              //requestAnimationFrame (function () {
              el.value = range[key];
              //});
            } else if (key === 'q') {
              var el: FxPgEqRuntimeValue = range.el.getElementsByClassName('pk_q')[0];
              //requestAnimationFrame (function () {
              el.value = range[key];
              //});
            } else if (key === 'type') {
              // -----
              var el: FxPgEqRuntimeValue = range.el.getElementsByTagName('select')[0];
              if (range[key] === 'peaking') el.options[0].selected = true;
              else if (range[key] === 'lowpass') el.options[1].selected = true;
              else if (range[key] === 'highpass') el.options[2].selected = true;
              _range_compute_arr(range);
              q.ranges.sort(_compare);
            }
            // ---
          }
        }
        if (modified) {
          if (compute_coords) {
            // compute coords of the canvas
            var canvas: FxPgEqRuntimeValue = q.ui.canvas_eq;
            var cw: FxPgEqRuntimeValue = canvas.width;
            var ch: FxPgEqRuntimeValue = canvas.height;
            var tmp_x: FxPgEqRuntimeValue = 0;
            if (range.freq <= 5000) {
              range._coords.x = Number(((range.freq / 5000) * (cw / 2)).toFixed(1));
            } else {
              range._coords.x = Number(
                (cw / 2 + ((range.freq - 5000) / 15000) * (cw / 2)).toFixed(1),
              );
            }
            // range._coords.x = ((range.freq / total_freq) * cw).toFixed(1)/1;
            if (range.type === 'peaking')
              range._coords.y = Number(
                ((1.0 - (range.gain + max_db_val) / (max_db_val * 2)) * ch).toFixed(1),
              );
            else range._coords.y = Number((ch / 2).toFixed(1));
          }
          if (_dbncr) {
            clearTimeout(_dbncr);
          }
          _dbncr = setTimeout(function (this: FxPgEqRuntimeValue) {
            q.Callback();
            _dbncr = null;
          }, 38);
          q.Render();
        }
        // ---
      }
      function _ease(this: FxPgEqRuntimeValue, t?: FxPgEqRuntimeValue) {
        return t * t * t * t * t;
      }
      function _ease_out(this: FxPgEqRuntimeValue, t?: FxPgEqRuntimeValue) {
        return t * t * t * t;
      }
      function _range_compute_arr(this: FxPgEqRuntimeValue, range?: FxPgEqRuntimeValue) {
        var arr: FxPgEqRuntimeValue = [];
        for (var i: FxPgEqRuntimeValue = 0; i < total; ++i) {
          arr[i] = 0;
        }
        range._arr = arr;
        // -------------
        var rounding: FxPgEqRuntimeValue = total_freq * (2 / range.q);
        var half_rounding: FxPgEqRuntimeValue = (rounding / jump) >> 0;
        if (range.type === 'peaking') {
          var edge_left: FxPgEqRuntimeValue = range.freq - rounding / 2;
          var edge_right: FxPgEqRuntimeValue = range.freq + rounding / 2;
          var start: FxPgEqRuntimeValue = (edge_left / jump) >> 0;
          var end: FxPgEqRuntimeValue = (edge_right / jump) >> 0;
          var j: FxPgEqRuntimeValue = 0;
          for (var i: FxPgEqRuntimeValue = start; i < end; ++i) {
            var ii: FxPgEqRuntimeValue = i * jump;
            if (ii < range.freq) {
              ++j;
              arr[i] += _ease(j / (half_rounding / 2)) * range.gain;
            } else {
              --j;
              arr[i] += _ease(j / (half_rounding / 2)) * range.gain;
            }
          }
          return;
        }
        if (range.type === 'highpass') {
          var edge_left: FxPgEqRuntimeValue = range.freq - rounding;
          var start: FxPgEqRuntimeValue = (edge_left / jump) >> 0;
          var end: FxPgEqRuntimeValue = (range.freq / jump) >> 0;
          for (var i: FxPgEqRuntimeValue = 0; i < start; ++i) {
            arr[i] = -max_db_val;
          }
          // todo improve this!!!
          var j: FxPgEqRuntimeValue = half_rounding;
          for (var i: FxPgEqRuntimeValue = start; i < end; ++i) {
            --j;
            arr[i] -= _ease_out(j / half_rounding) * max_db_val;
          }
          return;
        }
        if (range.type === 'lowpass') {
          var edge_right: FxPgEqRuntimeValue = range.freq + rounding;
          var start: FxPgEqRuntimeValue = (range.freq / jump) >> 0;
          var end: FxPgEqRuntimeValue = (edge_right / jump) >> 0;
          for (var i: FxPgEqRuntimeValue = end; i < total; ++i) {
            arr[i] = -max_db_val;
          }
          // todo improve this!!!
          var j: FxPgEqRuntimeValue = 0;
          for (var i: FxPgEqRuntimeValue = start; i < end; ++i) {
            ++j;
            arr[i] -= _ease_out(j / half_rounding) * max_db_val;
          }
          return;
        }
        // -------------
      }
      function _make_ui(this: FxPgEqRuntimeValue, q?: FxPgEqRuntimeValue) {
        var el_drawer: FxPgEqRuntimeValue = d.createElement('div');
        el_drawer.className = 'pk_row';
        var canvas_bars: FxPgEqRuntimeValue = d.createElement('canvas');
        var canvas_eq: FxPgEqRuntimeValue = d.createElement('canvas');
        canvas_bars.className = 'pk_peq2';
        canvas_eq.className = 'pk_peq';
        canvas_bars.width = 450 / 2;
        canvas_bars.height = 224 / 2;
        canvas_eq.width = 450;
        canvas_eq.height = 225;
        var ctx_bars: FxPgEqRuntimeValue = canvas_bars.getContext('2d', {
          alpha: true,
          antialias: false,
        });
        var ctx_eq: FxPgEqRuntimeValue = canvas_eq.getContext('2d', {
          alpha: true,
          antialias: false,
        });
        ctx_bars.fillStyle = '#365457'; // '#486a6e';
        // ctx_eq.lineWidth = 2;
        ctx_eq.strokeStyle = '#FF0000';
        ctx_eq.shadowColor = '#FF2222';
        ctx_eq.shadowBlur = 0;
        // render the decibel and the frequencies
        var marker_freqs: FxPgEqRuntimeValue = d.createElement('div');
        marker_freqs.className = 'pk_peq3 pk_noselect';
        marker_freqs.innerHTML =
          '<span>32</span>' +
          //			'<span>32</span>' +
          //			'<span>64</span>' +
          //			'<span>128</span>' +
          //			'<span>250</span>' +
          //			'<span>500</span>' +
          '<span style="position:absolute;left:3.5%">500<span></span></span>' +
          '<span style="position:absolute;left:9%">1k<span></span></span>' +
          '<span style="position:absolute;left:19%">2k<span></span></span>' +
          '<span style="position:absolute;left:38%">4k<span></span></span>' +
          '<span style="position:absolute;left:50%">5k<span></span></span>' +
          '<span style="position:absolute;left:59%">8k<span></span></span>' +
          '<span style="position:absolute;left:72%">12k<span></span></span>' +
          '<span style="position:absolute;left:85%">16k<span></span></span>' +
          '<span style="float:right">20k</span>';
        var marker_dbs: FxPgEqRuntimeValue = d.createElement('div');
        marker_dbs.className = 'pk_peq4 pk_noselect';
        marker_dbs.innerHTML =
          '<span style="top:0">35</span>' +
          '<span style="top:10%">28<span></span></span>' +
          '<span style="top:20%">21<span></span></span>' +
          '<span style="top:30%">14<span></span></span>' +
          '<span style="top:40%">7<span></span></span>' +
          '<span>0<span></span></span>' +
          '<span style="top:60%">-7<span></span></span>' +
          '<span style="top:70%">-14<span></span></span>' +
          '<span style="top:80%">-21<span></span></span>' +
          '<span style="top:90%">-28<span></span></span>' +
          '<span style="top:100%">35</span>';
        el_drawer.appendChild(canvas_bars);
        el_drawer.appendChild(canvas_eq);
        el_drawer.appendChild(marker_freqs);
        el_drawer.appendChild(marker_dbs);
        q.el.appendChild(el_drawer);
        // element's area
        var el_list: FxPgEqRuntimeValue = document.createElement('div');
        el_list.className = 'pk_row pk_noselect pk_pglst';
        el_list.innerHTML =
          '<div class="pk_pgeq_els">' +
          '<span class="pk_txlft"> #</span><span>type</span><span>gain</span><span>freq</span><span>Q</span>' +
          '</div>';
        q.el.appendChild(el_list);
        q.ui.ctx_bars = ctx_bars;
        q.ui.ctx_eq = ctx_eq;
        q.ui.canvas_bars = canvas_bars;
        q.ui.canvas_eq = canvas_eq;
        q.ui.el_list = el_list;
      }
      function _make_evs(this: FxPgEqRuntimeValue, q?: FxPgEqRuntimeValue) {
        var ctx: FxPgEqRuntimeValue = q.ui.ctx_eq;
        var canvas: FxPgEqRuntimeValue = q.ui.canvas_eq;
        var click_time: FxPgEqRuntimeValue = 0;
        var is_dragging: FxPgEqRuntimeValue = false;
        var _move: FxPgEqRuntimeValue = function (
          this: FxPgEqRuntimeValue,
          e?: FxPgEqRuntimeValue,
        ) {
          if (!is_dragging || !q.act) return;
          var ex: FxPgEqRuntimeValue = 0;
          var ey: FxPgEqRuntimeValue = 0;
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
          var bounds: FxPgEqRuntimeValue = canvas.getBoundingClientRect();
          var cw: FxPgEqRuntimeValue = canvas.width;
          var ch: FxPgEqRuntimeValue = canvas.height;
          var posx: FxPgEqRuntimeValue = ex - bounds.left;
          var posy: FxPgEqRuntimeValue = ey - bounds.top;
          var rel_x: FxPgEqRuntimeValue = posx / cw;
          var rel_y: FxPgEqRuntimeValue = posy / ch;
          q.act._coords.x = posx;
          q.act._coords.y = posy;
          // up until half it's 0 - 5000, second half 5000 -> 2200
          var freq: FxPgEqRuntimeValue = 0;
          if (rel_x <= 0.5) {
            freq = (5000 * (rel_x * 2)) >> 0;
          } else {
            freq = 5000 + (((rel_x - 0.5) * 2 * 15000) >> 0);
          }
          //				var freq = (rel_x * (total_freq) + 0) >> 0; // + 16 (min freq)
          var gain: FxPgEqRuntimeValue = Number(((rel_y - 0.5) * -2 * max_db_val).toFixed(2));
          _range_update(q, q.act, {
            freq: freq,
            gain: gain,
          });
          _range_compute_arr(q.act);
        };
        var _end: FxPgEqRuntimeValue = function (this: FxPgEqRuntimeValue, e?: FxPgEqRuntimeValue) {
          is_dragging = false;
          canvas.removeEventListener('mousemove', _move);
          canvas.removeEventListener('mouseup', _end);
          canvas.removeEventListener('touchmove', _move);
          canvas.removeEventListener('touchup', _end);
        };
        var mdown: FxPgEqRuntimeValue = function (
          this: FxPgEqRuntimeValue,
          e?: FxPgEqRuntimeValue,
        ) {
          var unchecked: FxPgEqRuntimeValue = !!q.act;
          if (q.ranges.length === 0) {
            if (unchecked) q.Render();
            return;
          }
          var bounds: FxPgEqRuntimeValue = canvas.getBoundingClientRect();
          var cw: FxPgEqRuntimeValue = canvas.width;
          var ch: FxPgEqRuntimeValue = canvas.height;
          var posx: FxPgEqRuntimeValue = e.clientX - bounds.left;
          var posy: FxPgEqRuntimeValue = e.clientY - bounds.top;
          var dist_x: FxPgEqRuntimeValue = e.is_touch ? 20 : 10;
          var dist_y: FxPgEqRuntimeValue = e.is_touch ? 20 : 9;
          for (var o: FxPgEqRuntimeValue = 0; o < q.ranges.length; ++o) {
            var curr: FxPgEqRuntimeValue = q.ranges[o];
            if (
              Math.abs(curr._coords.x - posx) < dist_x &&
              Math.abs(curr._coords.y - posy) < dist_y
            ) {
              if (unchecked) {
                q.act.el.classList.remove('pk_act');
              }
              q.act = curr;
              q.act.el.classList.add('pk_act');
              is_dragging = true;
              q.Render();
              // check if we are targetting a circle
              if (!e.is_touch) {
                canvas.addEventListener('mousemove', _move, false);
                canvas.addEventListener('mouseup', _end, false);
              } else {
                e.ev.preventDefault();
                e.ev.stopPropagation();
                canvas.addEventListener('touchmove', _move, false);
                canvas.addEventListener('touchup', _end, false);
              }
              return;
            }
            // ---
          }
          if (unchecked) {
            q.act.el.classList.remove('pk_act');
            // un-highlight
            q.act = null;
            q.Render();
          }
          // ----
        };
        canvas.addEventListener('mousedown', mdown, false);
        canvas.addEventListener(
          'touchstart',
          function (this: FxPgEqRuntimeValue, e?: FxPgEqRuntimeValue) {
            if (e.touches.length > 1) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            var ev: FxPgEqRuntimeValue = {
              clientX: e.touches[0].clientX,
              clientY: e.touches[0].clientY,
              is_touch: true,
              ev: e,
            };
            mdown(ev);
          },
        );
        canvas.addEventListener(
          'click',
          function (this: FxPgEqRuntimeValue, e?: FxPgEqRuntimeValue) {
            if (e.timeStamp - click_time < 260) {
              var bounds: FxPgEqRuntimeValue = canvas.getBoundingClientRect();
              var cw: FxPgEqRuntimeValue = canvas.width;
              var ch: FxPgEqRuntimeValue = canvas.height;
              var posx: FxPgEqRuntimeValue = e.clientX - bounds.left;
              var posy: FxPgEqRuntimeValue = e.clientY - bounds.top;
              var rel_x: FxPgEqRuntimeValue = posx / cw;
              var rel_y: FxPgEqRuntimeValue = posy / ch;
              var freq: FxPgEqRuntimeValue = 0;
              if (rel_x <= 0.5) {
                freq = (5000 * (rel_x * 2)) >> 0;
              } else {
                freq = 5000 + (((rel_x - 0.5) * 2 * 15000) >> 0);
              }
              // var freq = (rel_x * (total_freq) + 0) >> 0; // + 16 (min freq)
              var gain: FxPgEqRuntimeValue = Number(((rel_y - 0.5) * -2 * max_db_val).toFixed(2));
              var qval: FxPgEqRuntimeValue = 5;
              var type: FxPgEqRuntimeValue = 'peaking';
              q.Add(type, true, freq, gain, qval, posx, posy);
            }
            click_time = e.timeStamp;
          },
          false,
        );
        // ---
      }
      function _range_render_el(
        this: FxPgEqRuntimeValue,
        q?: FxPgEqRuntimeValue,
        range?: FxPgEqRuntimeValue,
        clss?: FxPgEqRuntimeValue,
      ) {
        var el_list: FxPgEqRuntimeValue = q.ui.el_list;
        var el: FxPgEqRuntimeValue = d.createElement('div');
        el.className = 'pk_pgeq_els' + (clss ? clss : '');
        el.setAttribute('data-id', range.id);
        el.addEventListener(
          'click',
          function (this: FxPgEqRuntimeValue, e?: FxPgEqRuntimeValue) {
            if (!range.el) return;
            if (range !== q.act) {
              if (q.act) {
                q.act.el.classList.remove('pk_act');
              }
              q.act = range;
              q.act.el.classList.add('pk_act');
              q.Render();
            }
          },
          false,
        );
        el.addEventListener(
          'mouseover',
          function (this: FxPgEqRuntimeValue, e?: FxPgEqRuntimeValue) {
            if (!range.el) return;
            if (!range._hov) {
              range._hov = true;
              q.Render();
            }
          },
          false,
        );
        el.addEventListener(
          'mouseleave',
          function (this: FxPgEqRuntimeValue, e?: FxPgEqRuntimeValue) {
            if (!range.el) return;
            if (range._hov) {
              range._hov = false;
              q.Render();
            }
          },
          false,
        );
        // # & on or off
        var chckd: FxPgEqRuntimeValue = range._on ? 'checked' : '';
        var num: FxPgEqRuntimeValue = '<i>' + range.id + '</i>';
        var el_num: FxPgEqRuntimeValue = d.createElement('div');
        el_num.className = 'pk_txlft';
        el_num.innerHTML =
          num +
          '<input type="checkbox" id="pgon' +
          range.id +
          '" class="pk_check" name="onoff" ' +
          chckd +
          '>' +
          '<label for="pgon' +
          range.id +
          '">ON</label>';
        el_num.getElementsByTagName('input')[0].onchange = function (
          this: FxPgEqRuntimeValue,
          e?: FxPgEqRuntimeValue,
        ) {
          _range_update(q, range, { _on: !!this.checked });
          var lbl: FxPgEqRuntimeValue = this.parentNode.getElementsByTagName('label')[0];
          lbl.innerHTML = this.checked ? 'ON' : 'OFF';
        };
        el.appendChild(el_num);
        // type
        var sel1: FxPgEqRuntimeValue = range.type === 'lowpass' ? 'selected' : '';
        var sel2: FxPgEqRuntimeValue = range.type === 'highpass' ? 'selected' : '';
        var el_type: FxPgEqRuntimeValue = d.createElement('div');
        el_type.innerHTML =
          '<select><option>peaking</option><option ' +
          sel1 +
          '>lowpass</option><option ' +
          sel2 +
          '>highpass</option></select>';
        el_type.getElementsByTagName('select')[0].onchange = function (
          this: FxPgEqRuntimeValue,
          e?: FxPgEqRuntimeValue,
        ) {
          var val: FxPgEqRuntimeValue = this.options[this.selectedIndex].value;
          if (val === 'peaking') {
            el.classList.remove('pk_dis');
          } else {
            el.classList.add('pk_dis');
          }
          _range_update(q, range, { type: val }, 1);
        };
        el.appendChild(el_type);
        // gain
        var el_gain: FxPgEqRuntimeValue = d.createElement('div');
        el_gain.innerHTML =
          '<input type="number" class="pk_val pk_gain" min="-35" max="35" value="' +
          range.gain +
          '">';
        el_gain.getElementsByClassName('pk_gain')[0].onchange = function (
          this: FxPgEqRuntimeValue,
          e?: FxPgEqRuntimeValue,
        ) {
          if (!this.value) {
            this.value = 0;
          }
          if (this.hasAttribute('data-open')) {
            this.parentNode.getElementsByClassName('pk_horiz')[0].value = this.value;
          }
          _range_update(q, range, { gain: this.value / 1 }, 1);
          _range_compute_arr(range);
        };
        el_gain.getElementsByClassName('pk_gain')[0].onfocus = function (
          this: FxPgEqRuntimeValue,
          e?: FxPgEqRuntimeValue,
        ) {
          if (this.hasAttribute('data-open')) return;
          var self: FxPgEqRuntimeValue = this;
          var parent: FxPgEqRuntimeValue = this.parentNode;
          var bar: FxPgEqRuntimeValue = document.createElement('div');
          bar.className = 'pk_pgeq_freq pk_gain';
          bar.innerHTML =
            '<div class="pk_arr"></div><input type="range" min="-35" max="35" class="pk_horiz pk_gain" step="0.1" value="' +
            range.gain +
            '">';
          bar.getElementsByClassName('pk_horiz')[0].oninput = function (
            this: FxPgEqRuntimeValue,
            e?: FxPgEqRuntimeValue,
          ) {
            if (self.value != this.value) {
              self.value = this.value;
              self.onchange();
            }
          };
          parent.appendChild(bar);
          this.setAttribute('data-open', '1');
          var down: FxPgEqRuntimeValue = function (
            this: FxPgEqRuntimeValue,
            e?: FxPgEqRuntimeValue,
          ) {
            if (
              !e.target.classList.contains('pk_gain') ||
              (e.target.type === self.type && e.target !== self)
            ) {
              self.removeAttribute('data-open');
              parent.removeChild(bar);
              q.el.removeEventListener('mousedown', down);
              return;
            }
          };
          q.el.addEventListener('mousedown', down, false);
        };
        el.appendChild(el_gain);
        // freq
        var el_freq: FxPgEqRuntimeValue = d.createElement('div');
        el_freq.innerHTML =
          '<input type="number" class="pk_val pk_freq" min="16" max="20000" value="' +
          range.freq +
          '">';
        el_freq.getElementsByClassName('pk_freq')[0].onchange = function (
          this: FxPgEqRuntimeValue,
          e?: FxPgEqRuntimeValue,
        ) {
          if (!this.value) {
            this.value = 500;
          }
          if (this.hasAttribute('data-open')) {
            this.parentNode.getElementsByClassName('pk_horiz')[0].value = this.value;
          }
          _range_update(q, range, { freq: this.value / 1 }, 1);
          _range_compute_arr(range);
        };
        el_freq.getElementsByClassName('pk_freq')[0].onfocus = function (
          this: FxPgEqRuntimeValue,
          e?: FxPgEqRuntimeValue,
        ) {
          if (this.hasAttribute('data-open')) return;
          var self: FxPgEqRuntimeValue = this;
          var parent: FxPgEqRuntimeValue = this.parentNode;
          var bar: FxPgEqRuntimeValue = document.createElement('div');
          bar.className = 'pk_pgeq_freq pk_freq';
          bar.innerHTML =
            '<div class="pk_arr"></div><input type="range" min="16" max="20000" class="pk_horiz pk_freq" step="1" value="' +
            range.freq +
            '">';
          bar.getElementsByClassName('pk_horiz')[0].oninput = function (
            this: FxPgEqRuntimeValue,
            e?: FxPgEqRuntimeValue,
          ) {
            if (self.value != this.value) {
              self.value = this.value;
              self.onchange();
            }
          };
          parent.appendChild(bar);
          this.setAttribute('data-open', '1');
          var down: FxPgEqRuntimeValue = function (
            this: FxPgEqRuntimeValue,
            e?: FxPgEqRuntimeValue,
          ) {
            if (
              !e.target.classList.contains('pk_freq') ||
              (e.target.type === self.type && e.target !== self)
            ) {
              self.removeAttribute('data-open');
              parent.removeChild(bar);
              q.el.removeEventListener('mousedown', down);
            }
          };
          q.el.addEventListener('mousedown', down, false);
        };
        el.appendChild(el_freq);
        // q
        var el_q: FxPgEqRuntimeValue = d.createElement('div');
        el_q.innerHTML =
          '<input type="number" class="pk_val pk_q" min="1" max="50" value="' + range.q + '">';
        el_q.getElementsByClassName('pk_q')[0].onchange = function (
          this: FxPgEqRuntimeValue,
          e?: FxPgEqRuntimeValue,
        ) {
          if (!this.value) {
            this.value = 1;
          }
          if (this.hasAttribute('data-open')) {
            this.parentNode.getElementsByClassName('pk_horiz')[0].value = this.value;
          }
          _range_update(q, range, { q: this.value / 1 }, 1);
          _range_compute_arr(range);
        };
        el_q.getElementsByClassName('pk_q')[0].onfocus = function (
          this: FxPgEqRuntimeValue,
          e?: FxPgEqRuntimeValue,
        ) {
          if (this.hasAttribute('data-open')) return;
          var self: FxPgEqRuntimeValue = this;
          var parent: FxPgEqRuntimeValue = this.parentNode;
          var bar: FxPgEqRuntimeValue = document.createElement('div');
          bar.className = 'pk_pgeq_freq pk_q';
          bar.innerHTML =
            '<div class="pk_arr"></div><input type="range" min="1" max="50" class="pk_horiz pk_q" step="0.1" value="' +
            range.q +
            '">';
          bar.getElementsByClassName('pk_horiz')[0].oninput = function (
            this: FxPgEqRuntimeValue,
            e?: FxPgEqRuntimeValue,
          ) {
            if (self.value != this.value) {
              self.value = this.value;
              self.onchange();
            }
          };
          parent.appendChild(bar);
          this.setAttribute('data-open', '1');
          var down: FxPgEqRuntimeValue = function (
            this: FxPgEqRuntimeValue,
            e?: FxPgEqRuntimeValue,
          ) {
            if (
              !e.target.classList.contains('pk_q') ||
              (e.target.type === self.type && e.target !== self)
            ) {
              self.removeAttribute('data-open');
              parent.removeChild(bar);
              q.el.removeEventListener('mousedown', down);
            }
          };
          q.el.addEventListener('mousedown', down, false);
        };
        el.appendChild(el_q);
        // delete
        var el_del: FxPgEqRuntimeValue = d.createElement('div');
        el_del.className = 'pk_del';
        el_del.innerHTML = '<a style="cursor:pointer">DELETE</a>';
        el_del.getElementsByTagName('a')[0].onclick = function (
          this: FxPgEqRuntimeValue,
          e?: FxPgEqRuntimeValue,
        ) {
          q.Remove(range);
        };
        el.appendChild(el_del);
        // ----------------------
        el_list.appendChild(el);
        return el;
      }
      function _compare(this: FxPgEqRuntimeValue, a?: FxPgEqRuntimeValue, b?: FxPgEqRuntimeValue) {
        if (a.type === 'peaking' && b.type !== 'peaking') return -1;
        if (b.type === 'peaking' && a.type !== 'peaking') return 1;
        return 0;
      }
      // ---
    }
    var ParagraphicModal: FxPgEqRuntimeValue = function (
      this: FxPgEqRuntimeValue,
      app?: FxPgEqRuntimeValue,
      custom_presets?: FxPgEqRuntimeValue,
    ) {
      app.fireEvent('RequestSelect', 1);
      var filter_id: FxPgEqRuntimeValue = 'paragraphic_eq';
      // -------
      var PGEQ: FxPgEqRuntimeValue = new (PK_FX_PGEQ as FxPgEqRuntimeValue)();
      var DrawBars: FxPgEqRuntimeValue = function (
        this: FxPgEqRuntimeValue,
        _?: FxPgEqRuntimeValue,
        freq?: FxPgEqRuntimeValue,
      ) {
        PGEQ.RenderBars(_, freq);
      };
      var updateFilter: FxPgEqRuntimeValue = function (this: FxPgEqRuntimeValue) {
        if (!PGEQ) return;
        var val: FxPgEqRuntimeValue = [];
        var ranges: FxPgEqRuntimeValue = PGEQ.ranges;
        for (var i: FxPgEqRuntimeValue = 0; i < ranges.length; ++i) {
          var range: FxPgEqRuntimeValue = ranges[i];
          if (range._on) {
            val.push({
              type: range.type,
              freq: range.freq,
              val: range.gain,
              q: range.q,
            });
          }
        }
        return val;
      };
      var x: FxPgEqRuntimeValue = new PKAudioFXModal(
        {
          id: filter_id,
          title: 'Paragraphic EQ',
          ondestroy: function (this: FxPgEqRuntimeValue, q?: FxPgEqRuntimeValue) {
            app.stopListeningFor('DidAudioProcess', DrawBars);
            app.ui.InteractionHandler.on = false;
            app.ui.KeyHandler.removeCallback(modal_esc_key);
            PGEQ && PGEQ.Destroy();
            PGEQ = null;
          },
          preview: function (this: FxPgEqRuntimeValue, q?: FxPgEqRuntimeValue) {
            app.fireEvent('RequestActionFX_PREVIEW_PARAMEQ', updateFilter());
          },
          body: '',
          presets: [
            { name: 'Old Telephone', val: '1,highpass,0,5800,5.8,1,lowpass,0,7060,5' },
            {
              name: 'AM Radio',
              val: '1,highpass,0,400,0.8,1,lowpass,0,3500,0.8,1,peaking,4,1500,1',
            },
            {
              name: 'Megaphone',
              val: '1,highpass,0,700,0.7,1,lowpass,0,4000,0.7,1,peaking,6,2000,2',
            },
            { name: 'Underwater', val: '1,lowpass,0,1200,1,1,peaking,3,300,1' },
            {
              name: 'Lo-Fi / Vintage',
              val: '1,highpass,0,80,0.7,1,lowpass,0,7000,0.7,1,peaking,3,200,1,1,peaking,-3,4000,1',
            },
            { name: 'Bass Boost', val: '1,peaking,6,60,0.7,1,peaking,3,120,1' },
            {
              name: 'Vocal Presence',
              val: '1,highpass,0,80,0.7,1,peaking,-3,250,1,1,peaking,3,3000,1.2,1,peaking,2,8000,1',
            },
            {
              name: 'Loudness (Smile)',
              val: '1,peaking,5,80,0.7,1,peaking,-3,1000,1,1,peaking,5,10000,0.7',
            },
            { name: 'Air / Brilliance', val: '1,peaking,4,10000,0.7,1,peaking,3,13000,1' },
            { name: 'De-Rumble', val: '1,highpass,0,80,0.7,1,peaking,-6,50,1' },
            {
              name: 'Podcast Voice',
              val: '1,highpass,0,100,0.7,1,peaking,-2,300,1,1,peaking,2,2500,1.2,1,peaking,2,9000,0.7',
            },
            { name: 'De-Esser', val: '1,peaking,-5,6500,3' },
            {
              name: 'Drum Punch',
              val: '1,peaking,4,80,1.2,1,peaking,-3,250,1,1,peaking,3,4000,1.5',
            },
            {
              name: 'Acoustic Sparkle',
              val: '1,highpass,0,80,0.7,1,peaking,-2,200,1,1,peaking,3,5000,1',
            },
          ],
          custom_pres: custom_presets.Get(filter_id),
          onpreset: function (this: FxPgEqRuntimeValue, val?: FxPgEqRuntimeValue) {
            var l: FxPgEqRuntimeValue = PGEQ.ranges.length;
            while (l-- > 0) {
              PGEQ.Remove(PGEQ.ranges[l]);
            }
            var canvas: FxPgEqRuntimeValue = PGEQ.ui.canvas_eq;
            var cw: FxPgEqRuntimeValue = canvas.width;
            var ch: FxPgEqRuntimeValue = canvas.height;
            var list: FxPgEqRuntimeValue = val.split(',');
            var len: FxPgEqRuntimeValue = list.length;
            var els: FxPgEqRuntimeValue = (len / 5) >> 0;
            for (var j: FxPgEqRuntimeValue = 0; j < els; ++j) {
              var curr: FxPgEqRuntimeValue = [];
              var offset: FxPgEqRuntimeValue = j * 5;
              curr[0] = !!(list[offset + 0] / 1);
              curr[1] = list[offset + 1];
              curr[2] = list[offset + 2] / 1;
              curr[3] = list[offset + 3] / 1;
              curr[4] = list[offset + 4] / 1;
              var x: FxPgEqRuntimeValue = 0;
              var y: FxPgEqRuntimeValue = 0;
              if (curr[3] < 5000) {
                x = (curr[3] / 5000) * (cw / 2);
              } else {
                x = Number((cw / 2 + ((curr[3] - 5000) / 15000) * (cw / 2)).toFixed(1));
              }
              if (curr[1] === 'peaking')
                y = Number(((1.0 - (curr[2] / 1 + max_db_val) / (max_db_val * 2)) * ch).toFixed(1));
              else y = Number((ch / 2).toFixed(1));
              // (type, is_on, freq, gain, qval, coords_x, coords_y)
              PGEQ.Add(curr[1], !!curr[0], curr[3] / 1, curr[2] / 1, curr[4] / 1, x, y);
            }
          },
          buttons: [
            {
              title: 'Apply EQ',
              clss: 'pk_modal_a_accpt',
              callback: function (this: FxPgEqRuntimeValue, q?: FxPgEqRuntimeValue) {
                app.fireEvent('RequestActionFX_PARAMEQ', updateFilter());
                q.Destroy();
              },
            },
          ],
          setup: function (this: FxPgEqRuntimeValue, q?: FxPgEqRuntimeValue) {
            PGEQ.Init(q.el_body);
            PGEQ.Callback = function (this: FxPgEqRuntimeValue) {
              app.fireEvent('RequestActionFX_UPDATE_PREVIEW', updateFilter());
            };
            app.listenFor('DidAudioProcess', DrawBars);
            app.fireEvent('RequestPause');
            app.ui.InteractionHandler.checkAndSet(modal_name);
            app.ui.KeyHandler.addCallback(
              modal_esc_key,
              function (this: FxPgEqRuntimeValue, e?: FxPgEqRuntimeValue) {
                if (!app.ui.InteractionHandler.check(modal_name)) return;
                q.Destroy();
              },
              [27],
            );
          },
        },
        app,
      );
      x.Show();
    };
    PKAudioEditor._deps.FxEQ = ParagraphicModal;
    ///////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////
    function getOfflineAudioContext(
      this: FxPgEqRuntimeValue,
      channels?: FxPgEqRuntimeValue,
      sampleRate?: FxPgEqRuntimeValue,
      duration?: FxPgEqRuntimeValue,
    ) {
      return new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
        channels,
        duration,
        sampleRate,
      );
    }
    function _normalize_array(this: FxPgEqRuntimeValue, data?: FxPgEqRuntimeValue) {
      var new_array: FxPgEqRuntimeValue = [];
      for (var i: FxPgEqRuntimeValue = 0; i < data.length; ++i) {
        new_array.push(Math.abs(Math.round((data[i + 1] - data[i]) * 1000)));
      }
      return new_array;
    }
    function _normalize_array2(this: FxPgEqRuntimeValue, data?: FxPgEqRuntimeValue) {
      var new_array: FxPgEqRuntimeValue = [];
      for (var i: FxPgEqRuntimeValue = 0; i < data.length; ++i) {
        new_array.push(Math.round(Math.abs(data[i] * 1000)));
      }
      return new_array;
    }
    function _group_rhythm(
      this: FxPgEqRuntimeValue,
      data?: FxPgEqRuntimeValue,
      diff_arr?: FxPgEqRuntimeValue,
    ) {
      if (diff_arr.length <= 1) return;
      var peak_median: FxPgEqRuntimeValue = 0;
      for (var i: FxPgEqRuntimeValue = 0; i < data.length; ++i) {
        peak_median += data[i];
      }
      peak_median /= diff_arr.length;
      peak_median -= peak_median * 0.2;
      var diff_median: FxPgEqRuntimeValue = 0;
      for (var i: FxPgEqRuntimeValue = 0; i < diff_arr.length; ++i) {
        diff_median += diff_arr[i];
      }
      diff_median /= diff_arr.length;
      if (diff_median > 1) diff_median -= diff_median * 0.2;
      var existing: FxPgEqRuntimeValue = 0;
      for (var i: FxPgEqRuntimeValue = 0; i < diff_arr.length; ++i) {
        if (diff_arr[i] <= diff_median) continue;
        ++existing;
      }
      // console.log (" DIFF MEDIAN IS ", diff_median, "    and total beats: ", existing, "  out of: ", diff_arr.length);
      // clean-up the drums array - based on the median.
      // console.log ( JSON.stringify( data ) );
      // console.log ("----------");
      for (var i: FxPgEqRuntimeValue = 0, j: FxPgEqRuntimeValue = 0; i < data.length; ++i) {
        if (data[i] !== 0) {
          if (diff_arr[j] && diff_arr[j] < diff_median) {
            if (data[i] > peak_median && diff_arr[j] > diff_median * 0.6) {
              //console.log ( 'ZEROEDC NOOOOT ', i, '    ',  data[i], ' with median ', peak_median , '  but diff was  ', diff_arr[j],  '   yet. ',  diff_median );
            } else {
              //console.log ( 'ZEROEDC ', i, '    ',  data[i], ' with median ', peak_median , '  but diff was  ', diff_arr[j],  '   yet. ',  diff_median );
              data[i] = 0;
            }
          }
          ++j;
        }
        // ----
      }
      // console.log( data );
      window.final_arr = data;
      // console.log ( JSON.stringify( data ) );
      // now count distance between peaks
      var distances: FxPgEqRuntimeValue = {};
      var unique_distances: FxPgEqRuntimeValue = [];
      var first_found: FxPgEqRuntimeValue = 0;
      var is_first: FxPgEqRuntimeValue = true;
      for (
        var i: FxPgEqRuntimeValue = 0;
        i < data.length - 1;
        ++i
      ) // #### do not litter the last data
      {
        if (data[i] === 0) {
          ++first_found;
          continue;
        }
        //if (first_found < 1 && !is_first) {
        //	continue;
        //}
        if (is_first) {
          is_first = false;
        }
        first_found = 0;
        var own: FxPgEqRuntimeValue = [];
        unique_distances.push(own);
        // console.log ('----------------------------------');
        // console.log ('COMPUTING DISTANCE OF ' + i + '    value ' + data[i] );
        var interval: FxPgEqRuntimeValue = 0;
        var total: FxPgEqRuntimeValue = 12;
        var last_found: FxPgEqRuntimeValue = 0;
        for (var j: FxPgEqRuntimeValue = i + 1; j < 1000; ++j) {
          if (data[j] === 0) {
            ++interval;
            ++last_found;
            continue;
          } else if (!data[j]) {
            break;
          }
          if (last_found < 0) {
            continue;
          }
          last_found = 0;
          if (--total === 0) break;
          own.push(interval);
          // if it exists, immediately reach out for the next one.
          if (!distances[interval]) distances[interval] = 0;
          distances[interval] += 1;
          // console.log ('distance with index ' + j + '    value ' + data[j] + '    is ' + interval );
        }
        // break;
      }
      // grab only the big peaks.
      function getmax(this: FxPgEqRuntimeValue, a?: FxPgEqRuntimeValue) {
        var m: FxPgEqRuntimeValue = -Infinity,
          i: FxPgEqRuntimeValue = 0,
          n: FxPgEqRuntimeValue = a.length;
        for (; i != n; ++i) {
          if (a[i] > m) {
            m = a[i];
          }
        }
        return m;
      }
      function getmin(this: FxPgEqRuntimeValue, a?: FxPgEqRuntimeValue) {
        var m: FxPgEqRuntimeValue = Infinity,
          i: FxPgEqRuntimeValue = 0,
          n: FxPgEqRuntimeValue = a.length;
        for (; i != n; ++i) {
          if (a[i] !== 0 && a[i] < m) {
            m = a[i];
          }
        }
        return m;
      }
      var max: FxPgEqRuntimeValue = getmax(data);
      var min: FxPgEqRuntimeValue = getmin(data);
      var count: FxPgEqRuntimeValue = 0;
      var threshold: FxPgEqRuntimeValue = Math.round((max - min) * 0.3);
      var velocities: FxPgEqRuntimeValue = [];
      for (var i: FxPgEqRuntimeValue = 0; i < data.length; ++i) {
        if (data[i] === 0) continue;
        if (data[i] >= max - threshold) {
          velocities.push(3);
        } else if (data[i] >= max - threshold * 2) {
          velocities.push(2);
        } else if (data[i] >= max - threshold * 3) {
          velocities.push(1);
        } else {
          velocities.push(0);
        }
      }
      return [distances, velocities];
    }
    var TempoToolsModal: FxPgEqRuntimeValue = function (
      this: FxPgEqRuntimeValue,
      app?: FxPgEqRuntimeValue,
    ) {
      app.fireEvent('RequestSelect', 1);
      var filter_id: FxPgEqRuntimeValue = 'tempo_tools';
      var act_index: FxPgEqRuntimeValue = 0;
      var act_tool: FxPgEqRuntimeValue = null;
      // ------
      var TempoMetro: FxPgEqRuntimeValue = function (
        this: FxPgEqRuntimeValue,
        app?: FxPgEqRuntimeValue,
        modal?: FxPgEqRuntimeValue,
      ) {
        var q: FxPgEqRuntimeValue = this;
        q.app = app;
        var bpm: FxPgEqRuntimeValue = 120;
        var tick: FxPgEqRuntimeValue = null;
        var count: FxPgEqRuntimeValue = 0;
        var time: FxPgEqRuntimeValue = ((60.0 / bpm) * 1000) >> 0;
        var audioContext: FxPgEqRuntimeValue = null; // new AudioContext();
        var osc: FxPgEqRuntimeValue = null;
        var amp: FxPgEqRuntimeValue = null;
        var ready: FxPgEqRuntimeValue = false;
        var volume: FxPgEqRuntimeValue = 0.5;
        var accentuate: FxPgEqRuntimeValue = true;
        var DidStopPlay: FxPgEqRuntimeValue = null;
        var DidPlay: FxPgEqRuntimeValue = null;
        var MetronomeAct: FxPgEqRuntimeValue = null;
        var MetronomeInAct: FxPgEqRuntimeValue = null;
        q.Init = function (this: FxPgEqRuntimeValue, container?: FxPgEqRuntimeValue) {
          var q: FxPgEqRuntimeValue = this;
          q.el = container;
          _make_ui(q);
          _make_evs(q);
        };
        q.Destroy = function (this: FxPgEqRuntimeValue) {
          q.app.stopListeningFor('DidStopPlay', DidStopPlay);
          q.app.stopListeningFor('DidPlay', DidPlay);
          q.app.stopListeningFor('DidStartMetro', MetronomeAct);
          q.app.stopListeningFor('DidStopMetro', MetronomeInAct);
          DidStopPlay = null;
          DidPlay = null;
          MetronomeAct = null;
          MetronomeInAct = null;
          if (ready) {
            if (tick) {
              clearTimeout(tick);
              tick = null;
            }
            if (audioContext) {
              var now: FxPgEqRuntimeValue = audioContext.currentTime;
              osc.stop(now);
              amp.disconnect();
              osc.disconnect();
              audioContext = null;
              ready = false;
            }
          }
          if (q.body) {
            q.body.parentNode.removeChild(q.body);
            q.body = null;
          }
          q.app = null;
        };
        function _make_ui(this: FxPgEqRuntimeValue, q?: FxPgEqRuntimeValue) {
          var el_drawer: FxPgEqRuntimeValue = d.createElement('div');
          el_drawer.className = 'pk_row';
          el_drawer.innerHTML =
            '<div class="pk_row">' +
            '<label>BPM</label>' +
            '<input type="range" min="20" max="300" class="pk_horiz" step="1" value="120" />' +
            '<span class="pk_val">120</span>' +
            '</div>' +
            '<div class="pk_row">' +
            '<label>Volume</label>' +
            '<input type="range" min="0.0" max="1.0" class="pk_horiz" step="0.1" value="0.5" />' +
            '<span class="pk_val">50%</span>' +
            '</div>' +
            '<div class="pk_row">' +
            '<input type="checkbox" id="xxcjgs" class="pk_check" checked name="metroAccent">' +
            '<label for="xxcjgs">Accentuate metronome click</label></div>' +
            '<div class="pk_row">' +
            '<a class="pk_modal_a_bottom" style="display:inline-block;float:none">Metronome</a>' +
            '<a class="pk_modal_a_bottom" style="display:inline-block;float:none">Play Track</a>' +
            '<a class="pk_modal_a_bottom" style="display:inline-block;float:none">Play Both</a>' +
            '</div>';
          q.body = el_drawer;
          q.el.appendChild(el_drawer);
        }
        function _make_evs(this: FxPgEqRuntimeValue, q?: FxPgEqRuntimeValue) {
          var range: FxPgEqRuntimeValue = q.body.getElementsByClassName('pk_horiz')[0];
          var span: FxPgEqRuntimeValue = q.body.getElementsByClassName('pk_val')[0];
          var range2: FxPgEqRuntimeValue = q.body.getElementsByClassName('pk_horiz')[1];
          var span2: FxPgEqRuntimeValue = q.body.getElementsByClassName('pk_val')[1];
          var checkbox: FxPgEqRuntimeValue = q.body.getElementsByClassName('pk_check')[0];
          range.oninput = function (this: FxPgEqRuntimeValue) {
            bpm = range.value / 1;
            span.innerHTML = bpm;
            time = ((60.0 / bpm) * 1000) >> 0;
          };
          range2.oninput = function (this: FxPgEqRuntimeValue) {
            var val: FxPgEqRuntimeValue = range2.value / 1;
            volume = val;
            span2.innerHTML = ((val * 100) >> 0) + '%';
          };
          checkbox.oninput = function (this: FxPgEqRuntimeValue) {
            accentuate = checkbox.checked;
          };
          var metronome_btn: FxPgEqRuntimeValue =
            q.body.getElementsByClassName('pk_modal_a_bottom')[0];
          var play_btn: FxPgEqRuntimeValue = q.body.getElementsByClassName('pk_modal_a_bottom')[1];
          var both_btn: FxPgEqRuntimeValue = q.body.getElementsByClassName('pk_modal_a_bottom')[2];
          function mtOn(this: FxPgEqRuntimeValue) {
            var mt: FxPgEqRuntimeValue = q.app.multitrack;
            return mt && mt.IsOn && mt.IsOn() ? mt : null;
          }
          function trackReady(this: FxPgEqRuntimeValue) {
            var mt: FxPgEqRuntimeValue = mtOn();
            return mt ? mt.HasClips() : PKAudioEditor.engine.wavesurfer.isReady;
          }
          function trackPlaying(this: FxPgEqRuntimeValue) {
            var mt: FxPgEqRuntimeValue = mtOn();
            return mt ? mt.IsPlaying() : PKAudioEditor.engine.wavesurfer.isPlaying();
          }
          metronome_btn.onclick = function (this: FxPgEqRuntimeValue) {
            if (tick) {
              clearTimeout(tick);
              tick = null;
              count = 0;
              q.app.fireEvent('DidStopMetro');
              return;
            }
            var play: FxPgEqRuntimeValue = function (this: FxPgEqRuntimeValue) {
              tick = setTimeout(function (this: FxPgEqRuntimeValue) {
                if (!tick) return;
                if (++count % 4 === 0) _metronome(1);
                else _metronome(0);
                play();
              }, time);
            };
            count = 0;
            if (!ready) _prepare();
            q.app.fireEvent('DidStartMetro');
            _metronome(1);
            play();
          };
          MetronomeInAct = function (this: FxPgEqRuntimeValue) {
            metronome_btn.classList.remove('pk_act');
          };
          MetronomeAct = function (this: FxPgEqRuntimeValue) {
            metronome_btn.classList.add('pk_act');
          };
          q.app.listenFor('DidStartMetro', MetronomeAct);
          q.app.listenFor('DidStopMetro', MetronomeInAct);
          play_btn.onclick = function (this: FxPgEqRuntimeValue) {
            if (!trackReady()) return;
            if (trackPlaying()) {
              q.app.fireEvent('RequestStop');
            } else {
              q.app.fireEvent('RequestPlay');
            }
          };
          if (!trackReady()) {
            play_btn.className += ' pk_inact';
            both_btn.className += ' pk_inact';
          }
          if (trackPlaying()) {
            play_btn.className += ' pk_act';
            play_btn.innerText = 'Stop Track';
          }
          DidStopPlay = function (this: FxPgEqRuntimeValue) {
            play_btn.classList.remove('pk_act');
            play_btn.innerText = 'Play Track';
          };
          DidPlay = function (this: FxPgEqRuntimeValue) {
            play_btn.classList.add('pk_act');
            play_btn.innerText = 'Stop Track';
          };
          q.app.listenFor('DidStopPlay', DidStopPlay);
          q.app.listenFor('DidPlay', DidPlay);
          both_btn.onclick = function (this: FxPgEqRuntimeValue) {
            if (tick) metronome_btn.onclick();
            if (trackPlaying()) play_btn.onclick();
            setTimeout(function (this: FxPgEqRuntimeValue) {
              if (!tick && !trackPlaying()) {
                play_btn.onclick();
                setTimeout(function (this: FxPgEqRuntimeValue) {
                  metronome_btn.onclick();
                }, 0);
              }
            }, 66);
          };
        }
        function _metronome(this: FxPgEqRuntimeValue, type?: FxPgEqRuntimeValue) {
          if (type === 1 && accentuate) {
            osc.frequency.value = 880.0;
          } else {
            osc.frequency.value = 440.0;
          }
          amp.gain.setValueAtTime(amp.gain.value, audioContext.currentTime);
          amp.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
          amp.gain.linearRampToValueAtTime(0.0, audioContext.currentTime + 0.12);
        }
        function _prepare(this: FxPgEqRuntimeValue) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          osc = audioContext.createOscillator();
          amp = audioContext.createGain();
          amp.gain.value = 0;
          osc.connect(amp);
          amp.connect(audioContext.destination);
          osc.start(0);
          ready = true;
          // osc.stop( time + 0.05 );
        }
      };
      var TempoTap: FxPgEqRuntimeValue = function (
        this: FxPgEqRuntimeValue,
        app?: FxPgEqRuntimeValue,
        modal?: FxPgEqRuntimeValue,
      ) {
        var q: FxPgEqRuntimeValue = this;
        q.app = app;
        var DidStopPlay: FxPgEqRuntimeValue = null;
        var DidPlay: FxPgEqRuntimeValue = null;
        var DidSetLoop: FxPgEqRuntimeValue = null;
        var DidAudioProcess: FxPgEqRuntimeValue = null;
        q.Init = function (this: FxPgEqRuntimeValue, container?: FxPgEqRuntimeValue) {
          var q: FxPgEqRuntimeValue = this;
          q.el = container;
          _make_ui(q);
          _make_evs(q);
        };
        q.Destroy = function (this: FxPgEqRuntimeValue) {
          q.app.stopListeningFor('DidStopPlay', DidStopPlay);
          q.app.stopListeningFor('DidPlay', DidPlay);
          q.app.stopListeningFor('DidSetLoop', DidSetLoop);
          q.app.stopListeningFor('DidAudioProcess', DidAudioProcess);
          DidStopPlay = null;
          DidPlay = null;
          DidSetLoop = null;
          DidAudioProcess = null;
          q.app.ui.KeyHandler.removeCallback('tmpTap');
          if (q.body) {
            q.body.parentNode.removeChild(q.body);
            q.body = null;
          }
          q.app = null;
        };
        function _make_ui(this: FxPgEqRuntimeValue, q?: FxPgEqRuntimeValue) {
          var el_drawer: FxPgEqRuntimeValue = d.createElement('div');
          el_drawer.className = 'pk_row';
          // Estimate tempo for selected area button
          el_drawer.innerHTML =
            '<div class="pk_row pk_pgeq_els">' +
            '<span>Average BPM</span>' +
            '<input style="margin-left:2px;min-width:64px;max-width:64px" ' +
            'type="text" class="pk_val pk_gain" value="-">' +
            '</div>' +
            '<div class="pk_row pk_pgeq_els">' +
            '<span>Nearest BPM</span>' +
            '<input style="margin-left:2px;min-width:64px;max-width:64px" ' +
            'type="text" class="pk_val pk_gain" value="-">' +
            '</div>' +
            '<div class="pk_row pk_pgeq_els">' +
            '<span>Timing Taps</span>' +
            '<input style="margin-left:2px;min-width:64px;max-width:64px" ' +
            'type="text" class="pk_val pk_gain" value="-">' +
            '<a class="pk_modal_a_bottom" style="display:inline-block;float:none">Reset</a>' +
            '<a class="pk_modal_a_bottom" style="display:inline-block;float:none">Play Track</a>' +
            '<a class="pk_modal_a_bottom" style="display:inline-block;float:none">Loop</a>' +
            '</div>' +
            '<div><div id="pk_tmp_tap">' +
            '<span style="opacity:0" class="pk_obj2">CLEARED...</span>' +
            '<span class="pk_obj2">STAND BY...</span>' +
            '</div>' +
            '<div id="pk_tmp_tap2" style="position:relative">' +
            '<canvas width="1000" height="200" style="image-rendering:pixelated;width:500px;height:100px;display:block;background:#000"></canvas>' +
            '<span style="z-index:3;background:red;position:absolute;display:block;width:2px;height:100px;' +
            'left:50%;margin-left:-1px;top:0"></span>' +
            '</div></div>' +
            '<div id="pk_tmp_tap3">' +
            '<span style="position:absolute;top:50%;display:block;width:80%;left:10%;font-size:12px;' +
            'margin-top:-20px;user-select:none;text-align:center;pointer-events:none;color:#ccc">' +
            'Tap in this area, or hit [SPACE] rhythmically, to measure BPM.' +
            '</span>' +
            '</div>';
          q.body = el_drawer;
          q.el.appendChild(el_drawer);
        }
        function _make_evs(this: FxPgEqRuntimeValue, q?: FxPgEqRuntimeValue) {
          var tap_graph: FxPgEqRuntimeValue = q.body.querySelectorAll('#pk_tmp_tap')[0];
          var tap_area: FxPgEqRuntimeValue = q.body.querySelectorAll('#pk_tmp_tap3')[0];
          var reset_btn: FxPgEqRuntimeValue = q.body.getElementsByClassName('pk_modal_a_bottom')[0];
          var play_btn: FxPgEqRuntimeValue = q.body.getElementsByClassName('pk_modal_a_bottom')[1];
          var loop_btn: FxPgEqRuntimeValue = q.body.getElementsByClassName('pk_modal_a_bottom')[2];
          var canvas: FxPgEqRuntimeValue = q.body.getElementsByTagName('canvas')[0];
          var ctx: FxPgEqRuntimeValue = canvas.getContext('2d', { alpha: false, antialias: false });
          var tempCanvas: FxPgEqRuntimeValue = document.createElement('canvas');
          tempCanvas.width = 500 * 2;
          tempCanvas.height = 100 * 2;
          var tempCtx: FxPgEqRuntimeValue = tempCanvas.getContext('2d', {
            alpha: false,
            antialias: false,
          });
          ctx.imageSmoothingEnabled = true;
          tempCtx.imageSmoothingEnabled = true;
          var value_els: FxPgEqRuntimeValue = q.body.getElementsByClassName('pk_val');
          var tap_msg: FxPgEqRuntimeValue = tap_graph.getElementsByClassName('pk_obj2');
          var tap_msg2: FxPgEqRuntimeValue = tap_area.getElementsByTagName('span')[0];
          var bpm_el: FxPgEqRuntimeValue = value_els[0];
          var bpm_el_round: FxPgEqRuntimeValue = value_els[1];
          var bpm_el_count: FxPgEqRuntimeValue = value_els[2];
          var reset_wait: FxPgEqRuntimeValue = 3000;
          var time_msec: FxPgEqRuntimeValue = 0;
          var time_msec_prev: FxPgEqRuntimeValue = 0;
          var time_msec_first: FxPgEqRuntimeValue = 0;
          var count: FxPgEqRuntimeValue = 0;
          var bpm: FxPgEqRuntimeValue = 0;
          var steps_count: FxPgEqRuntimeValue = 0;
          var first: FxPgEqRuntimeValue = true;
          var is_playing: FxPgEqRuntimeValue = false;
          var _reset_count: FxPgEqRuntimeValue = function (
            this: FxPgEqRuntimeValue,
            force?: FxPgEqRuntimeValue,
          ) {
            if (first) {
              tap_msg[1].style.opacity = '0';
            }
            count = 0;
            steps_count = 0;
            first = true;
            setTimeout(
              function (this: FxPgEqRuntimeValue) {
                if (!first) return;
                tap_msg[0].style.opacity = '0.5';
                if (!force) {
                  reset_btn.className += ' pk_act';
                  setTimeout(function (this: FxPgEqRuntimeValue) {
                    reset_btn.classList.remove('pk_act');
                  }, 140);
                }
                setTimeout(
                  function (this: FxPgEqRuntimeValue) {
                    if (first) {
                      tap_msg[0].style.opacity = '0';
                      tap_msg[1].style.opacity = '0.5';
                    } else {
                      tap_msg[0].style.opacity = '0';
                      tap_msg[1].style.opacity = '0';
                    }
                  },
                  force ? 490 : 874,
                );
              },
              force ? 0 : 150,
            );
            if (force) {
              bpm_el.value = '-';
              bpm_el_round.value = '-';
              bpm_el_count.value = '-';
              var els: FxPgEqRuntimeValue = tap_graph.parentNode.getElementsByClassName('pk_obj');
              var l: FxPgEqRuntimeValue = els.length;
              while (l-- > 0) {
                if (els[l]) {
                  els[l].parentNode.removeChild(els[l]);
                }
              }
            }
          };
          reset_btn.onclick = function (this: FxPgEqRuntimeValue) {
            _reset_count(true);
          };
          play_btn.onclick = function (this: FxPgEqRuntimeValue) {
            if (PKAudioEditor.engine.wavesurfer.isPlaying()) {
              q.app.fireEvent('RequestStop');
            } else {
              q.app.fireEvent('RequestPlay');
            }
          };
          if (!PKAudioEditor.engine.wavesurfer.isReady) {
            play_btn.className += ' pk_inact';
            loop_btn.className += ' pk_inact';
          }
          if (PKAudioEditor.engine.wavesurfer.isPlaying()) {
            play_btn.className += ' pk_act';
          }
          DidStopPlay = function (this: FxPgEqRuntimeValue) {
            is_playing = false;
            play_btn.classList.remove('pk_act');
            play_btn.innerText = 'Play Track';
          };
          DidPlay = function (this: FxPgEqRuntimeValue) {
            is_playing = true;
            play_btn.classList.add('pk_act');
            play_btn.innerText = 'Stop Track';
          };
          q.app.listenFor('DidStopPlay', DidStopPlay);
          q.app.listenFor('DidPlay', DidPlay);
          var old_left_time: FxPgEqRuntimeValue = -999999;
          var old_right_time: FxPgEqRuntimeValue = -999999;
          var peaks: FxPgEqRuntimeValue = [];
          var skipp: FxPgEqRuntimeValue = false;
          var remaining: FxPgEqRuntimeValue = 0;
          DidAudioProcess = function (this: FxPgEqRuntimeValue) {
            //if (skipp) {
            //	skipp = false;
            //	return ;
            //}
            //skipp = true;
            var wv: FxPgEqRuntimeValue = PKAudioEditor.engine.wavesurfer;
            var buffer: FxPgEqRuntimeValue = wv.backend.buffer;
            var chan_data: FxPgEqRuntimeValue = buffer.getChannelData(0);
            var sample_rate: FxPgEqRuntimeValue = buffer.sampleRate;
            var curr_time: FxPgEqRuntimeValue = wv.getCurrentTime();
            var width: FxPgEqRuntimeValue = 500;
            var height: FxPgEqRuntimeValue = 100;
            var half_height: FxPgEqRuntimeValue = (height / 2) * 2;
            var new_width: FxPgEqRuntimeValue = width;
            var cached_index: FxPgEqRuntimeValue = 0;
            var pixels: FxPgEqRuntimeValue = 0;
            var raw_pixels: FxPgEqRuntimeValue = 0;
            var limit: FxPgEqRuntimeValue = 3;
            var left_time: FxPgEqRuntimeValue = curr_time - limit / 2;
            var right_time: FxPgEqRuntimeValue = curr_time + limit / 2;
            var quick_render: FxPgEqRuntimeValue = false;
            var start_offset: FxPgEqRuntimeValue = (left_time * sample_rate) >> 0;
            var end_offset: FxPgEqRuntimeValue = ((left_time + limit) * sample_rate) >> 0;
            var length: FxPgEqRuntimeValue = end_offset - start_offset;
            var mod: FxPgEqRuntimeValue = (length / width) >> 0;
            if (left_time < old_right_time) {
              // find pixels
              var diff: FxPgEqRuntimeValue = right_time - old_right_time;
              // pixels = Math.round ( (diff / limit) * width);
              raw_pixels = (diff / limit) * width;
              pixels = Math.round(raw_pixels);
              raw_pixels = ((raw_pixels * 1000) >> 0) / 1000;
              if (pixels >= 0) {
                if (pixels === 0) return;
                new_width = pixels;
                start_offset = (old_right_time * sample_rate) >> 0;
                end_offset = (right_time * sample_rate) >> 0;
                length = end_offset - start_offset;
                mod = (length / pixels) >> 0;
                peaks = peaks.slice(pixels * 2);
                cached_index = width - pixels;
                quick_render = true;
              }
            }
            old_right_time = right_time;
            var max: FxPgEqRuntimeValue = 0;
            var min: FxPgEqRuntimeValue = 0;
            for (var i: FxPgEqRuntimeValue = 0; i < new_width; ++i) {
              var new_offset: FxPgEqRuntimeValue = start_offset + mod * i;
              max = 0;
              min = 0;
              if (new_offset >= 0) {
                for (var j: FxPgEqRuntimeValue = 0; j < mod; j += 3) {
                  if (chan_data[new_offset + j] > max) {
                    max = chan_data[new_offset + j];
                  } else if (chan_data[new_offset + j] < min) {
                    min = chan_data[new_offset + j];
                  }
                }
              }
              peaks[2 * (i + cached_index)] = max;
              peaks[2 * (i + cached_index) + 1] = min;
            }
            if (quick_render) {
              // var imgdata = ctx.getImageData(0, 0, width, height);
              // tempCtx.putImageData (imgdata, 0, 0);
              tempCtx.drawImage(canvas, 0, 0); //, width, height, 0, 0, width, height);
            }
            ctx.fillStyle = '#000';
            // ctx.clearRect( 0, 0, width, height );
            ctx.fillRect(0, 0, width * 2, height * 2);
            ctx.fillStyle = '#99c2c6';
            if (quick_render) {
              var forward: FxPgEqRuntimeValue = Math.round(raw_pixels * 2);
              remaining += forward - raw_pixels * 2;
              if (remaining > 1) {
                forward -= 1;
                remaining = 0;
              }
              // ctx.translate(-1.5, 0);
              ctx.translate(-forward, 0);
              ctx.drawImage(tempCanvas, 0, 0); //, width, height, 0, 0, width, height);
              ctx.setTransform(1, 0, 0, 1, 0, 0);
              //						ctx.drawImage (tempCanvas, 0, 0, width, 100, -(raw_pixels.toFixed(1)/1), 0, width, 100);
              ctx.beginPath();
              var peak: FxPgEqRuntimeValue = peaks[(width - pixels - 2) * 2];
              var _h: FxPgEqRuntimeValue = Math.round(peak * half_height);
              ctx.moveTo((width - pixels - 2) * 2, half_height - _h);
              for (var i: FxPgEqRuntimeValue = width - pixels - 1; i < width; ++i) {
                peak = peaks[i * 2];
                _h = Math.round(peak * half_height);
                ctx.lineTo(i * 2, half_height - _h);
              }
              for (var i: FxPgEqRuntimeValue = width - 1; i >= width - pixels - 1; --i) {
                var peak: FxPgEqRuntimeValue = peaks[i * 2 + 1];
                var _h: FxPgEqRuntimeValue = Math.round(peak * half_height);
                ctx.lineTo(i * 2, half_height - _h);
              }
              ctx.closePath();
              ctx.fill();
            } else {
              ctx.beginPath();
              ctx.moveTo(0, half_height);
              for (var i: FxPgEqRuntimeValue = 0; i < width; ++i) {
                var peak: FxPgEqRuntimeValue = peaks[i * 2];
                var _h: FxPgEqRuntimeValue = Math.round(peak * half_height);
                ctx.lineTo(i * 2, half_height - _h);
              }
              for (var i: FxPgEqRuntimeValue = width - 1; i >= 0; --i) {
                var peak: FxPgEqRuntimeValue = peaks[i * 2 + 1];
                var _h: FxPgEqRuntimeValue = Math.round(peak * half_height);
                ctx.lineTo(i * 2, half_height - _h);
              }
              ctx.closePath();
              ctx.fill();
            }
            //console.log( peaks );
          };
          q.app.listenFor('DidAudioProcess', DidAudioProcess);
          if (PKAudioEditor.engine.wavesurfer.regions.list[0]) {
            if (PKAudioEditor.engine.wavesurfer.regions.list[0].loop)
              loop_btn.className += ' pk_act';
          }
          loop_btn.onclick = function (this: FxPgEqRuntimeValue) {
            q.app.fireEvent('RequestSetLoop');
          };
          DidSetLoop = function (this: FxPgEqRuntimeValue, val?: FxPgEqRuntimeValue) {
            val ? loop_btn.classList.add('pk_act') : loop_btn.classList.remove('pk_act');
          };
          q.app.listenFor('DidSetLoop', DidSetLoop);
          tap_graph.parentNode.addEventListener(
            'transitionend',
            function (this: FxPgEqRuntimeValue, e?: FxPgEqRuntimeValue) {
              if (!tap_graph) return;
              var el: FxPgEqRuntimeValue = e.target;
              if (el.tagName !== 'DIV') return;
              el.parentNode.removeChild(el);
              --steps_count;
              if (steps_count === 0) {
                if (is_playing)
                  setTimeout(function (this: FxPgEqRuntimeValue) {
                    if (steps_count === 0) _reset_count();
                  }, 1100);
                else _reset_count();
              }
            },
          );
          tap_area.onclick = function (this: FxPgEqRuntimeValue, ev?: FxPgEqRuntimeValue) {
            if (ev) {
              ev.preventDefault();
              ev.stopPropagation();
            }
            if (first) {
              first = false;
              tap_msg[1].style.opacity = '0';
            }
            time_msec = Date.now();
            if (time_msec - time_msec_prev > reset_wait) {
              count = 0;
            }
            if (count === 0) {
              time_msec_first = time_msec;
              count = 1;
              bpm_el.value = 'First Beat';
              bpm_el_round.value = 'First Beat';
              bpm_el_count.value = count;
            } else {
              bpm = (60000 * count) / (time_msec - time_msec_first);
              ++count;
              bpm_el.value = Math.round(bpm * 100) / 100;
              bpm_el_round.value = Math.round(bpm);
              bpm_el_count.value = count;
            }
            var step: FxPgEqRuntimeValue = document.createElement('div');
            step.className = 'pk_obj';
            if (is_playing) {
              canvas.parentNode.appendChild(step);
            } else {
              tap_graph.appendChild(step);
            }
            ++steps_count;
            tap_area.classList.add('pk_act');
            requestAnimationFrame(function (this: FxPgEqRuntimeValue) {
              step.style.transform = 'translate3d(-10%,0,0)';
              setTimeout(function (this: FxPgEqRuntimeValue) {
                tap_area.classList.remove('pk_act');
              }, 56);
            });
            time_msec_prev = time_msec;
          };
          app.ui.KeyHandler.addCallback(
            'tmpTap',
            function (
              this: FxPgEqRuntimeValue,
              e?: FxPgEqRuntimeValue,
              o?: FxPgEqRuntimeValue,
              ev?: FxPgEqRuntimeValue,
            ) {
              if (!app.ui.InteractionHandler.check(modal_name)) return;
              ev.preventDefault();
              ev.stopPropagation();
              tap_area.onclick(null);
            },
            [32],
          );
          // ---
        }
      };
      // events
      var TempoEstimation: FxPgEqRuntimeValue = function (
        this: FxPgEqRuntimeValue,
        app?: FxPgEqRuntimeValue,
        modal?: FxPgEqRuntimeValue,
      ) {
        var q: FxPgEqRuntimeValue = this;
        q.app = app;
        q.Init = function (this: FxPgEqRuntimeValue, container?: FxPgEqRuntimeValue) {
          var q: FxPgEqRuntimeValue = this;
          q.el = container;
          _make_ui(q);
          _make_evs(q);
        };
        q.Destroy = function (this: FxPgEqRuntimeValue) {
          if (q.worker) {
            q.worker.terminate();
            q.worker = null;
          }
          if (q.body) {
            q.body.parentNode.removeChild(q.body);
            q.body = null;
          }
          q.app = null;
        };
        q.Est = function (this: FxPgEqRuntimeValue) {
          var q: FxPgEqRuntimeValue = this;
          var status: FxPgEqRuntimeValue = q.body.getElementsByClassName('pk_tmp_est_status')[0];
          var vals: FxPgEqRuntimeValue = q.body.getElementsByClassName('pk_val');
          var sel: FxPgEqRuntimeValue = q.body.querySelector('input[value="sel"]').checked;
          var buffer: FxPgEqRuntimeValue = getBuffer(q, sel);
          var job: FxPgEqRuntimeValue = (q.job_id || 0) + 1;
          if (!buffer) return;
          q.job_id = job;
          setBusy(q, true);
          status.innerHTML = 'Preparing audio for background analysis...';
          runEstimator(
            q,
            buffer,
            job,
            function (this: FxPgEqRuntimeValue, ret?: FxPgEqRuntimeValue) {
              if (q.job_id !== job) return;
              vals[0].value = ret.bpm;
              vals[1].value = ret.tempo.toFixed(1);
              vals[2].value = ret.beats;
              vals[3].value = ret.confidence + '%';
              status.innerHTML = 'Estimated ' + ret.beats + ' beats over ' + ret.duration + 's.';
              setBusy(q, false);
            },
            function (this: FxPgEqRuntimeValue, msg?: FxPgEqRuntimeValue) {
              if (q.job_id !== job) return;
              status.innerHTML = msg;
              setBusy(q, false);
            },
          );
        };
        function loadEstimator(
          this: FxPgEqRuntimeValue,
          q?: FxPgEqRuntimeValue,
          ok?: FxPgEqRuntimeValue,
          fail?: FxPgEqRuntimeValue,
        ) {
          if (w.PKTempoEstimator) {
            ok();
            return;
          }
          q.app.loadScript('tempo-estimator.js?v=mt3', ok, fail);
        }
        function setBusy(
          this: FxPgEqRuntimeValue,
          q?: FxPgEqRuntimeValue,
          on?: FxPgEqRuntimeValue,
        ) {
          var btn: FxPgEqRuntimeValue = q.body && q.body.getElementsByTagName('a')[0];
          q.busy = !!on;
          if (!btn) return;
          btn.innerHTML = on ? 'Working...' : 'Estimate';
          btn.style.opacity = on ? '0.55' : '';
        }
        function packBuffer(this: FxPgEqRuntimeValue, buffer?: FxPgEqRuntimeValue) {
          var channels: FxPgEqRuntimeValue = [];
          var transfer: FxPgEqRuntimeValue = [];
          var total: FxPgEqRuntimeValue = Math.max(1, Math.min(2, buffer.numberOfChannels || 1));
          for (var i: FxPgEqRuntimeValue = 0; i < total; ++i) {
            var src: FxPgEqRuntimeValue = buffer.getChannelData(i);
            var copy: FxPgEqRuntimeValue = new Float32Array(src.length);
            copy.set(src);
            channels.push(copy);
            transfer.push(copy.buffer);
          }
          return {
            data: {
              sampleRate: buffer.sampleRate,
              length: buffer.length,
              channels: channels,
            },
            transfer: transfer,
          };
        }
        function runMainEstimator(
          this: FxPgEqRuntimeValue,
          q?: FxPgEqRuntimeValue,
          buffer?: FxPgEqRuntimeValue,
          job?: FxPgEqRuntimeValue,
          ok?: FxPgEqRuntimeValue,
          fail?: FxPgEqRuntimeValue,
          msg?: FxPgEqRuntimeValue,
        ) {
          var status: FxPgEqRuntimeValue = q.body.getElementsByClassName('pk_tmp_est_status')[0];
          status.innerHTML = msg || 'Loading tempo detector...';
          loadEstimator(
            q,
            function (this: FxPgEqRuntimeValue) {
              if (q.job_id !== job) return;
              status.innerHTML = 'Analyzing audio. This can take a while on long files.';
              w.PKTempoEstimator.estimate(buffer)
                .then(ok)
                .catch(function (this: FxPgEqRuntimeValue, e?: FxPgEqRuntimeValue) {
                  fail(e && e.message ? e.message : 'Could not estimate tempo.');
                });
            },
            function (this: FxPgEqRuntimeValue) {
              fail('Could not load tempo detector.');
            },
          );
        }
        function runEstimator(
          this: FxPgEqRuntimeValue,
          q?: FxPgEqRuntimeValue,
          buffer?: FxPgEqRuntimeValue,
          job?: FxPgEqRuntimeValue,
          ok?: FxPgEqRuntimeValue,
          fail?: FxPgEqRuntimeValue,
        ) {
          if (!w.Worker) {
            runMainEstimator(q, buffer, job, ok, fail);
            return;
          }
          setTimeout(function (this: FxPgEqRuntimeValue) {
            var payload: FxPgEqRuntimeValue = null;
            if (q.job_id !== job) return;
            try {
              payload = packBuffer(buffer);
            } catch (e: FxPgEqRuntimeValue) {
              fail('Could not prepare audio for tempo analysis.');
              return;
            }
            try {
              if (q.worker) q.worker.terminate();
              q.worker = new Worker('tempo-worker.js?v=mt2');
            } catch (e2: FxPgEqRuntimeValue) {
              runMainEstimator(q, buffer, job, ok, fail, 'Worker unavailable; analyzing here...');
              return;
            }
            q.worker.onmessage = function (this: FxPgEqRuntimeValue, ev?: FxPgEqRuntimeValue) {
              var data: FxPgEqRuntimeValue = ev.data || {};
              if (data.id !== job) return;
              q.worker.terminate();
              q.worker = null;
              if (data.error) fail(data.error);
              else ok(data.result);
            };
            q.worker.onerror = function (this: FxPgEqRuntimeValue) {
              if (q.worker) q.worker.terminate();
              q.worker = null;
              runMainEstimator(q, buffer, job, ok, fail, 'Worker unavailable; analyzing here...');
            };
            q.body.getElementsByClassName('pk_tmp_est_status')[0].innerHTML =
              'Analyzing audio in the background. This can take a while.';
            try {
              q.worker.postMessage(
                {
                  type: 'estimate',
                  id: job,
                  buffer: payload.data,
                },
                payload.transfer,
              );
            } catch (e3: FxPgEqRuntimeValue) {
              try {
                q.worker.postMessage({
                  type: 'estimate',
                  id: job,
                  buffer: payload.data,
                });
              } catch (e4: FxPgEqRuntimeValue) {
                q.worker.terminate();
                q.worker = null;
                fail('Could not start tempo analysis.');
              }
            }
          }, 20);
        }
        function getBuffer(
          this: FxPgEqRuntimeValue,
          q?: FxPgEqRuntimeValue,
          sel?: FxPgEqRuntimeValue,
        ) {
          var mt: FxPgEqRuntimeValue = q.app.multitrack;
          var mt_on: FxPgEqRuntimeValue = mt && mt.IsOn && mt.IsOn();
          var region: FxPgEqRuntimeValue = null;
          if (mt_on) {
            if (!mt.HasClips || !mt.HasClips()) {
              OneUp('Nothing to estimate', 1200);
              return null;
            }
            region = mt.GetRegion && mt.GetRegion();
            if (sel && !region) {
              OneUp('Make a selection first', 1200);
              return null;
            }
            if (mt.GetTempoBuffer) return mt.GetTempoBuffer(sel);
            return mt.Mixdown(sel && region ? [region.start, region.end] : false);
          }
          var wavesurfer: FxPgEqRuntimeValue = q.app.engine.wavesurfer;
          if (!wavesurfer.isReady || !wavesurfer.backend.buffer) {
            OneUp('Load audio first', 1200);
            return null;
          }
          if (sel) {
            var copy: FxPgEqRuntimeValue = q.app.engine.GetSel && q.app.engine.GetSel();
            if (!copy) OneUp('Make a selection first', 1200);
            return copy || null;
          }
          return wavesurfer.backend.buffer;
        }
        function _make_ui(this: FxPgEqRuntimeValue, q?: FxPgEqRuntimeValue) {
          var el_drawer: FxPgEqRuntimeValue = d.createElement('div');
          var mt: FxPgEqRuntimeValue = q.app.multitrack;
          var mt_on: FxPgEqRuntimeValue = mt && mt.IsOn && mt.IsOn();
          var whole_label: FxPgEqRuntimeValue = mt_on ? 'Selected Clip' : 'Whole track';
          var sel_label: FxPgEqRuntimeValue = mt_on ? 'Region Only' : 'Selection Only';
          el_drawer.className = 'pk_row';
          el_drawer.innerHTML =
            '<div class="pk_row">' +
            '<input type="radio" class="pk_check" id="tt4" name="xport" checked value="whole">' +
            '<label for="tt4">' +
            whole_label +
            '</label>' +
            '<input type="radio" class="pk_check" id="tt5" name="xport" value="sel">' +
            '<label class="pk_lblmp3" for="tt5">' +
            sel_label +
            '</label></div>' +
            '<div class="pk_row pk_pgeq_els">' +
            '<span>BPM</span>' +
            '<input style="margin-left:2px;min-width:64px;max-width:64px" ' +
            'type="text" class="pk_val pk_gain" value="-">' +
            '<span>Tempo</span>' +
            '<input style="margin-left:2px;min-width:64px;max-width:64px" ' +
            'type="text" class="pk_val pk_gain" value="-"></div>' +
            '<div class="pk_row pk_pgeq_els">' +
            '<span>Beats</span>' +
            '<input style="margin-left:2px;min-width:64px;max-width:64px" ' +
            'type="text" class="pk_val pk_gain" value="-">' +
            '<span>Confidence</span>' +
            '<input style="margin-left:2px;min-width:64px;max-width:64px" ' +
            'type="text" class="pk_val pk_gain" value="-"></div>' +
            '<div class="pk_row">' +
            '<a class="pk_modal_a_bottom pk_modal_a_accpt" style="margin:0;float:left">Estimate</a>' +
            '<span class="pk_tmp_est_status" style="display:block;margin-left:120px;line-height:32px;color:#aaa">Runs in the background when you click Estimate.</span>' +
            '</div>';
          q.body = el_drawer;
          q.el.appendChild(el_drawer);
        }
        function _make_evs(this: FxPgEqRuntimeValue, q?: FxPgEqRuntimeValue) {
          var btn_est: FxPgEqRuntimeValue = q.body.getElementsByTagName('a')[0];
          if (!btn_est) return;
          btn_est.onclick = function (this: FxPgEqRuntimeValue) {
            if (q.busy) return;
            q.Est && q.Est();
          };
        }
      };
      var x: FxPgEqRuntimeValue = new PKAudioFXModal(
        {
          id: filter_id,
          title: 'Tempo & Rhythm Tools',
          ondestroy: function (this: FxPgEqRuntimeValue, q?: FxPgEqRuntimeValue) {
            app.ui.InteractionHandler.on = false;
            app.ui.KeyHandler.removeCallback(modal_esc_key);
            act_tool.Destroy();
            act_tool = null;
            app.fireEvent('RequestStop');
          },
          body:
            '<div class="pk_tbs">' +
            '<a class="pk_tbsa">Tempo Estimation</a>' +
            '<a class="pk_tbsa">Tempo Tap</a>' +
            '<a class="pk_tbsa">Metronome</a></div>',
          //			buttons: [{
          //				title:'Apply EQ',
          //				clss:'pk_modal_a_accpt',
          //				callback: function( q ) {
          //					q.Destroy ();
          //				}
          //			}],
          setup: function (this: FxPgEqRuntimeValue, q?: FxPgEqRuntimeValue) {
            var toplinks: FxPgEqRuntimeValue = q.el_body.getElementsByClassName('pk_tbsa');
            var destroy: FxPgEqRuntimeValue = function (this: FxPgEqRuntimeValue) {
              if (act_tool) {
                act_tool.Destroy();
                act_tool = null;
                toplinks[act_index].classList.remove('pk_act');
              }
            };
            var activate: FxPgEqRuntimeValue = function (this: FxPgEqRuntimeValue) {
              // get the active state
              if (act_index === 0) {
                toplinks[0].className += ' pk_act';
                act_tool = new TempoEstimation(app, q);
              } else if (act_index === 1) {
                toplinks[1].className += ' pk_act';
                act_tool = new TempoTap(app, q);
              } else if (act_index === 2) {
                toplinks[2].className += ' pk_act';
                act_tool = new TempoMetro(app, q);
              }
              act_tool && act_tool.Init(q.el_body);
            };
            toplinks[0].onclick = function (this: FxPgEqRuntimeValue) {
              if (act_index === 0) return;
              destroy();
              act_index = 0;
              activate();
            };
            toplinks[1].onclick = function (this: FxPgEqRuntimeValue) {
              if (act_index === 1) return;
              destroy();
              act_index = 1;
              activate();
            };
            toplinks[2].onclick = function (this: FxPgEqRuntimeValue) {
              if (act_index === 2) return;
              destroy();
              act_index = 2;
              activate();
            };
            activate();
            // ---
            app.fireEvent('RequestPause');
            app.ui.InteractionHandler.checkAndSet(modal_name);
            app.ui.KeyHandler.addCallback(
              modal_esc_key,
              function (this: FxPgEqRuntimeValue, e?: FxPgEqRuntimeValue) {
                if (!app.ui.InteractionHandler.check(modal_name)) return;
                q.Destroy();
              },
              [27],
            );
          },
        },
        app,
      );
      x.Show();
      // ------
    };
    PKAudioEditor._deps.FxTMP = TempoToolsModal;
    ///////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////
    var RecModal: FxPgEqRuntimeValue = function (
      this: FxPgEqRuntimeValue,
      app?: FxPgEqRuntimeValue,
    ) {
      var filter_id: FxPgEqRuntimeValue = 'rec_tools';
      var audio_stream: FxPgEqRuntimeValue = null;
      var audio_context: FxPgEqRuntimeValue = null;
      var script_processor: FxPgEqRuntimeValue = null;
      var media_stream_source: FxPgEqRuntimeValue = null;
      var temp_buffers: FxPgEqRuntimeValue = [];
      var newbuff: FxPgEqRuntimeValue = null;
      var sample_rate: FxPgEqRuntimeValue = 44100;
      var buffer_size: FxPgEqRuntimeValue = 2048; // * 2 ?
      var channel_num: FxPgEqRuntimeValue = 1;
      var channel_num_out: FxPgEqRuntimeValue = 1;
      var stop_audio: FxPgEqRuntimeValue = function (this: FxPgEqRuntimeValue) {
        if (!audio_stream) return;
        audio_stream.getTracks().forEach(function (
          this: FxPgEqRuntimeValue,
          stream?: FxPgEqRuntimeValue,
        ) {
          stream.stop();
        });
        if (script_processor) {
          script_processor.onaudioprocess = null;
        }
        media_stream_source && media_stream_source.disconnect();
        script_processor && script_processor.disconnect();
        media_stream_source = null;
        audio_stream = null;
        audio_context = null;
      };
      var x: FxPgEqRuntimeValue = new PKAudioFXModal(
        {
          id: filter_id,
          title: 'New Recording',
          ondestroy: function (this: FxPgEqRuntimeValue, q?: FxPgEqRuntimeValue) {
            // destroy audio...
            stop_audio();
            temp_buffers = [];
            newbuff = null;
            app.ui.InteractionHandler.on = false;
            app.ui.KeyHandler.removeCallback(modal_esc_key);
            app.fireEvent('RequestStop');
          },
          body:
            '<div class="pk_rec" style="user-select:none">' +
            '<div class="pk_row">' +
            '<label>Devices:</label>' +
            '<select style="max-width:220px"></select>' +
            '</div>' +
            '<div class="pk_row">' +
            '<div style="float:left"><label>Volume</label>' +
            '<canvas width="200" height="40"></canvas></div>' +
            '<div style="float:left;margin-left:20px;"><label>Time</label>' +
            '<span style="font-size: 24px;line-height: 50px;">0.0</span></div>' +
            '<div style="clear:both;height:10px"></div>' +
            '<div><label>Waveform</label><canvas width="1000" height="200" style="image-rendering:pixelated;width:500px;height:100px;display:block;background:#000"></canvas></div>' +
            '</div>' +
            '<div class="pk_row">' +
            '<a class="pk_tbsa pk_inact" style="text-align: center;">START RECORDING</a>' +
            '<a class="pk_tbsa pk_inact" style="margin-left: 24px; text-align: center;">PAUSE</a>' +
            '</div>' +
            '<div class="pk_row">' +
            '<a class="pk_tbsa" style="float:left;display:none;text-align:center;box-shadow:0 0 7px #3a6b79 inset;">OPEN RECORDING</a>' +
            '<a class="pk_tbsa" style="float:left;display:none;margin-left: 24px; text-align: center;">APPEND TO EXISTING</a>' +
            '</div>' +
            '</div>',
          //			buttons: [{
          //				title:'Apply EQ',
          //				clss:'pk_modal_a_accpt',
          //				callback: function( q ) {
          //					q.Destroy ();
          //				}
          //			}],
          setup: function (this: FxPgEqRuntimeValue, q?: FxPgEqRuntimeValue) {
            var is_ready: FxPgEqRuntimeValue = false;
            var is_active: FxPgEqRuntimeValue = false;
            var is_paused: FxPgEqRuntimeValue = false;
            var has_recorded: FxPgEqRuntimeValue = false;
            var mainbtns: FxPgEqRuntimeValue = q.el_body.getElementsByClassName('pk_tbsa');
            var btn_start: FxPgEqRuntimeValue = mainbtns[0];
            var btn_pause: FxPgEqRuntimeValue = mainbtns[1];
            var btn_open: FxPgEqRuntimeValue = mainbtns[2];
            var btn_add: FxPgEqRuntimeValue = mainbtns[3];
            var time_span: FxPgEqRuntimeValue = q.el_body.getElementsByTagName('span')[0];
            var devices_sel: FxPgEqRuntimeValue = q.el_body.getElementsByTagName('select')[0];
            var devices: FxPgEqRuntimeValue = [];
            var volcanvas: FxPgEqRuntimeValue = q.el_body.getElementsByTagName('canvas')[0];
            var volctx: FxPgEqRuntimeValue = volcanvas.getContext('2d', {
              alpha: false,
              antialias: false,
            });
            var freqcanvas: FxPgEqRuntimeValue = q.el_body.getElementsByTagName('canvas')[1];
            var freqctx: FxPgEqRuntimeValue = freqcanvas.getContext('2d', {
              alpha: false,
              antialias: false,
            });
            var tempCanvas: FxPgEqRuntimeValue = document.createElement('canvas');
            tempCanvas.width = 500 * 2;
            tempCanvas.height = 100 * 2;
            var tempCtx: FxPgEqRuntimeValue = tempCanvas.getContext('2d', {
              alpha: false,
              antialias: false,
            });
            var first_skip: FxPgEqRuntimeValue = 12;
            var curr_offset: FxPgEqRuntimeValue = 0;
            var temp_buffer_index: FxPgEqRuntimeValue = -1;
            var volume: FxPgEqRuntimeValue = 0;
            var currtime: FxPgEqRuntimeValue = 0;
            var has_devices: FxPgEqRuntimeValue = false;
            var old_left_time: FxPgEqRuntimeValue = -999999;
            var old_right_time: FxPgEqRuntimeValue = -999999;
            var peaks: FxPgEqRuntimeValue = [];
            var skipp: FxPgEqRuntimeValue = false;
            var remaining: FxPgEqRuntimeValue = 0;
            var debounce: FxPgEqRuntimeValue = false;
            var showEditor: FxPgEqRuntimeValue = function (this: FxPgEqRuntimeValue) {
              app.fireEvent('RequestOriginalEditor');
            };
            temp_buffers = [];
            newbuff = null;
            var draw_volume: FxPgEqRuntimeValue = function (this: FxPgEqRuntimeValue) {
              volctx.fillStyle = '#000';
              volctx.fillRect(0, 0, 200, 40);
              if (!is_active) {
                return;
              }
              volctx.fillStyle = 'green';
              volctx.fillRect(0, 0, volume * 200 * 1.67, 40);
              time_span.innerText = ((currtime * 10) >> 0) / 10;
              window.requestAnimationFrame(draw_volume);
            };
            var fetchBufferFunction: FxPgEqRuntimeValue = function (
              this: FxPgEqRuntimeValue,
              ev?: FxPgEqRuntimeValue,
            ) {
              if (first_skip > 0) {
                --first_skip;
                return;
              }
              if (is_paused) {
                return;
              }
              curr_offset += ev.inputBuffer.duration * sample_rate;
              var float_array: FxPgEqRuntimeValue = ev.inputBuffer.getChannelData(0).slice(0);
              temp_buffers[++temp_buffer_index] = float_array;
              var sum: FxPgEqRuntimeValue = 0;
              var x: FxPgEqRuntimeValue;
              for (var i: FxPgEqRuntimeValue = 0; i < buffer_size; i += 2) {
                x = float_array[i];
                sum += x * x;
              }
              var rms: FxPgEqRuntimeValue = Math.sqrt(sum / (buffer_size / 2));
              volume = Math.max(rms, volume * 0.9);
              var curr_time: FxPgEqRuntimeValue = (temp_buffer_index * buffer_size) / sample_rate;
              currtime = curr_time;
              var width: FxPgEqRuntimeValue = 500;
              var height: FxPgEqRuntimeValue = 100;
              var half_height: FxPgEqRuntimeValue = (height / 2) * 2;
              var new_width: FxPgEqRuntimeValue = width;
              var cached_index: FxPgEqRuntimeValue = 0;
              var pixels: FxPgEqRuntimeValue = 0;
              var raw_pixels: FxPgEqRuntimeValue = 0;
              var limit: FxPgEqRuntimeValue = 3;
              var left_time: FxPgEqRuntimeValue = curr_time - limit;
              var right_time: FxPgEqRuntimeValue = curr_time; // + (limit/2);
              var quick_render: FxPgEqRuntimeValue = false;
              var start_offset: FxPgEqRuntimeValue = (left_time * sample_rate) >> 0;
              var end_offset: FxPgEqRuntimeValue = ((left_time + limit) * sample_rate) >> 0;
              var length: FxPgEqRuntimeValue = end_offset - start_offset;
              var mod: FxPgEqRuntimeValue = (length / width) >> 0;
              if (left_time < old_right_time) {
                // find pixels
                var diff: FxPgEqRuntimeValue = right_time - old_right_time;
                // pixels = Math.round ( (diff / limit) * width);
                raw_pixels = (diff / limit) * width;
                pixels = Math.round(raw_pixels);
                raw_pixels = ((raw_pixels * 1000) >> 0) / 1000;
                if (pixels >= 0) {
                  if (pixels === 0) return;
                  new_width = pixels;
                  start_offset = (old_right_time * sample_rate) >> 0;
                  end_offset = (right_time * sample_rate) >> 0;
                  length = end_offset - start_offset;
                  mod = (length / pixels) >> 0;
                  peaks = peaks.slice(pixels * 2);
                  cached_index = width - pixels;
                  quick_render = true;
                }
              }
              old_right_time = right_time;
              var max: FxPgEqRuntimeValue = 0;
              var min: FxPgEqRuntimeValue = 0;
              for (var i: FxPgEqRuntimeValue = 0; i < new_width; ++i) {
                var new_offset: FxPgEqRuntimeValue = start_offset + mod * i;
                max = 0;
                min = 0;
                if (new_offset >= 0) {
                  for (var j: FxPgEqRuntimeValue = 0; j < mod; j += 3) {
                    var temp: FxPgEqRuntimeValue = new_offset + j;
                    var temp2: FxPgEqRuntimeValue = (temp / 2048) >> 0;
                    var temp3: FxPgEqRuntimeValue = temp % 2048;
                    if (!temp_buffers[temp2]) continue;
                    if (temp_buffers[temp2][temp3] > max) {
                      max = temp_buffers[temp2][temp3];
                    } else if (temp_buffers[temp2][temp3] < min) {
                      min = temp_buffers[temp2][temp3];
                    }
                  }
                }
                peaks[2 * (i + cached_index)] = max;
                peaks[2 * (i + cached_index) + 1] = min;
              }
              if (quick_render) {
                // var imgdata = ctx.getImageData(0, 0, width, height);
                // tempCtx.putImageData (imgdata, 0, 0);
                tempCtx.drawImage(freqcanvas, 0, 0); //, width, height, 0, 0, width, height);
              }
              freqctx.fillStyle = '#000';
              // freqctx.clearRect( 0, 0, width, height );
              freqctx.fillRect(0, 0, width * 2, height * 2);
              freqctx.fillStyle = '#99c2c6';
              if (quick_render) {
                var forward: FxPgEqRuntimeValue = Math.round(raw_pixels * 2);
                remaining += forward - raw_pixels * 2;
                if (remaining > 1) {
                  forward -= 1;
                  remaining = 0;
                }
                // freqctx.translate(-1.5, 0);
                freqctx.translate(-forward, 0);
                freqctx.drawImage(tempCanvas, 0, 0); //, width, height, 0, 0, width, height);
                freqctx.setTransform(1, 0, 0, 1, 0, 0);
                //						freqctx.drawImage (tempCanvas, 0, 0, width, 100, -(raw_pixels.toFixed(1)/1), 0, width, 100);
                freqctx.beginPath();
                var peak: FxPgEqRuntimeValue = peaks[(width - pixels - 2) * 2];
                var _h: FxPgEqRuntimeValue = Math.round(peak * half_height);
                freqctx.moveTo((width - pixels - 2) * 2, half_height - _h);
                for (var i: FxPgEqRuntimeValue = width - pixels - 1; i < width; ++i) {
                  peak = peaks[i * 2];
                  _h = Math.round(peak * half_height);
                  freqctx.lineTo(i * 2, half_height - _h);
                }
                for (var i: FxPgEqRuntimeValue = width - 1; i >= width - pixels - 1; --i) {
                  var peak: FxPgEqRuntimeValue = peaks[i * 2 + 1];
                  var _h: FxPgEqRuntimeValue = Math.round(peak * half_height);
                  freqctx.lineTo(i * 2, half_height - _h);
                }
                freqctx.closePath();
                freqctx.fill();
              } else {
                freqctx.beginPath();
                freqctx.moveTo(0, half_height);
                for (var i: FxPgEqRuntimeValue = 0; i < width; ++i) {
                  var peak: FxPgEqRuntimeValue = peaks[i * 2];
                  var _h: FxPgEqRuntimeValue = Math.round(peak * half_height);
                  freqctx.lineTo(i * 2, half_height - _h);
                }
                for (var i: FxPgEqRuntimeValue = width - 1; i >= 0; --i) {
                  var peak: FxPgEqRuntimeValue = peaks[i * 2 + 1];
                  var _h: FxPgEqRuntimeValue = Math.round(peak * half_height);
                  freqctx.lineTo(i * 2, half_height - _h);
                }
                freqctx.closePath();
                freqctx.fill();
              }
            };
            navigator.mediaDevices
              .getUserMedia({ audio: true, video: false })
              .then(function (this: FxPgEqRuntimeValue, _stream?: FxPgEqRuntimeValue) {
                _stream.getTracks().forEach(function (
                  this: FxPgEqRuntimeValue,
                  stream?: FxPgEqRuntimeValue,
                ) {
                  stream.stop();
                });
                enumerate();
              })
              .catch(function (this: FxPgEqRuntimeValue, error?: FxPgEqRuntimeValue) {
                alert('no microphone permissions found!');
              });
            var enumerate: FxPgEqRuntimeValue = function (this: FxPgEqRuntimeValue) {
              if (navigator.mediaDevices.enumerateDevices) {
                navigator.mediaDevices.enumerateDevices().then((devices?: FxPgEqRuntimeValue) => {
                  devices = devices.filter((d?: FxPgEqRuntimeValue) => d.kind === 'audioinput');
                  has_devices = true;
                  var len: FxPgEqRuntimeValue = devices.length;
                  for (var i: FxPgEqRuntimeValue = 0; i < len; ++i) {
                    var el: FxPgEqRuntimeValue = document.createElement('option');
                    el.value = devices[i].deviceId;
                    el.innerText = devices[i].label;
                    devices_sel.appendChild(el);
                  }
                  is_ready = true;
                  btn_start.classList.remove('pk_inact');
                });
              } else {
                devices_sel.parentNode.style.display = 'none';
                has_devices = false;
                is_ready = true;
                btn_start.classList.remove('pk_inact');
              }
            };
            var stop: FxPgEqRuntimeValue = function (this: FxPgEqRuntimeValue) {
              stop_audio();
              is_active = false;
              is_paused = false;
              first_skip = 10;
              ++temp_buffer_index;
              var k: FxPgEqRuntimeValue = -1;
              newbuff = new Float32Array(temp_buffer_index * buffer_size);
              for (var i: FxPgEqRuntimeValue = 0; i < temp_buffer_index; ++i) {
                for (var j: FxPgEqRuntimeValue = 0; j < buffer_size; ++j) {
                  newbuff[++k] = temp_buffers[i][j];
                }
              }
              temp_buffer_index = -1;
              temp_buffers = [];
              // ------
              btn_open.style.display = 'block';
              // check to see if we are ready
              if (app.engine.is_ready) {
                btn_add.style.display = 'block';
              }
              has_recorded = true;
            };
            // ---
            btn_start.onclick = function (this: FxPgEqRuntimeValue) {
              if (!is_ready) return;
              if (debounce) {
                return;
              }
              debounce = true;
              setTimeout(function (this: FxPgEqRuntimeValue) {
                debounce = false;
              }, 260);
              // check if recording exists - ask for confirmation
              if (has_recorded) {
                if (!window.confirm('Are you sure? This will discard the current recording.')) {
                  return;
                }
              }
              if (is_active) {
                stop();
                btn_pause.classList.add('pk_inact');
                btn_start.innerText = 'START RECORDING';
                btn_start.style.boxShadow = 'none';
                return;
              }
              temp_buffer_index = -1;
              temp_buffers = [];
              newbuff = null;
              volume = 0;
              btn_open.style.display = 'none';
              btn_add.style.display = 'none';
              audio_context = new (window.AudioContext || window.webkitAudioContext)();
              sample_rate = audio_context.sampleRate;
              var audio_val: FxPgEqRuntimeValue = true;
              if (has_devices) {
                audio_val = { deviceId: devices_sel.value };
                // devices_sel.options[devices_sel.selectedIndex].value;
              }
              navigator.mediaDevices
                .getUserMedia({ audio: audio_val })
                .then(function (this: FxPgEqRuntimeValue, stream?: FxPgEqRuntimeValue) {
                  audio_stream = stream;
                  media_stream_source = audio_context.createMediaStreamSource(stream);
                  script_processor = audio_context.createScriptProcessor(
                    buffer_size,
                    channel_num,
                    channel_num_out,
                  );
                  media_stream_source.connect(script_processor);
                  script_processor.connect(audio_context.destination);
                  is_active = true;
                  btn_pause.classList.remove('pk_inact');
                  btn_start.innerText = 'FINISH RECORDING';
                  btn_start.style.boxShadow = '#992222 0px 0px 6px inset';
                  script_processor.onaudioprocess = fetchBufferFunction;
                  draw_volume();
                })
                .catch(function (this: FxPgEqRuntimeValue, error?: FxPgEqRuntimeValue) {});
            };
            btn_pause.onclick = function (this: FxPgEqRuntimeValue) {
              if (!is_ready) return;
              if (!is_active) return;
              is_paused = !is_paused;
              btn_pause.innerText = is_paused ? 'UN-PAUSE' : 'PAUSE';
            };
            btn_open.onclick = function (this: FxPgEqRuntimeValue) {
              if (debounce) {
                return;
              }
              debounce = true;
              setTimeout(function (this: FxPgEqRuntimeValue) {
                debounce = false;
              }, 150);
              var detach: FxPgEqRuntimeValue = function (this: FxPgEqRuntimeValue) {
                app.fireEvent('RequestDetachClipEditor');
              };
              app.engine.PreserveCurrentForUndo &&
                app.engine.PreserveCurrentForUndo('Open Recording', detach);
              detach();
              showEditor();
              app.engine.wavesurfer.backend._add = 0;
              app.engine.LoadDB({
                samplerate: sample_rate,
                data: [newbuff.buffer],
              });
              // ----
              q.Destroy();
            };
            btn_add.onclick = function (this: FxPgEqRuntimeValue) {
              if (debounce) {
                return;
              }
              debounce = true;
              setTimeout(function (this: FxPgEqRuntimeValue) {
                debounce = false;
              }, 150);
              showEditor();
              app.engine.wavesurfer.backend._add = 1;
              app.engine.LoadDB({
                samplerate: sample_rate,
                data: [newbuff.buffer],
              });
              // ----
              q.Destroy();
            };
            // ---
            app.fireEvent('RequestPause');
            app.ui.InteractionHandler.checkAndSet(modal_name);
            app.ui.KeyHandler.addCallback(
              modal_esc_key,
              function (this: FxPgEqRuntimeValue, e?: FxPgEqRuntimeValue) {
                if (!app.ui.InteractionHandler.check(modal_name)) return;
                q.Destroy();
              },
              [27],
            );
          },
        },
        app,
      );
      x.Show();
    };
    PKAudioEditor._deps.FxREC = RecModal;
  })(window, document, PKAudioEditor);
})();
