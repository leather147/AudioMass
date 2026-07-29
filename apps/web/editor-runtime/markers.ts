type MarkersRuntimeValue = ReturnType<typeof JSON.parse>;

(() => {
  const runtimeGlobal: MarkersRuntimeValue = globalThis;
  const window: MarkersRuntimeValue = runtimeGlobal.window;
  const document: MarkersRuntimeValue = runtimeGlobal.document;
  const PKAudioEditor: MarkersRuntimeValue = runtimeGlobal.PKAudioEditor;
  const PKSimpleModal: MarkersRuntimeValue =
    runtimeGlobal.window.AMLateRuntimeValue('PKSimpleModal');
  const PKAudioFXModal: MarkersRuntimeValue =
    runtimeGlobal.window.AMLateRuntimeValue('PKAudioFXModal');
  const OneUp: MarkersRuntimeValue = runtimeGlobal.OneUp;
  const WaveSurfer: MarkersRuntimeValue = runtimeGlobal.WaveSurfer;
  const dragNDrop: MarkersRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('dragNDrop');
  const ID3v2: MarkersRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID3v2');
  const ID4: MarkersRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID4');
  const wasm_denoise_stream_perf: MarkersRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue(
    'wasm_denoise_stream_perf',
  );
  const app: MarkersRuntimeValue = PKAudioEditor;
  (function (
    this: MarkersRuntimeValue,
    w?: MarkersRuntimeValue,
    d?: MarkersRuntimeValue,
    PKAE?: MarkersRuntimeValue,
  ) {
    'use strict';
    function PKMrk(this: MarkersRuntimeValue, app?: MarkersRuntimeValue) {
      var q: MarkersRuntimeValue = this,
        max: MarkersRuntimeValue = 11,
        raf: MarkersRuntimeValue = 0;
      var cols: MarkersRuntimeValue = [
        '#9dff6a',
        '#5af2ff',
        '#f557d2',
        '#ffd15c',
        '#ff8c35',
        '#b9c6ff',
      ];
      var ed: MarkersRuntimeValue = mk(),
        mt: MarkersRuntimeValue = mk();
      function mk(this: MarkersRuntimeValue) {
        return { l: [], u: 1, a: null, v: null, off: null, s: 1 };
      }
      function mtOn(this: MarkersRuntimeValue) {
        var m: MarkersRuntimeValue = app.multitrack;
        return !!(m && m.IsOn && m.IsOn());
      }
      function cx(this: MarkersRuntimeValue, n?: MarkersRuntimeValue) {
        return n === 'mt' ? mt : n === 'ed' ? ed : mtOn() ? mt : ed;
      }
      function nm(this: MarkersRuntimeValue, s?: MarkersRuntimeValue) {
        s = (s || '').replace(/[\r\n\t]/g, ' ').trim();
        return s ? s.substr(0, max) : '';
      }
      function color(this: MarkersRuntimeValue, s?: MarkersRuntimeValue) {
        return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(s || '') ? s : 0;
      }
      function redraw(this: MarkersRuntimeValue) {
        if (!raf)
          raf = w.requestAnimationFrame(function (this: MarkersRuntimeValue) {
            raf = 0;
            q.draw();
          });
      }
      function emit(this: MarkersRuntimeValue, c?: MarkersRuntimeValue, id?: MarkersRuntimeValue) {
        if (id) c.a = id;
        redraw();
      }
      function dur(this: MarkersRuntimeValue, c?: MarkersRuntimeValue) {
        if (c === mt) {
          var m: MarkersRuntimeValue = app.multitrack;
          return m && m.GetDuration ? m.GetDuration() || 0 : 0;
        }
        var ws: MarkersRuntimeValue = app.engine && app.engine.wavesurfer;
        return ws && ws.getDuration ? ws.getDuration() || 0 : 0;
      }
      function can(this: MarkersRuntimeValue, c?: MarkersRuntimeValue) {
        var m: MarkersRuntimeValue = app.multitrack;
        return c === mt ? !!(m && m.HasClips && m.HasClips()) : dur(c) > 0;
      }
      function at(this: MarkersRuntimeValue, c?: MarkersRuntimeValue, t?: MarkersRuntimeValue) {
        var durr: MarkersRuntimeValue = dur(c);
        t = isFinite(t) ? +t : 0;
        return t < 0 ? 0 : durr > 0 && t > durr ? durr : t;
      }
      function now(this: MarkersRuntimeValue, c?: MarkersRuntimeValue) {
        if (c === mt) {
          var m: MarkersRuntimeValue = app.multitrack;
          return m && m.GetCursor ? m.GetCursor() || 0 : 0;
        }
        var ws: MarkersRuntimeValue = app.engine && app.engine.wavesurfer;
        return ws && ws.getDuration ? (ws.ActiveMarker || 0) * (ws.getDuration() || 0) : 0;
      }
      function seek(this: MarkersRuntimeValue, c?: MarkersRuntimeValue, t?: MarkersRuntimeValue) {
        var durr: MarkersRuntimeValue = dur(c);
        app.fireEvent('RequestSeekTo', durr > 0 ? at(c, t) / durr : 0);
      }
      function playing(this: MarkersRuntimeValue, c?: MarkersRuntimeValue) {
        var m: MarkersRuntimeValue = app.multitrack,
          ws: MarkersRuntimeValue = app.engine && app.engine.wavesurfer;
        return c === mt
          ? !!(m && m.IsPlaying && m.IsPlaying())
          : !!(ws && ws.isPlaying && ws.isPlaying());
      }
      function sort(this: MarkersRuntimeValue, c?: MarkersRuntimeValue) {
        c.l.sort(function (
          this: MarkersRuntimeValue,
          a?: MarkersRuntimeValue,
          b?: MarkersRuntimeValue,
        ) {
          return a.time === b.time ? (a.id > b.id ? 1 : -1) : a.time - b.time;
        });
      }
      function ix(this: MarkersRuntimeValue, c?: MarkersRuntimeValue, id?: MarkersRuntimeValue) {
        for (var i: MarkersRuntimeValue = 0; i < c.l.length; ++i) if (c.l[i].id === id) return i;
        return -1;
      }
      function ser(this: MarkersRuntimeValue, c?: MarkersRuntimeValue) {
        for (
          var a: MarkersRuntimeValue = [], i: MarkersRuntimeValue = 0, m: MarkersRuntimeValue;
          i < c.l.length;
          ++i
        ) {
          m = c.l[i];
          a[i] = { id: m.id, time: m.time, name: m.name, color: m.color, loop: !!m.loop };
        }
        return a;
      }
      function hist(
        this: MarkersRuntimeValue,
        c?: MarkersRuntimeValue,
        prev?: MarkersRuntimeValue,
        desc?: MarkersRuntimeValue,
      ) {
        app.fireEvent('StateRequestPush', {
          type: 'mrk',
          ctx: c === mt ? 'mt' : 'ed',
          desc: desc,
          markers: prev,
        });
      }
      function make(this: MarkersRuntimeValue, c?: MarkersRuntimeValue, o?: MarkersRuntimeValue) {
        o = o || {};
        var a: MarkersRuntimeValue = at(c, o.time),
          id: MarkersRuntimeValue,
          n: MarkersRuntimeValue;
        id = o.id || 'm' + c.u++;
        n = ((id || '').match(/^m(\d+)$/) || 0)[1] / 1;
        if (n >= c.u) c.u = n + 1;
        return {
          id: id,
          time: a,
          name: nm(o.name) || nm('Marker ' + id.substr(1)),
          color: color(o.color) || cols[(c.u - 2) % cols.length],
          loop: !!o.loop,
        };
      }
      function load(
        this: MarkersRuntimeValue,
        c?: MarkersRuntimeValue,
        a?: MarkersRuntimeValue,
        h?: MarkersRuntimeValue,
      ) {
        var old: MarkersRuntimeValue = ser(c);
        c.l = [];
        c.u = 1;
        for (var i: MarkersRuntimeValue = 0; a && i < a.length; ++i) c.l[i] = make(c, a[i]);
        if (h !== false) hist(c, old, 'Load Markers');
        sort(c);
        c.a = c.l[0] ? c.l[0].id : null;
        emit(c);
      }
      function clear(this: MarkersRuntimeValue, c?: MarkersRuntimeValue, h?: MarkersRuntimeValue) {
        if (!c.l.length) return false;
        if (h !== false) hist(c, ser(c), 'Clear Markers');
        c.l = [];
        c.u = 1;
        c.a = null;
        emit(c);
        return true;
      }
      function add(
        this: MarkersRuntimeValue,
        c?: MarkersRuntimeValue,
        o?: MarkersRuntimeValue,
        h?: MarkersRuntimeValue,
      ) {
        if (!can(c)) return false;
        var old: MarkersRuntimeValue = ser(c),
          m: MarkersRuntimeValue = make(c, o);
        if (h !== false) hist(c, old, 'Add Marker');
        c.l[c.l.length] = m;
        sort(c);
        emit(c, m.id);
        return m;
      }
      function rem(
        this: MarkersRuntimeValue,
        c?: MarkersRuntimeValue,
        id?: MarkersRuntimeValue,
        h?: MarkersRuntimeValue,
      ) {
        var i: MarkersRuntimeValue = ix(c, id);
        if (i < 0) return false;
        if (h !== false) hist(c, ser(c), 'Delete Marker');
        c.l.splice(i, 1);
        c.a = c.l[0] ? c.l[0].id : null;
        emit(c);
        return true;
      }
      function ren(
        this: MarkersRuntimeValue,
        c?: MarkersRuntimeValue,
        id?: MarkersRuntimeValue,
        name?: MarkersRuntimeValue,
        h?: MarkersRuntimeValue,
      ) {
        var i: MarkersRuntimeValue = ix(c, id);
        if (i < 0) return false;
        name = nm(name);
        if (!name || c.l[i].name === name) return false;
        if (h !== false) hist(c, ser(c), 'Rename Marker');
        c.l[i].name = name;
        emit(c, id);
        return true;
      }
      function jump(
        this: MarkersRuntimeValue,
        c?: MarkersRuntimeValue,
        dir?: MarkersRuntimeValue,
        sel?: MarkersRuntimeValue,
      ) {
        if (!c.l.length) return;
        for (
          var t: MarkersRuntimeValue = now(c),
            m: MarkersRuntimeValue = null,
            i: MarkersRuntimeValue = dir < 0 ? c.l.length - 1 : 0;
          dir < 0 ? i >= 0 : i < c.l.length;
          i += dir
        )
          if (dir < 0 ? c.l[i].time < t - 0.001 : c.l[i].time > t + 0.001) {
            m = c.l[i];
            break;
          }
        if (!m) m = dir < 0 ? c.l[c.l.length - 1] : c.l[0];
        if (sel) app.fireEvent('RequestRegionSet', Math.min(t, m.time), Math.max(t, m.time));
        else {
          emit(c, m.id);
          seek(c, m.time);
        }
      }
      function drop(this: MarkersRuntimeValue, o?: MarkersRuntimeValue) {
        var c: MarkersRuntimeValue = cx();
        o = o || {};
        if (o.time !== undefined) return add(c, o);
        add(c, { time: now(c), name: o.name, color: o.color });
      }
      function renameUi(
        this: MarkersRuntimeValue,
        c?: MarkersRuntimeValue,
        id?: MarkersRuntimeValue,
      ) {
        var i: MarkersRuntimeValue = ix(c, id),
          mid: MarkersRuntimeValue = 'mrk_ren';
        if (i < 0) return;
        new PKSimpleModal({
          title: 'Rename Marker',
          clss: 'pk_fnt10',
          ondestroy: function (this: MarkersRuntimeValue) {
            app.ui.InteractionHandler.forceUnset(mid);
            app.ui.KeyHandler.removeCallback(mid + 'esc');
            app.ui.KeyHandler.removeCallback(mid + 'en');
          },
          buttons: [
            {
              title: 'Save',
              clss: 'pk_modal_a_accpt',
              callback: function (this: MarkersRuntimeValue, m?: MarkersRuntimeValue) {
                var v: MarkersRuntimeValue = nm(m.el_body.getElementsByTagName('input')[0].value);
                if (v) {
                  ren(c, id, v);
                  m.Destroy();
                } else OneUp('Name is too short...', 1200);
              },
            },
          ],
          body:
            '<label for="k_mrkr">Marker Name</label><input style="width:100%;box-sizing:border-box;min-width:0" maxlength="' +
            max +
            '" class="pk_txt" type="text" id="k_mrkr" />',
          setup: function (this: MarkersRuntimeValue, m?: MarkersRuntimeValue) {
            app.ui.InteractionHandler.forceSet(mid);
            app.ui.KeyHandler.addCallback(
              mid + 'esc',
              function (this: MarkersRuntimeValue) {
                if (app.ui.InteractionHandler.check(mid)) m.Destroy();
              },
              [27],
            );
            app.ui.KeyHandler.addCallback(
              mid + 'en',
              function (this: MarkersRuntimeValue) {
                if (app.ui.InteractionHandler.check(mid)) m.els.bottom[0].click();
              },
              [13],
            );
            setTimeout(function (this: MarkersRuntimeValue) {
              if (!m.el) return;
              var inp: MarkersRuntimeValue = m.el.getElementsByTagName('input')[0];
              inp.value = c.l[i].name;
              inp.focus();
              inp.selectionStart = inp.selectionEnd = inp.value.length;
            }, 20);
          },
        }).Show();
      }
      function view(this: MarkersRuntimeValue, c?: MarkersRuntimeValue, o?: MarkersRuntimeValue) {
        var layer: MarkersRuntimeValue,
          nodes: MarkersRuntimeValue = {},
          menu: MarkersRuntimeValue,
          rmenu: MarkersRuntimeValue,
          td: MarkersRuntimeValue,
          hs: MarkersRuntimeValue;
        function host(this: MarkersRuntimeValue) {
          return o.h();
        }
        function stop(this: MarkersRuntimeValue, e?: MarkersRuntimeValue) {
          e.preventDefault();
          e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
        }
        function hit(this: MarkersRuntimeValue, e?: MarkersRuntimeValue, m?: MarkersRuntimeValue) {
          return e.clientY - m.r.top <= 24;
        }
        function node(this: MarkersRuntimeValue, t?: MarkersRuntimeValue) {
          while (t && t !== host()) {
            if (t.classList && t.classList.contains('pk_mrkr')) return t;
            t = t.parentNode;
          }
        }
        function ensure(this: MarkersRuntimeValue, p?: MarkersRuntimeValue) {
          if (layer && layer.parentNode === p) return layer;
          layer = d.createElement('div');
          layer.className = 'pk_mrkrl';
          p.appendChild(layer);
          nodes = {};
          return layer;
        }
        function mkNode(this: MarkersRuntimeValue, id?: MarkersRuntimeValue) {
          var n: MarkersRuntimeValue = d.createElement('div'),
            b: MarkersRuntimeValue = d.createElement('b');
          n.className = 'pk_mrkr';
          n.setAttribute('data-id', id);
          n.lbl = b;
          n.appendChild(b);
          layer.appendChild(n);
          return (nodes[id] = n);
        }
        function paint(this: MarkersRuntimeValue) {
          var p: MarkersRuntimeValue = o.p(),
            mtr: MarkersRuntimeValue,
            h: MarkersRuntimeValue,
            stamp: MarkersRuntimeValue,
            i: MarkersRuntimeValue,
            m: MarkersRuntimeValue,
            n: MarkersRuntimeValue,
            cls: MarkersRuntimeValue,
            x: MarkersRuntimeValue,
            tr: MarkersRuntimeValue,
            id: MarkersRuntimeValue,
            lim: MarkersRuntimeValue;
          if (!p) return;
          ensure(p);
          if (o.v && !o.v()) {
            if (layer._d !== 'none') {
              layer.style.display = 'none';
              layer._d = 'none';
            }
            return;
          }
          if (layer._d) {
            layer.style.display = '';
            layer._d = '';
          }
          mtr = o.m();
          lim = p.scrollWidth || p.clientWidth || 0;
          h = (Math.max(1, o.lh() - 24) >> 0) + 'px';
          if (layer._h !== h) {
            layer.style.setProperty('--m', h);
            layer._h = h;
          }
          stamp = ++c.s;
          for (i = 0; i < c.l.length; ++i) {
            m = c.l[i];
            n = nodes[m.id] || mkNode(m.id);
            x = mtr.x(m.time) >> 0;
            if (lim && x >= lim) x = lim - 1;
            tr = 'translate3d(' + x + 'px,0,0)';
            cls = 'pk_mrkr' + (m.id === c.a ? ' pk_act' : '');
            n._s = stamp;
            if (n._c !== cls) {
              n.className = cls;
              n._c = cls;
            }
            if (n._n !== m.name) {
              n.lbl.textContent = m.name;
              n._n = m.name;
            }
            if (n._o !== m.color) {
              n.style.color = m.color;
              n._o = m.color;
            }
            if (n._t !== tr) {
              n.style.transform = tr;
              n._t = tr;
            }
          }
          for (id in nodes)
            if (nodes[id]._s !== stamp) {
              nodes[id].parentNode && nodes[id].parentNode.removeChild(nodes[id]);
              delete nodes[id];
            }
        }
        function openMenu(
          this: MarkersRuntimeValue,
          e?: MarkersRuntimeValue,
          id?: MarkersRuntimeValue,
        ) {
          if (!app._deps.ContextMenu) return false;
          if (!menu) {
            menu = new app._deps.ContextMenu(d.createElement('div'));
            menu.addOption(
              'Rename Marker',
              function (this: MarkersRuntimeValue) {
                renameUi(menu.c, menu.id);
              },
              false,
            );
            menu.addOption(
              'Delete Marker',
              function (this: MarkersRuntimeValue) {
                rem(menu.c, menu.id);
              },
              false,
            );
            menu.addOption(
              'Play From Here',
              function (this: MarkersRuntimeValue) {
                var i: MarkersRuntimeValue = ix(menu.c, menu.id);
                if (i >= 0) {
                  seek(menu.c, menu.c.l[i].time);
                  if (!playing(menu.c)) app.fireEvent('RequestPlay');
                }
              },
              false,
            );
          }
          menu.c = c;
          menu.id = id;
          menu.open(e);
          return true;
        }
        function openRulerMenu(
          this: MarkersRuntimeValue,
          e?: MarkersRuntimeValue,
          t?: MarkersRuntimeValue,
        ) {
          if (!app._deps.ContextMenu || !can(c)) return false;
          if (!rmenu) {
            rmenu = new app._deps.ContextMenu(d.createElement('div'));
            rmenu.addOption(
              'Add Marker Here',
              function (this: MarkersRuntimeValue) {
                add(rmenu.c, { time: rmenu.t });
              },
              false,
            );
          }
          rmenu.c = c;
          rmenu.t = t;
          rmenu.open(e);
          return true;
        }
        function markerDown(
          this: MarkersRuntimeValue,
          e?: MarkersRuntimeValue,
          n?: MarkersRuntimeValue,
        ) {
          var id: MarkersRuntimeValue = n.getAttribute('data-id'),
            i: MarkersRuntimeValue = ix(c, id),
            m: MarkersRuntimeValue,
            start: MarkersRuntimeValue,
            old: MarkersRuntimeValue,
            sx: MarkersRuntimeValue,
            moved: MarkersRuntimeValue = false;
          if (i < 0) return;
          stop(e);
          emit(c, id);
          if (e.button === 2 || e.which === 3) return openMenu(e, id);
          if (e.altKey) return renameUi(c, id);
          if (
            app.ui &&
            app.ui.InteractionHandler &&
            !app.ui.InteractionHandler.checkAndSet('marker')
          )
            return;
          m = c.l[i];
          start = m.time;
          old = ser(c);
          sx = e.clientX;
          function move(this: MarkersRuntimeValue, ev?: MarkersRuntimeValue) {
            var t: MarkersRuntimeValue = o.m().t(ev.clientX);
            if (Math.abs(ev.clientX - sx) > 2 || Math.abs(t - start) > 0.001) moved = true;
            m.time = t;
            emit(c, id);
            ev.preventDefault();
          }
          function up(this: MarkersRuntimeValue, ev?: MarkersRuntimeValue) {
            d.removeEventListener('mousemove', move);
            d.removeEventListener('mouseup', up);
            if (app.ui && app.ui.InteractionHandler) app.ui.InteractionHandler.forceUnset('marker');
            if (moved) {
              sort(c);
              hist(c, old, 'Move Marker');
              emit(c, id);
            } else seek(c, start);
            ev && ev.preventDefault();
          }
          d.addEventListener('mousemove', move, false);
          d.addEventListener('mouseup', up, false);
        }
        function down(this: MarkersRuntimeValue, e?: MarkersRuntimeValue) {
          var n: MarkersRuntimeValue = node(e.target),
            m: MarkersRuntimeValue;
          if (n) return markerDown(e, n);
          m = o.m();
          if (!hit(e, m)) return;
          if (e.button === 2 || e.which === 3) {
            stop(e);
            openRulerMenu(e, m.t(e.clientX));
            return;
          }
          if ((e.button !== undefined && e.button !== 0) || (e.which && e.which !== 1)) return;
          td = { x: e.clientX, y: e.clientY };
        }
        function click(this: MarkersRuntimeValue, e?: MarkersRuntimeValue) {
          var n: MarkersRuntimeValue = node(e.target),
            m: MarkersRuntimeValue;
          if (n) return stop(e);
          m = o.m();
          if (!hit(e, m)) return;
          stop(e);
          if (e.detail > 1) return add(c, { time: m.t(e.clientX) });
          if (!td || Math.abs(e.clientX - td.x) + Math.abs(e.clientY - td.y) < 4)
            seek(c, m.t(e.clientX));
          td = null;
        }
        if (c.off) c.off();
        hs = host();
        hs.addEventListener('mousedown', down, true);
        hs.addEventListener('click', click, true);
        c.off = function (this: MarkersRuntimeValue) {
          hs.removeEventListener('mousedown', down, true);
          hs.removeEventListener('click', click, true);
          if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
          if (menu) menu.destroy();
          if (rmenu) rmenu.destroy();
        };
        c.v = paint;
        paint();
      }
      q.edge = function (this: MarkersRuntimeValue, dir?: MarkersRuntimeValue) {
        var c: MarkersRuntimeValue = cx(),
          t: MarkersRuntimeValue = now(c),
          m: MarkersRuntimeValue = null,
          i: MarkersRuntimeValue;
        if (!c.l.length) return false;
        for (i = dir < 0 ? c.l.length - 1 : 0; dir < 0 ? i >= 0 : i < c.l.length; i += dir)
          if (dir < 0 ? c.l[i].time < t - 0.004 : c.l[i].time > t + 0.004) {
            m = c.l[i];
            break;
          }
        if (!m) return false;
        emit(c, m.id);
        seek(c, m.time);
        return true;
      };
      q.ser = function (this: MarkersRuntimeValue, n?: MarkersRuntimeValue) {
        return ser(cx(n));
      };
      q.serEd = function (this: MarkersRuntimeValue) {
        return ser(ed);
      };
      q.serMt = function (this: MarkersRuntimeValue) {
        return ser(mt);
      };
      q.loadEd = function (
        this: MarkersRuntimeValue,
        a?: MarkersRuntimeValue,
        h?: MarkersRuntimeValue,
      ) {
        load(ed, a, h);
      };
      q.loadMt = function (
        this: MarkersRuntimeValue,
        a?: MarkersRuntimeValue,
        h?: MarkersRuntimeValue,
      ) {
        load(mt, a, h);
      };
      q.clearEd = function (this: MarkersRuntimeValue, h?: MarkersRuntimeValue) {
        return clear(ed, h);
      };
      q.wave = function (
        this: MarkersRuntimeValue,
        ws?: MarkersRuntimeValue,
        wave?: MarkersRuntimeValue,
      ) {
        if (!ws || !wave) return;
        view(ed, {
          h: function (this: MarkersRuntimeValue) {
            return wave;
          },
          p: function (this: MarkersRuntimeValue) {
            return wave;
          },
          lh: function (this: MarkersRuntimeValue) {
            return wave.clientHeight || 24;
          },
          m: function (this: MarkersRuntimeValue) {
            var r: MarkersRuntimeValue = wave.getBoundingClientRect(),
              durr: MarkersRuntimeValue = ws.getDuration ? ws.getDuration() || 0 : 0;
            var vis: MarkersRuntimeValue = ws.VisibleDuration || durr || 1,
              left: MarkersRuntimeValue = ws.LeftProgress || 0,
              scale: MarkersRuntimeValue = r.width / Math.max(0.0001, vis);
            return {
              r: r,
              x: function (this: MarkersRuntimeValue, t?: MarkersRuntimeValue) {
                return (t - left) * scale;
              },
              t: function (this: MarkersRuntimeValue, x?: MarkersRuntimeValue) {
                return at(ed, left + (x - r.left) / scale);
              },
            };
          },
        });
      };
      q.mt = function (
        this: MarkersRuntimeValue,
        main?: MarkersRuntimeValue,
        ruler?: MarkersRuntimeValue,
        px?: MarkersRuntimeValue,
        vis?: MarkersRuntimeValue,
      ) {
        if (!main || !ruler || !px) return;
        view(mt, {
          h: function (this: MarkersRuntimeValue) {
            return ruler;
          },
          p: function (this: MarkersRuntimeValue) {
            return ruler;
          },
          v: vis,
          lh: function (this: MarkersRuntimeValue) {
            return main.clientHeight || 24;
          },
          m: function (this: MarkersRuntimeValue) {
            var r: MarkersRuntimeValue = ruler.getBoundingClientRect(),
              scale: MarkersRuntimeValue = Math.max(1, px());
            return {
              r: r,
              x: function (this: MarkersRuntimeValue, t?: MarkersRuntimeValue) {
                return t * scale;
              },
              t: function (this: MarkersRuntimeValue, x?: MarkersRuntimeValue) {
                return at(mt, (x - r.left) / scale);
              },
            };
          },
        });
      };
      function draw(this: MarkersRuntimeValue, c?: MarkersRuntimeValue) {
        c.v && c.v();
      }
      q.drawEd = function (this: MarkersRuntimeValue) {
        draw(ed);
      };
      q.drawMt = function (this: MarkersRuntimeValue) {
        draw(mt);
      };
      q.draw = function (this: MarkersRuntimeValue) {
        draw(ed);
        draw(mt);
      };
      app.listenFor('MrkrAdd', drop);
      app.listenFor('MrkrPrv', function (this: MarkersRuntimeValue, sel?: MarkersRuntimeValue) {
        jump(cx(), -1, sel);
      });
      app.listenFor('MrkrNxt', function (this: MarkersRuntimeValue, sel?: MarkersRuntimeValue) {
        jump(cx(), 1, sel);
      });
      app.listenFor('DidZoom', redraw);
      app.listenFor('DidCursorCenter', redraw);
      app.listenFor('DidUpdateLen', redraw);
      app.listenFor('RequestResize', redraw);
      app.listenFor('DidUnloadFile', function (this: MarkersRuntimeValue) {
        clear(ed, false);
      });
      app.listenFor(
        'StateDidPop',
        function (
          this: MarkersRuntimeValue,
          state?: MarkersRuntimeValue,
          undo?: MarkersRuntimeValue,
        ) {
          if (!state || state.type !== 'mrk') return;
          load(cx(state.ctx), state.markers, false);
          OneUp((undo ? 'Undo ' : 'Redo ') + state.desc);
        },
      );
    }
    PKAE._deps.mrk = PKMrk;
  })(window, document, PKAudioEditor);
})();
