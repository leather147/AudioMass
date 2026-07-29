type MultitrackRuntimeValue = ReturnType<typeof JSON.parse>;

(() => {
  const runtimeGlobal: MultitrackRuntimeValue = globalThis;
  const window: MultitrackRuntimeValue = runtimeGlobal.window;
  const document: MultitrackRuntimeValue = runtimeGlobal.document;
  const PKAudioEditor: MultitrackRuntimeValue = runtimeGlobal.PKAudioEditor;
  const PKSimpleModal: MultitrackRuntimeValue =
    runtimeGlobal.window.AMLateRuntimeValue('PKSimpleModal');
  const PKAudioFXModal: MultitrackRuntimeValue =
    runtimeGlobal.window.AMLateRuntimeValue('PKAudioFXModal');
  const OneUp: MultitrackRuntimeValue = runtimeGlobal.OneUp;
  const WaveSurfer: MultitrackRuntimeValue = runtimeGlobal.WaveSurfer;
  const dragNDrop: MultitrackRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('dragNDrop');
  const ID3v2: MultitrackRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID3v2');
  const ID4: MultitrackRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue('ID4');
  const wasm_denoise_stream_perf: MultitrackRuntimeValue = runtimeGlobal.window.AMLateRuntimeValue(
    'wasm_denoise_stream_perf',
  );
  const app: MultitrackRuntimeValue = PKAudioEditor;
  (function (
    this: MultitrackRuntimeValue,
    w?: MultitrackRuntimeValue,
    d?: MultitrackRuntimeValue,
    PKAE?: MultitrackRuntimeValue,
  ) {
    'use strict';
    function PKMultitrack(this: MultitrackRuntimeValue, app?: MultitrackRuntimeValue) {
      var q: MultitrackRuntimeValue = this;
      var on: MultitrackRuntimeValue = false;
      var tracks: MultitrackRuntimeValue = [];
      var clips: MultitrackRuntimeValue = [];
      var track_uid: MultitrackRuntimeValue = 1;
      var clip_uid: MultitrackRuntimeValue = 1;
      var selected_track: MultitrackRuntimeValue = null;
      var selected_clip: MultitrackRuntimeValue = null;
      var editing_clip: MultitrackRuntimeValue = null;
      var default_px_per_sec: MultitrackRuntimeValue = 86;
      var default_row_h: MultitrackRuntimeValue = app.isMobile ? 134 : 88;
      var min_track_h: MultitrackRuntimeValue = app.isMobile ? 78 : 58;
      var max_track_h: MultitrackRuntimeValue = 240;
      var px_per_sec: MultitrackRuntimeValue = 86;
      var snap_px: MultitrackRuntimeValue = 9;
      var beat_snap_px: MultitrackRuntimeValue = 4;
      var region_snap_px: MultitrackRuntimeValue = 5;
      var row_h: MultitrackRuntimeValue = default_row_h;
      var clip_min_w: MultitrackRuntimeValue = app.isMobile ? 24 : 36;
      var cursor: MultitrackRuntimeValue = 0;
      var marker: MultitrackRuntimeValue = 0;
      var beat_on: MultitrackRuntimeValue = false;
      var beat_snap: MultitrackRuntimeValue = false;
      var beat_bpm: MultitrackRuntimeValue = 120;
      var beat_sig: MultitrackRuntimeValue = '4/4';
      var beat_sigs: MultitrackRuntimeValue = ['4/4', '3/4', '6/8'];
      var region: MultitrackRuntimeValue = null;
      var xfades: MultitrackRuntimeValue = {};
      var master_vol: MultitrackRuntimeValue = 1;
      var raf: MultitrackRuntimeValue = 0;
      var play_sync: MultitrackRuntimeValue = 0;
      var render_raf: MultitrackRuntimeValue = 0;
      var throttle_wheel: MultitrackRuntimeValue = 0;
      var throttle_hover: MultitrackRuntimeValue = 0;
      var ruler_left: MultitrackRuntimeValue = -1;
      var playhead_x: MultitrackRuntimeValue = null;
      var marker_x: MultitrackRuntimeValue = null;
      var rec_raf: MultitrackRuntimeValue = 0;
      var rec_redraw: MultitrackRuntimeValue = 0;
      var scroll_sync: MultitrackRuntimeValue = false;
      var did_init_zoom: MultitrackRuntimeValue = false;
      var active_drag: MultitrackRuntimeValue = null;
      var touch_zoom: MultitrackRuntimeValue = null;
      var touch_zoom_doc: MultitrackRuntimeValue = false;
      var gesture_zoom: MultitrackRuntimeValue = null;
      var zoom_dirty: MultitrackRuntimeValue = false;
      var wheel_zoom_delta: MultitrackRuntimeValue = 0;
      var clip_els: MultitrackRuntimeValue = {};
      var edge_pan_raf: MultitrackRuntimeValue = 0;
      var edge_pan_dir: MultitrackRuntimeValue = 0;
      var edge_pan_ev: MultitrackRuntimeValue = null;
      var edge_pan_update: MultitrackRuntimeValue = null;
      var clip_copy: MultitrackRuntimeValue = null;
      var timeline_on: MultitrackRuntimeValue =
        !app.engine || !app.engine.wavesurfer || app.engine.wavesurfer.params.timeline !== false;
      var mt_context: MultitrackRuntimeValue = null;
      var mt_lane_context: MultitrackRuntimeValue = null;
      var context_clip: MultitrackRuntimeValue = null;
      var context_track: MultitrackRuntimeValue = null;
      var context_index: MultitrackRuntimeValue = 0;
      var context_time: MultitrackRuntimeValue = 0;
      var skip_context: MultitrackRuntimeValue = false;
      var pan_dragged: MultitrackRuntimeValue = false;
      var published_duration: MultitrackRuntimeValue = -1;
      var touch_down_time: MultitrackRuntimeValue = 0;
      var el: MultitrackRuntimeValue = null;
      var side: MultitrackRuntimeValue = null;
      var tracks_wrap: MultitrackRuntimeValue = null;
      var tracks_el: MultitrackRuntimeValue = null;
      var main: MultitrackRuntimeValue = null;
      var ruler: MultitrackRuntimeValue = null;
      var ruler_canvas: MultitrackRuntimeValue = null;
      var lanes: MultitrackRuntimeValue = null;
      var region_el: MultitrackRuntimeValue = null;
      var playhead: MultitrackRuntimeValue = null;
      var marker_el: MultitrackRuntimeValue = null;
      var beat_canvas: MultitrackRuntimeValue = null;
      var beat_raf: MultitrackRuntimeValue = 0;
      var empty_el: MultitrackRuntimeValue = null;
      var btn_toggle: MultitrackRuntimeValue = null;
      var beat_bar: MultitrackRuntimeValue = null;
      var btn_beat: MultitrackRuntimeValue = null;
      var btn_snap: MultitrackRuntimeValue = null;
      var btn_sig: MultitrackRuntimeValue = null;
      var bpm_input: MultitrackRuntimeValue = null;
      var bpm_range: MultitrackRuntimeValue = null;
      var bpm_range_down: MultitrackRuntimeValue = null;
      var btn_clear_mute: MultitrackRuntimeValue = null;
      var btn_clear_solo: MultitrackRuntimeValue = null;
      var mixer_on: MultitrackRuntimeValue = false;
      var mixer_type: MultitrackRuntimeValue = null;
      var mixer_prev: MultitrackRuntimeValue = null;
      var mixer_changed: MultitrackRuntimeValue = false;
      var mixer_meters: MultitrackRuntimeValue = {};
      var lane_by_track: MultitrackRuntimeValue = {};
      var play: MultitrackRuntimeValue = null;
      var rec: MultitrackRuntimeValue = null;
      var rec_el: MultitrackRuntimeValue = null;
      var rec_canvas: MultitrackRuntimeValue = null;
      var fx_preview: MultitrackRuntimeValue = null;
      var fx_preview_on: MultitrackRuntimeValue = true;
      var wake_id: MultitrackRuntimeValue = 0;
      var ctx_watch: MultitrackRuntimeValue = null;
      var wave_peak_step: MultitrackRuntimeValue = 128;
      var wave_peaks: MultitrackRuntimeValue = w.WeakMap ? new w.WeakMap() : null;
      var sample_loading: MultitrackRuntimeValue = false;
      var sample_cache: MultitrackRuntimeValue = {};
      var track_colors: MultitrackRuntimeValue = [
        ['#071010', '#88c7c1', '#2f7b75'],
        ['#0b1013', '#7fb5b6', '#336e70'],
        ['#0d100d', '#83b0a4', '#3d6c62'],
        ['#100f0b', '#9aa47e', '#5d6543'],
        ['#100d10', '#a48aa0', '#665164'],
        ['#0d0f13', '#879db1', '#4d6277'],
      ];
      var multi_sample_files: MultitrackRuntimeValue = [
        {
          f: 'guitar-lead.mp3',
          v: 0.966667,
          p: 0.25,
          c: [
            [0, 0, 7.09],
            [14.01, 14.01],
          ],
        },
        { f: 'guitar-rhythm.mp3', p: -0.1, c: [[7.077, 7.077]] },
        {
          f: 'drums.mp3',
          c: [
            [0, 0, 38.317688],
            [52.58218, 28.191393, 34.927124, 0.06652],
            [76.963829, 52.596916],
          ],
        },
        {
          f: 'bass.mp3',
          c: [
            [0, 0, 28.274],
            [28.274, 28.274, 77.015877],
            [77.015877, 28.274, 52.877399, 0, 0.897889],
          ],
        },
        {
          f: 'piano.mp3',
          v: 0.92,
          c: [
            [34.283047, 6.008046, 48.787418, 0.113838],
            [77.015877, 0, 24.399876, 0, 0, 1],
          ],
        },
        {
          f: 'harp-2.mp3',
          v: 0.93,
          p: 0.12,
          c: [
            [46.600136, 18.325136, 50.253502, 0.08255],
            [77.015877, 0, 24.399876, 0, 0, 1],
          ],
        },
        {
          f: 'picolo-1.mp3',
          v: 0.78,
          c: [
            [49.592648, 21.317646, 48.777374, 0.051594],
            [77.015877, 0, 24.399876, 0, 0, 1],
          ],
        },
        {
          f: 'flute-1.mp3',
          p: -0.2,
          c: [
            [37.748508, 9.473508, 48.740875, 3.826093],
            [77.015877, 0, 24.399876],
          ],
        },
        { f: 'choirs.mp3', v: 0.96, c: [[76.985, 0]] },
      ];
      function setActiveDrag(this: MultitrackRuntimeValue, fn?: MultitrackRuntimeValue) {
        cancelActiveDrag();
        active_drag = fn;
      }
      function clearActiveDrag(this: MultitrackRuntimeValue, fn?: MultitrackRuntimeValue) {
        if (active_drag === fn) active_drag = null;
      }
      function cancelActiveDrag(this: MultitrackRuntimeValue) {
        if (!active_drag) return;
        var fn: MultitrackRuntimeValue = active_drag;
        active_drag = null;
        fn();
      }
      function cancelRender(this: MultitrackRuntimeValue) {
        if (!render_raf) return;
        w.cancelAnimationFrame(render_raf);
        render_raf = 0;
      }
      function requestRender(this: MultitrackRuntimeValue) {
        if (render_raf) return;
        render_raf = w.requestAnimationFrame(function (this: MultitrackRuntimeValue) {
          render_raf = 0;
          render();
        });
      }
      function audioCtx(this: MultitrackRuntimeValue) {
        var wv: MultitrackRuntimeValue = app.engine && app.engine.wavesurfer;
        var ctx: MultitrackRuntimeValue = wv && wv.backend && wv.backend.ac;
        if (!ctx) {
          if (!w.WaveSurferAudioContext)
            w.WaveSurferAudioContext = new (w.AudioContext || w.webkitAudioContext)();
          ctx = w.WaveSurferAudioContext;
        }
        watchAudio(ctx);
        return ctx;
      }
      function watchAudio(this: MultitrackRuntimeValue, ctx?: MultitrackRuntimeValue) {
        if (!ctx || ctx === ctx_watch || !ctx.addEventListener) return;
        ctx_watch = ctx;
        ctx.addEventListener('statechange', function (this: MultitrackRuntimeValue) {
          if (play && ctx.state !== 'running') Pause();
        });
      }
      function withAudio(this: MultitrackRuntimeValue, fn?: MultitrackRuntimeValue) {
        var ctx: MultitrackRuntimeValue = audioCtx();
        var id: MultitrackRuntimeValue = ++wake_id;
        if (!ctx) return;
        if (!ctx.state || ctx.state === 'running') return fn(ctx);
        if (!ctx.resume || ctx.state === 'closed') return;
        ctx.resume().then(
          function (this: MultitrackRuntimeValue) {
            if (id === wake_id && ctx.state === 'running') fn(ctx);
          },
          function (this: MultitrackRuntimeValue) {},
        );
      }
      function logFrequencies(this: MultitrackRuntimeValue) {
        var wv: MultitrackRuntimeValue = app.engine && app.engine.wavesurfer;
        return !!(wv && wv.backend && wv.backend.logFrequencies);
      }
      function getWavePeaks(this: MultitrackRuntimeValue, buffer?: MultitrackRuntimeValue) {
        var cache: MultitrackRuntimeValue = wave_peaks
          ? wave_peaks.get(buffer)
          : buffer._pk_mt_peaks;
        if (cache && cache.len === buffer.length && cache.step === wave_peak_step) return cache;
        var data: MultitrackRuntimeValue = buffer.getChannelData(0);
        var size: MultitrackRuntimeValue = Math.ceil(data.length / wave_peak_step);
        var min: MultitrackRuntimeValue = new Float32Array(size);
        var max: MultitrackRuntimeValue = new Float32Array(size);
        for (var i: MultitrackRuntimeValue = 0; i < size; ++i) {
          var from: MultitrackRuntimeValue = i * wave_peak_step;
          var to: MultitrackRuntimeValue = Math.min(data.length, from + wave_peak_step);
          var mn: MultitrackRuntimeValue = 0;
          var mx: MultitrackRuntimeValue = 0;
          for (var j: MultitrackRuntimeValue = from; j < to; ++j) {
            var v: MultitrackRuntimeValue = data[j];
            if (v > mx) mx = v;
            else if (v < mn) mn = v;
          }
          min[i] = mn;
          max[i] = mx;
        }
        cache = {
          len: data.length,
          step: wave_peak_step,
          min: min,
          max: max,
        };
        if (wave_peaks) wave_peaks.set(buffer, cache);
        else
          try {
            buffer._pk_mt_peaks = cache;
          } catch (e: MultitrackRuntimeValue) {}
        return cache;
      }
      function makeTrack(this: MultitrackRuntimeValue, name?: MultitrackRuntimeValue) {
        return {
          id: 'mt' + track_uid++,
          name: name || 'Channel ' + track_uid,
          mute: false,
          solo: false,
          vol: 1,
          pan: 0,
          rec: false,
        };
      }
      function trackColor(this: MultitrackRuntimeValue, id?: MultitrackRuntimeValue) {
        for (var i: MultitrackRuntimeValue = 0; i < tracks.length; ++i)
          if (tracks[i].id === id) return track_colors[i % track_colors.length];
        return track_colors[0];
      }
      function cloneState(this: MultitrackRuntimeValue) {
        return {
          track_uid: track_uid,
          clip_uid: clip_uid,
          selected_track: selected_track,
          selected_clip: selected_clip,
          cursor: cursor,
          marker: marker,
          beat_on: beat_on,
          beat_snap: beat_snap,
          beat_bpm: beat_bpm,
          beat_sig: beat_sig,
          px_per_sec: px_per_sec,
          row_h: row_h,
          master_vol: master_vol,
          xfades: cloneXfades(),
          tracks: tracks.map(function (this: MultitrackRuntimeValue, t?: MultitrackRuntimeValue) {
            return {
              id: t.id,
              name: t.name,
              mute: t.mute,
              solo: t.solo,
              vol: t.vol,
              pan: t.pan,
              h: t.h || 1,
              rec: t.rec,
            };
          }),
          clips: clips.map(function (this: MultitrackRuntimeValue, c?: MultitrackRuntimeValue) {
            return {
              id: c.id,
              track: c.track,
              start: c.start,
              in: c.in || 0,
              out: c.out,
              fi: c.fi || 0,
              fo: c.fo || 0,
              name: c.name,
              buffer: c.buffer,
            };
          }),
        };
      }
      function pushState(
        this: MultitrackRuntimeValue,
        prev?: MultitrackRuntimeValue,
        desc?: MultitrackRuntimeValue,
      ) {
        app.fireEvent('StateRequestPush', {
          type: 'mult',
          desc: desc,
          mt: prev,
          data: app.engine.wavesurfer.backend.buffer,
        });
      }
      function cloneXfades(this: MultitrackRuntimeValue) {
        var ret: MultitrackRuntimeValue = {};
        for (var k in xfades) if (xfades[k]) ret[k] = 1;
        return ret;
      }
      function restoreState(
        this: MultitrackRuntimeValue,
        state?: MultitrackRuntimeValue,
        keep_beat?: MultitrackRuntimeValue,
      ) {
        if (!state) return;
        Stop();
        tracks = state.tracks.map(function (
          this: MultitrackRuntimeValue,
          t?: MultitrackRuntimeValue,
        ) {
          return {
            id: t.id,
            name: t.name,
            mute: !!t.mute,
            solo: !!t.solo,
            vol: t.vol === undefined ? 1 : t.vol,
            pan: t.pan || 0,
            h: t.h || 1,
            rec: !!t.rec,
          };
        });
        clips = state.clips.map(function (
          this: MultitrackRuntimeValue,
          c?: MultitrackRuntimeValue,
        ) {
          return {
            id: c.id,
            track: c.track,
            start: c.start || 0,
            in: c.in || 0,
            out: c.out,
            fi: c.fi || 0,
            fo: c.fo || 0,
            name: c.name,
            buffer: c.buffer,
          };
        });
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i) clampClipFades(clips[i]);
        track_uid = state.track_uid || nextNum(tracks, 'mt');
        clip_uid = state.clip_uid || nextNum(clips, 'mc');
        selected_track = state.selected_track || (tracks[0] && tracks[0].id);
        selected_clip = state.selected_clip || null;
        cursor = state.cursor || 0;
        marker = state.marker === undefined ? cursor : state.marker;
        if (!keep_beat) {
          beat_on = !!state.beat_on;
          beat_snap = beat_on && !!state.beat_snap;
          beat_bpm = cleanBpm(state.beat_bpm === undefined ? 120 : state.beat_bpm);
          beat_sig = cleanSig(state.beat_sig);
        }
        px_per_sec = state.px_per_sec || default_px_per_sec;
        row_h = state.row_h || default_row_h;
        master_vol = state.master_vol === undefined ? 1 : state.master_vol;
        xfades = state.xfades || {};
        cleanXfades();
        render();
        emitState();
      }
      function nextNum(
        this: MultitrackRuntimeValue,
        arr?: MultitrackRuntimeValue,
        pref?: MultitrackRuntimeValue,
      ) {
        var max: MultitrackRuntimeValue = 0;
        for (var i: MultitrackRuntimeValue = 0; i < arr.length; ++i) {
          var n: MultitrackRuntimeValue = (arr[i].id || '').replace(pref, '') / 1;
          if (n > max) max = n;
        }
        return max + 1;
      }
      q.getState = cloneState;
      function ExportSession(this: MultitrackRuntimeValue, name?: MultitrackRuntimeValue) {
        if (!tracks.length) {
          OneUp('Nothing to save', 1200);
          return false;
        }
        var st: MultitrackRuntimeValue = cloneState();
        if (app.mrk) st.markers = app.mrk.serMt();
        if (!app.amss || !app.amss.ExportMultitrack || !app.amss.ExportMultitrack(name, st)) {
          OneUp('Could not save session', 1400);
          return false;
        }
        OneUp('Saved session', 1000);
        return true;
      }
      function LoadSessionBuffer(
        this: MultitrackRuntimeValue,
        buf?: MultitrackRuntimeValue,
        name?: MultitrackRuntimeValue,
      ) {
        if (!app.amss || !app.amss.IsBuffer || !app.amss.IsBuffer(buf)) return false;
        app.fireEvent('WillDownloadFile');
        try {
          var st: MultitrackRuntimeValue = app.amss.DecodeMultitrack(buf);
          if (!st) throw 0;
          editing_clip = null;
          app.fireEvent('StateRequestClearAll');
          Toggle(true);
          restoreState(st);
          if (app.mrk) app.mrk.loadMt(st.markers, false);
          app.fireEvent('DidUpdateMultitrack');
          OneUp('Loaded session' + (name ? ': ' + name : ''), 1200);
        } catch (e: MultitrackRuntimeValue) {
          OneUp('Could not load session', 1400);
        }
        app.fireEvent('DidDownloadFile');
        return true;
      }
      function LoadSessionFiles(this: MultitrackRuntimeValue, files?: MultitrackRuntimeValue) {
        return !!(
          app.amss &&
          app.amss.ReadFile &&
          app.amss.ReadFile(
            files && files[0],
            function (
              this: MultitrackRuntimeValue,
              b?: MultitrackRuntimeValue,
              n?: MultitrackRuntimeValue,
            ) {
              if (!LoadSessionBuffer(b, n)) OneUp('Could not load session', 1400);
            },
          )
        );
      }
      function duration(this: MultitrackRuntimeValue) {
        var dur: MultitrackRuntimeValue = 30;
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i) {
          var c: MultitrackRuntimeValue = clips[i];
          dur = Math.max(dur, c.start + clipLen(c) + 2);
        }
        return dur;
      }
      function publishDuration(this: MultitrackRuntimeValue, force?: MultitrackRuntimeValue) {
        var dur: MultitrackRuntimeValue = duration();
        if (force || Math.abs(dur - published_duration) > 0.001) {
          published_duration = dur;
          app.fireEvent('DidUpdateLen', dur);
        }
        return dur;
      }
      function hasClips(this: MultitrackRuntimeValue) {
        return !!clips.length;
      }
      function clampTime(this: MultitrackRuntimeValue, time?: MultitrackRuntimeValue) {
        return Math.max(0, Math.min(duration(), time || 0));
      }
      function clipIn(this: MultitrackRuntimeValue, clip?: MultitrackRuntimeValue) {
        return clip.in || 0;
      }
      function clipOut(this: MultitrackRuntimeValue, clip?: MultitrackRuntimeValue) {
        return clip.out === undefined ? clip.buffer.duration : clip.out;
      }
      function clipLen(this: MultitrackRuntimeValue, clip?: MultitrackRuntimeValue) {
        return Math.max(0.01, clipOut(clip) - clipIn(clip));
      }
      function findTrack(this: MultitrackRuntimeValue, id?: MultitrackRuntimeValue) {
        for (var i: MultitrackRuntimeValue = 0; i < tracks.length; ++i)
          if (tracks[i].id === id) return tracks[i];
        return null;
      }
      function findClip(this: MultitrackRuntimeValue, id?: MultitrackRuntimeValue) {
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i)
          if (clips[i].id === id) return clips[i];
        return null;
      }
      function activeTrack(this: MultitrackRuntimeValue) {
        for (var i: MultitrackRuntimeValue = 0; i < tracks.length; ++i)
          if (tracks[i].rec) return tracks[i];
        return null;
      }
      function hasSolo(this: MultitrackRuntimeValue) {
        return hasTrackFlag('solo');
      }
      function hasTrackFlag(this: MultitrackRuntimeValue, flag?: MultitrackRuntimeValue) {
        for (var i: MultitrackRuntimeValue = 0; i < tracks.length; ++i)
          if (tracks[i][flag]) return true;
        return false;
      }
      function trackAudible(
        this: MultitrackRuntimeValue,
        track?: MultitrackRuntimeValue,
        solo?: MultitrackRuntimeValue,
      ) {
        if (!track || track.mute) return false;
        return solo ? track.solo : true;
      }
      function trackGain(
        this: MultitrackRuntimeValue,
        track?: MultitrackRuntimeValue,
        solo?: MultitrackRuntimeValue,
      ) {
        return trackAudible(track, solo) ? (track.vol === undefined ? 1 : track.vol) : 0;
      }
      function trackHeight(this: MultitrackRuntimeValue, track?: MultitrackRuntimeValue) {
        return Math.max(
          min_track_h,
          Math.min(max_track_h, row_h * (track && track.h ? track.h : 1)),
        );
      }
      function trackTop(this: MultitrackRuntimeValue, id?: MultitrackRuntimeValue) {
        var top: MultitrackRuntimeValue = 0;
        for (var i: MultitrackRuntimeValue = 0; i < tracks.length; ++i) {
          if (tracks[i].id === id) return top;
          top += trackHeight(tracks[i]);
        }
        return top;
      }
      function trackIndexAt(this: MultitrackRuntimeValue, y?: MultitrackRuntimeValue) {
        var top: MultitrackRuntimeValue = 0;
        for (var i: MultitrackRuntimeValue = 0; i < tracks.length; ++i) {
          top += trackHeight(tracks[i]);
          if (y < top) return i;
        }
        return Math.max(0, tracks.length - 1);
      }
      function tracksHeight(this: MultitrackRuntimeValue) {
        var h: MultitrackRuntimeValue = 0;
        for (var i: MultitrackRuntimeValue = 0; i < tracks.length; ++i) h += trackHeight(tracks[i]);
        return h;
      }
      function formatTime(this: MultitrackRuntimeValue, val?: MultitrackRuntimeValue) {
        if (app.ui && app.ui.formatTime) return app.ui.formatTime(val);
        var s: MultitrackRuntimeValue = val >> 0;
        var m: MultitrackRuntimeValue = (s / 60) >> 0;
        s = s % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
      }
      function blurActive(this: MultitrackRuntimeValue) {
        var ae: MultitrackRuntimeValue = d.activeElement;
        if (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName || '')) ae.blur();
      }
      function focusMain(this: MultitrackRuntimeValue) {
        blurActive();
        if (main) main.focus();
      }
      function emitEditorState(this: MultitrackRuntimeValue) {
        var wv: MultitrackRuntimeValue = app.engine && app.engine.wavesurfer;
        var dur: MultitrackRuntimeValue = wv && wv.getDuration ? wv.getDuration() : 0;
        if (!wv) return;
        app.fireEvent('DidUpdateLen', dur);
        if (wv.regions && wv.regions.list[0]) app.fireEvent('DidCreateRegion', wv.regions.list[0]);
        else app.fireEvent('DidDestroyRegion');
        app.fireEvent('DidAudioProcess', [
          wv.getCurrentTime ? wv.getCurrentTime() : 0,
          null,
          w.performance.now(),
        ]);
        app.fireEvent('DidZoom', [
          wv.ZoomFactor || 1,
          ((wv.LeftProgress || 0) / Math.max(0.0001, dur)) * 100,
          wv.params && wv.params.verticalZoom,
        ]);
      }
      function refreshEditorView(this: MultitrackRuntimeValue) {
        var wv: MultitrackRuntimeValue = app.engine && app.engine.wavesurfer;
        w.requestAnimationFrame(function (this: MultitrackRuntimeValue) {
          if (IsOn()) return;
          app.fireEvent('RequestResize');
          app.engine && app.engine.is_ready && wv && wv.drawBuffer && wv.drawBuffer();
          w.requestAnimationFrame(function (this: MultitrackRuntimeValue) {
            var r: MultitrackRuntimeValue = wv && wv.regions && wv.regions.list[0];
            if (!IsOn()) r && r.updateRender && r.updateRender();
          });
        });
      }
      function emitState(this: MultitrackRuntimeValue) {
        updatePlayhead();
        publishDuration(true);
        if (region) app.fireEvent('DidCreateRegion', region);
        else app.fireEvent('DidDestroyRegion');
        app.fireEvent('DidSetLoop', region && region.loop);
        if (selected_clip) app.fireEvent('DidSelectClip', findClip(selected_clip));
        else app.fireEvent('DidDeselectClip');
        app.fireEvent('DidAudioProcess', [cursor, null, w.performance.now()]);
        fireZoom();
        app.fireEvent('DidUpdateMultitrack');
      }
      function build(this: MultitrackRuntimeValue) {
        var footer: MultitrackRuntimeValue = app.el.getElementsByClassName('pk_ftr')[0];
        el = d.createElement('div');
        el.className = 'pk_mt pk_noselect';
        var emptyMsg: MultitrackRuntimeValue =
          'Drag and Drop Audio Files in this window, or click ' +
          '<a style="white-space:nowrap;border:1px solid;border-radius:23px;padding:5px 18px;font-size:0.94em;margin-left:5px">here to use a sample</a>';
        el.innerHTML =
          '<div class="pk_mt_side">' +
          '<div class="pk_mt_head"></div>' +
          '<div class="pk_mt_tracks_wrap"><div class="pk_mt_tracks"></div></div>' +
          '</div>' +
          '<div class="pk_mt_main">' +
          '<div class="pk_mt_ruler"></div>' +
          '<div class="pk_mt_lanes"></div>' +
          '<div class="pk_tmpMsg pk_mt_empty">' +
          emptyMsg +
          '</div>' +
          '<div class="pk_mt_region wavesurfer-region"></div>' +
          '<div class="pk_mt_playhead"></div>' +
          '<div class="pk_mt_marker"></div>' +
          '</div>';
        app.el.insertBefore(el, footer);
        side = el.getElementsByClassName('pk_mt_side')[0];
        tracks_wrap = el.getElementsByClassName('pk_mt_tracks_wrap')[0];
        tracks_el = el.getElementsByClassName('pk_mt_tracks')[0];
        main = el.getElementsByClassName('pk_mt_main')[0];
        main.tabIndex = -1;
        ruler = el.getElementsByClassName('pk_mt_ruler')[0];
        lanes = el.getElementsByClassName('pk_mt_lanes')[0];
        empty_el = el.getElementsByClassName('pk_mt_empty')[0];
        region_el = el.getElementsByClassName('pk_mt_region')[0];
        playhead = el.getElementsByClassName('pk_mt_playhead')[0];
        marker_el = el.getElementsByClassName('pk_mt_marker')[0];
        if (app.mrk)
          app.mrk.mt(
            main,
            ruler,
            function (this: MultitrackRuntimeValue) {
              return px_per_sec;
            },
            function (this: MultitrackRuntimeValue) {
              return on;
            },
          );
        buildHeader();
        addRegionHandles();
        empty_el.getElementsByTagName('a')[0].onclick = function (
          this: MultitrackRuntimeValue,
          e?: MultitrackRuntimeValue,
        ) {
          e.preventDefault();
          loadMultiSample();
        };
        main.addEventListener('wheel', wheelZoom, { passive: false });
        el.addEventListener('gesturestart', gestureStart, { passive: false, capture: true });
        el.addEventListener('gesturechange', gestureChange, { passive: false, capture: true });
        el.addEventListener('gestureend', gestureEnd, { passive: false, capture: true });
        el.addEventListener('touchstart', touchZoomStart, { passive: false, capture: true });
        el.addEventListener('touchend', touchZoomEnd, true);
        el.addEventListener('touchcancel', touchZoomEnd, true);
        main.addEventListener('scroll', syncScroll, false);
        main.addEventListener('mousemove', hoverTime, false);
        bindDown(main, mainDown);
        buildClipContext();
        main.addEventListener(
          'contextmenu',
          function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
            if (!hasClips()) return;
            if (skip_context) {
              skip_context = false;
              e.preventDefault();
              return;
            }
            if (pan_dragged) {
              pan_dragged = false;
              e.preventDefault();
              return;
            }
            if (!openClipContext(e) && !openLaneContext(e)) e.preventDefault();
          },
          false,
        );
        tracks_wrap.addEventListener('scroll', syncTrackScroll, false);
        attachToolbarButton();
        attachBeatToolbar();
        render();
      }
      function buildHeader(this: MultitrackRuntimeValue) {
        var head: MultitrackRuntimeValue = el.getElementsByClassName('pk_mt_head')[0];
        var label: MultitrackRuntimeValue = d.createElement('span');
        var add: MultitrackRuntimeValue = makeButton('+', 'Add Channel', false, 'pk_mt_add');
        label.textContent = 'Channels';
        btn_clear_mute = makeButton('M', 'Clear Mute', false, 'pk_mt_clear pk_mt_mute pk_inact');
        btn_clear_solo = makeButton('S', 'Clear Solo', false, 'pk_mt_clear pk_mt_solo pk_inact');
        add.onclick = function (this: MultitrackRuntimeValue) {
          addTrack();
        };
        btn_clear_mute.onclick = function (
          this: MultitrackRuntimeValue,
          e?: MultitrackRuntimeValue,
        ) {
          e.stopPropagation();
          clearTrackFlag('mute', 'Clear Mute');
        };
        btn_clear_solo.onclick = function (
          this: MultitrackRuntimeValue,
          e?: MultitrackRuntimeValue,
        ) {
          e.stopPropagation();
          clearTrackFlag('solo', 'Clear Solo');
        };
        head.appendChild(add);
        head.appendChild(label);
        head.appendChild(btn_clear_mute);
        head.appendChild(btn_clear_solo);
      }
      function addTrack(this: MultitrackRuntimeValue, index?: MultitrackRuntimeValue) {
        var prev: MultitrackRuntimeValue = cloneState();
        var tr: MultitrackRuntimeValue = makeTrack();
        tr.name = 'Channel ' + (tracks.length + 1);
        if (index === undefined) tracks.push(tr);
        else tracks.splice(Math.max(0, Math.min(index, tracks.length)), 0, tr);
        selected_track = tr.id;
        pushState(prev, 'Add Channel');
        render();
        scrollTrackIntoView(tr.id);
        app.fireEvent('DidUpdateMultitrack');
      }
      function attachToolbarButton(this: MultitrackRuntimeValue) {
        var actions: MultitrackRuntimeValue = app.el.getElementsByClassName('pk_hdr')[0];
        if (!actions) return;
        btn_toggle = d.createElement('button');
        btn_toggle.setAttribute('tabIndex', -1);
        btn_toggle.className = 'pk_mt_topbtn';
        btn_toggle.setAttribute('data-label', 'MultiTrack');
        btn_toggle.innerHTML = 'MultiTrack<em>Beta</em>';
        btn_toggle.onclick = function (this: MultitrackRuntimeValue) {
          Toggle();
          this.blur();
        };
        actions.appendChild(btn_toggle);
      }
      function attachBeatToolbar(this: MultitrackRuntimeValue) {
        var toolbar: MultitrackRuntimeValue = app.el.getElementsByClassName('pk_tb')[0];
        var sel: MultitrackRuntimeValue =
          toolbar && toolbar.getElementsByClassName('pk_selection')[0];
        if (!toolbar) return;
        beat_bar = d.createElement('div');
        beat_bar.className = 'pk_mtbeat';
        var beatLabel: MultitrackRuntimeValue = 'BEAT';
        var snapLabel: MultitrackRuntimeValue = 'SNAP';
        var bpmTitle: MultitrackRuntimeValue = 'BPM';
        btn_beat = makeButton(beatLabel, 'Toggle Beat Markers', beat_on, 'pk_btn pk_mtbeat_btn');
        btn_snap = makeButton(
          snapLabel,
          'Snap to Beat Markers',
          false,
          'pk_btn pk_mtbeat_btn pk_mtbeat_snap',
        );
        btn_sig = makeButton(beat_sig, 'Time Signature', false, 'pk_btn pk_mtbeat_sig');
        bpm_input = d.createElement('input');
        var lbl: MultitrackRuntimeValue = d.createElement('b');
        bpm_input.className = 'pk_mtbeat_bpm pk_bpm';
        bpm_input.type = 'text';
        bpm_input.inputMode = 'numeric';
        bpm_input.pattern = '[0-9]*';
        bpm_input.title = bpmTitle;
        bpm_input.value = beat_bpm;
        lbl.textContent = bpmTitle;
        btn_beat.onclick = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          e.stopPropagation();
          setBeatOn(!beat_on);
          this.blur();
        };
        btn_snap.onclick = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          e.stopPropagation();
          if (beat_on) setBeatSnap(!beat_snap);
          this.blur();
        };
        btn_sig.onclick = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          e.stopPropagation();
          cycleBeatSig();
          this.blur();
        };
        bpm_input.onmousedown = stopTrackInputEvent;
        bpm_input.onclick = stopTrackInputEvent;
        bpm_input.onkeydown = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          e.stopPropagation();
          if (e.keyCode === 13) bpm_input.blur();
          if (e.metaKey || e.ctrlKey || e.altKey || e.key.length > 1) return;
          if (!/[0-9]/.test(e.key)) e.preventDefault();
        };
        bpm_input.oninput = function (this: MultitrackRuntimeValue) {
          var clean: MultitrackRuntimeValue = bpm_input.value.replace(/\D/g, '');
          if (bpm_input.value !== clean) bpm_input.value = clean;
          var val: MultitrackRuntimeValue = parseFloat(clean);
          if (val > 0) setBeatBpm(val, true);
          syncBpmRange();
        };
        bpm_input.onchange = function (this: MultitrackRuntimeValue) {
          setBeatBpm(bpm_input.value);
        };
        bpm_input.onblur = function (this: MultitrackRuntimeValue) {
          setBeatBpm(bpm_input.value);
        };
        bpm_input.onfocus = showBpmRange;
        beat_bar.appendChild(btn_beat);
        beat_bar.appendChild(btn_snap);
        beat_bar.appendChild(bpm_input);
        beat_bar.appendChild(lbl);
        beat_bar.appendChild(btn_sig);
        if (sel && sel.nextSibling) toolbar.insertBefore(beat_bar, sel.nextSibling);
        else toolbar.appendChild(beat_bar);
        updateBeatUI();
      }
      function showBpmRange(this: MultitrackRuntimeValue) {
        if (!bpm_input || bpm_range) return;
        bpm_range = d.createElement('div');
        bpm_range.className = 'pk_pgeq_freq pk_bpm pk_mtbeat_rng';
        bpm_range.innerHTML =
          '<div class="pk_arr"></div><input type="range" min="20" max="300" class="pk_horiz pk_bpm" step="1" value="' +
          beat_bpm +
          '">';
        var rng: MultitrackRuntimeValue = bpm_range.getElementsByClassName('pk_horiz')[0];
        rng.oninput = function (this: MultitrackRuntimeValue) {
          if (bpm_input.value != this.value) bpm_input.value = this.value;
          setBeatBpm(this.value, true);
        };
        rng.onchange = function (this: MultitrackRuntimeValue) {
          setBeatBpm(this.value);
        };
        d.body.appendChild(bpm_range);
        bpm_input.setAttribute('data-open', '1');
        placeBpmRange();
        bpm_range_down = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          if (!e.target.classList || !e.target.classList.contains('pk_bpm')) closeBpmRange();
        };
        d.addEventListener('mousedown', bpm_range_down, false);
        w.addEventListener('resize', closeBpmRange, false);
      }
      function syncBpmRange(this: MultitrackRuntimeValue) {
        var rng: MultitrackRuntimeValue =
          bpm_range && bpm_range.getElementsByClassName('pk_horiz')[0];
        if (rng && rng.value != beat_bpm) rng.value = beat_bpm;
      }
      function placeBpmRange(this: MultitrackRuntimeValue) {
        if (!bpm_range || !bpm_input) return;
        var r: MultitrackRuntimeValue = bpm_input.getBoundingClientRect();
        var wdt: MultitrackRuntimeValue = 262;
        bpm_range.style.position = 'fixed';
        bpm_range.style.left =
          Math.max(8, Math.min(w.innerWidth - wdt - 8, r.left + r.width / 2 - wdt / 2)) + 'px';
        bpm_range.style.top = r.bottom + 8 + 'px';
      }
      function closeBpmRange(this: MultitrackRuntimeValue) {
        if (!bpm_range) return;
        if (bpm_range.parentNode) bpm_range.parentNode.removeChild(bpm_range);
        bpm_range = null;
        if (bpm_input) bpm_input.removeAttribute('data-open');
        if (bpm_range_down) {
          d.removeEventListener('mousedown', bpm_range_down);
          bpm_range_down = null;
        }
        w.removeEventListener('resize', closeBpmRange);
      }
      function IsOn(this: MultitrackRuntimeValue) {
        return on || app.el.classList.contains('pk_mt_on');
      }
      function Toggle(this: MultitrackRuntimeValue, force?: MultitrackRuntimeValue) {
        on = force === undefined ? !IsOn() : !!force;
        app.el.classList[on ? 'add' : 'remove']('pk_mt_on');
        if (btn_toggle) btn_toggle.classList[on ? 'add' : 'remove']('pk_act');
        if (!on) {
          cancelRender();
          if (beat_raf) {
            w.cancelAnimationFrame(beat_raf);
            beat_raf = 0;
          }
          closeBpmRange();
          cancelActiveDrag();
          stopFxPreview(true);
          Stop();
          HideMixer();
          emitEditorState();
        } else {
          syncEditingClip();
          app.engine.wavesurfer.pause();
          if (!did_init_zoom) {
            did_init_zoom = true;
            resetHorizontalZoom();
          }
          main.scrollTop = 0;
          tracks_wrap.scrollTop = 0;
          render();
          emitState();
        }
        if (on) app.fireEvent('RequestResize');
        else refreshEditorView();
      }
      function syncScroll(this: MultitrackRuntimeValue) {
        if (!main) return;
        if (!scroll_sync && tracks_wrap && tracks_wrap.scrollTop !== main.scrollTop) {
          scroll_sync = true;
          tracks_wrap.scrollTop = main.scrollTop;
          scroll_sync = false;
        }
        if (main.scrollLeft !== ruler_left) {
          redrawRuler();
          fireZoom();
        }
        requestBeatGrid();
      }
      function syncTrackScroll(this: MultitrackRuntimeValue) {
        if (!main || !tracks_wrap || scroll_sync) return;
        scroll_sync = true;
        main.scrollTop = tracks_wrap.scrollTop;
        scroll_sync = false;
        requestBeatGrid();
      }
      function panView(
        this: MultitrackRuntimeValue,
        x?: MultitrackRuntimeValue,
        y?: MultitrackRuntimeValue,
      ) {
        main.scrollLeft += x || 0;
        main.scrollTop += y || 0;
        clampScroll();
        syncScroll();
      }
      function addTip(
        this: MultitrackRuntimeValue,
        el?: MultitrackRuntimeValue,
        text?: MultitrackRuntimeValue,
      ) {
        var s: MultitrackRuntimeValue = d.createElement('span');
        s.textContent = text;
        el.appendChild(s);
      }
      function makeButton(
        this: MultitrackRuntimeValue,
        text?: MultitrackRuntimeValue,
        title?: MultitrackRuntimeValue,
        active?: MultitrackRuntimeValue,
        cls?: MultitrackRuntimeValue,
      ) {
        var b: MultitrackRuntimeValue = d.createElement('button');
        b.type = 'button';
        b.tabIndex = -1;
        b.className = (cls || '') + (active ? ' pk_act' : '');
        b.appendChild(d.createTextNode(text));
        addTip(b, title);
        return b;
      }
      function addRegionHandles(this: MultitrackRuntimeValue) {
        var l: MultitrackRuntimeValue = d.createElement('handle');
        var r: MultitrackRuntimeValue = d.createElement('handle');
        l.className = 'wavesurfer-handle wavesurfer-handle-start';
        r.className = 'wavesurfer-handle wavesurfer-handle-end';
        region_el.appendChild(l);
        region_el.appendChild(r);
        bindDown(region_el, startRegionEdit);
        region_el.ondblclick = passRegionEventToClip;
      }
      function render(this: MultitrackRuntimeValue) {
        cancelRender();
        if (!el) return;
        lane_by_track = {};
        clip_els = {};
        cleanXfades();
        var old_top: MultitrackRuntimeValue = main ? main.scrollTop : 0;
        rec_el = null;
        rec_canvas = null;
        tracks_el.innerHTML = '';
        if (beat_canvas && beat_canvas.parentNode) beat_canvas.parentNode.removeChild(beat_canvas);
        lanes.innerHTML = '';
        beat_canvas = null;
        var dur: MultitrackRuntimeValue = publishDuration();
        var width: MultitrackRuntimeValue = Math.max(800, (dur * px_per_sec) >> 0);
        var height: MultitrackRuntimeValue = tracksHeight();
        var top: MultitrackRuntimeValue = 0;
        lanes.style.width = width + 'px';
        lanes.style.height = height + 'px';
        ruler.style.width = width + 'px';
        resizeTrackers(height);
        drawRuler(dur, width);
        for (var i: MultitrackRuntimeValue = 0; i < tracks.length; ++i) {
          var h: MultitrackRuntimeValue = trackHeight(tracks[i]);
          renderTrack(tracks[i], top, h);
          top += h;
        }
        var ordered: MultitrackRuntimeValue = clips.slice(0).sort(function (
          this: MultitrackRuntimeValue,
          a?: MultitrackRuntimeValue,
          b?: MultitrackRuntimeValue,
        ) {
          if (a.id === selected_clip) return 1;
          if (b.id === selected_clip) return -1;
          return clipLen(b) - clipLen(a);
        });
        for (var j: MultitrackRuntimeValue = 0; j < ordered.length; ++j) {
          renderClip(ordered[j]);
        }
        renderRecPreview();
        if (empty_el) empty_el.style.display = clips.length ? 'none' : 'block';
        updateHeaderButtons();
        if (main) main.scrollTop = old_top;
        syncScroll();
        renderRegion();
        updatePlayhead();
        updateBeatUI();
        requestBeatGrid();
        fireZoom();
      }
      function renderZoom(this: MultitrackRuntimeValue) {
        if (!el) return;
        var dur: MultitrackRuntimeValue = publishDuration();
        var width: MultitrackRuntimeValue = Math.max(800, (dur * px_per_sec) >> 0);
        lanes.style.width = width + 'px';
        ruler.style.width = width + 'px';
        drawRuler(dur, width);
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i) layoutClip(clips[i]);
        renderRegion();
        updatePlayhead();
        requestBeatGrid();
        fireZoom();
        zoom_dirty = true;
      }
      function finishZoom(this: MultitrackRuntimeValue) {
        if (!zoom_dirty) return;
        zoom_dirty = false;
        render();
      }
      function drawRuler(
        this: MultitrackRuntimeValue,
        dur?: MultitrackRuntimeValue,
        width?: MultitrackRuntimeValue,
      ) {
        var left: MultitrackRuntimeValue = main ? main.scrollLeft : 0;
        var visible: MultitrackRuntimeValue = Math.max(
          1,
          main ? main.clientWidth : ruler.clientWidth || width,
        );
        var ratio: MultitrackRuntimeValue = w.devicePixelRatio || 1;
        ruler_left = left;
        if (!timeline_on) {
          if (ruler.firstChild) ruler.innerHTML = '';
          ruler_canvas = null;
          return;
        }
        if (app.ui && app.ui.drawTimelineRuler) {
          if (!ruler_canvas) {
            ruler.innerHTML = '';
            ruler_canvas = d.createElement('canvas');
            ruler_canvas.className = 'pk_mt_timeline';
            ruler.appendChild(ruler_canvas);
          }
          ruler_canvas.width = (visible * ratio) >> 0;
          ruler_canvas.height = (24 * ratio) >> 0;
          ruler_canvas.style.left = (left >> 0) + 'px';
          ruler_canvas.style.width = visible + 'px';
          ruler_canvas.style.height = '24px';
          var ctx: MultitrackRuntimeValue = ruler_canvas.getContext('2d', { alpha: false });
          ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
          app.ui.drawTimelineRuler(ctx, dur, width, left, visible);
          if (app.mrk) app.mrk.drawMt();
          return;
        }
        ruler.innerHTML = '';
        ruler_canvas = null;
        {
          var step: MultitrackRuntimeValue = dur > 90 ? 10 : 5;
          for (var t: MultitrackRuntimeValue = 0; t <= dur; t += step) {
            var old_tick: MultitrackRuntimeValue = d.createElement('div');
            old_tick.className = 'pk_mt_tick';
            old_tick.style.left = ((t * px_per_sec) >> 0) + 'px';
            old_tick.textContent = formatTime(t);
            ruler.appendChild(old_tick);
          }
        }
        if (app.mrk) app.mrk.drawMt();
      }
      function redrawRuler(this: MultitrackRuntimeValue) {
        if (ruler) drawRuler(duration(), totalPixels());
      }
      function requestBeatGrid(this: MultitrackRuntimeValue) {
        if (!beat_on && !beat_canvas) return;
        if (beat_raf) return;
        beat_raf = w.requestAnimationFrame(function (this: MultitrackRuntimeValue) {
          beat_raf = 0;
          drawBeatGrid();
        });
      }
      function drawBeatGrid(this: MultitrackRuntimeValue) {
        if (!lanes || !main) return;
        if (!beat_on) {
          if (beat_canvas && beat_canvas.parentNode)
            beat_canvas.parentNode.removeChild(beat_canvas);
          beat_canvas = null;
          return;
        }
        if (!beat_canvas || beat_canvas.parentNode !== main) {
          beat_canvas = d.createElement('canvas');
          beat_canvas.className = 'pk_mt_beatgrid';
          main.appendChild(beat_canvas);
        }
        var track_h: MultitrackRuntimeValue = trackerHeight(lanes.offsetHeight || tracksHeight());
        var left: MultitrackRuntimeValue = main.scrollLeft >> 0;
        var width: MultitrackRuntimeValue = Math.max(1, main.clientWidth);
        var height: MultitrackRuntimeValue = Math.min(
          Math.max(1, main.clientHeight - 24),
          Math.max(1, track_h),
        );
        var top: MultitrackRuntimeValue = Math.max(
          0,
          Math.min(main.scrollTop >> 0, Math.max(0, track_h - height)),
        );
        var ratio: MultitrackRuntimeValue = Math.min(2, w.devicePixelRatio || 1);
        var beat_px: MultitrackRuntimeValue = beatStep() * px_per_sec;
        var bar: MultitrackRuntimeValue = beatBar();
        var step: MultitrackRuntimeValue = 1;
        while (beat_px * step < 8) step *= 2;
        beat_canvas.style.display = 'block';
        beat_canvas.style.left = left + 'px';
        beat_canvas.style.top = top + 24 + 'px';
        beat_canvas.style.width = width + 'px';
        beat_canvas.style.height = height + 'px';
        var cw: MultitrackRuntimeValue = (width * ratio) >> 0;
        var ch: MultitrackRuntimeValue = (height * ratio) >> 0;
        if (beat_canvas.width !== cw) beat_canvas.width = cw;
        if (beat_canvas.height !== ch) beat_canvas.height = ch;
        var ctx: MultitrackRuntimeValue = beat_canvas.getContext('2d');
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);
        var first: MultitrackRuntimeValue = Math.max(0, Math.floor(left / beat_px) - 1);
        var last: MultitrackRuntimeValue = Math.ceil((left + width) / beat_px) + 1;
        var n: MultitrackRuntimeValue = first - (first % step);
        ctx.beginPath();
        for (; n <= last; n += step) {
          if (n % bar === 0) continue;
          var x: MultitrackRuntimeValue = ((n * beat_px - left) >> 0) + 0.5;
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        ctx.strokeStyle = 'rgba(90,242,255,.09)';
        ctx.stroke();
        n = first - (first % bar);
        ctx.beginPath();
        for (; n <= last; n += bar) {
          x = ((n * beat_px - left) >> 0) + 0.5;
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        ctx.strokeStyle = 'rgba(240,216,120,.22)';
        ctx.stroke();
      }
      function renderTrack(
        this: MultitrackRuntimeValue,
        track?: MultitrackRuntimeValue,
        top?: MultitrackRuntimeValue,
        h?: MultitrackRuntimeValue,
      ) {
        var row: MultitrackRuntimeValue = d.createElement('div');
        row.className =
          'pk_mt_track' +
          (track.id === selected_track ? ' pk_mt_sel' : '') +
          (h < 72 ? ' pk_mt_compact' : '') +
          (h < 62 ? ' pk_mt_tiny' : '');
        row.setAttribute('data-track', track.id);
        row.style.height = h + 'px';
        var input: MultitrackRuntimeValue = d.createElement('input');
        input.type = 'text';
        input.value = track.name;
        input.spellcheck = false;
        input.onmousedown = stopTrackInputEvent;
        input.onclick = stopTrackInputEvent;
        input.onkeydown = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          e.stopPropagation();
          if (e.keyCode === 13) input.blur();
        };
        input.onfocus = function (this: MultitrackRuntimeValue) {
          input._old = track.name;
        };
        input.onchange = function (this: MultitrackRuntimeValue) {
          var val: MultitrackRuntimeValue = input.value.trim();
          if (!val) val = track.name;
          if (val === track.name) {
            input.value = track.name;
            return;
          }
          var prev: MultitrackRuntimeValue = cloneState();
          track.name = val;
          input.value = val;
          pushState(prev, 'Rename Channel');
        };
        var mute: MultitrackRuntimeValue = makeButton('M', 'Mute', track.mute, 'pk_mt_mute');
        var solo: MultitrackRuntimeValue = makeButton('S', 'Solo', track.solo, 'pk_mt_solo');
        var arm: MultitrackRuntimeValue = makeButton('R', 'Rec Trigger', track.rec, 'pk_mt_rec');
        var del: MultitrackRuntimeValue = makeButton('x', 'Delete Channel', false, 'pk_mt_del');
        var resize: MultitrackRuntimeValue = d.createElement('b');
        resize.className = 'pk_mt_resize';
        mute.onclick = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          e.stopPropagation();
          setTrackFlag(track, 'mute', !track.mute, 'Mute Channel');
        };
        solo.onclick = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          e.stopPropagation();
          setTrackFlag(track, 'solo', !track.solo, 'Solo Channel');
        };
        arm.onclick = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          e.stopPropagation();
          setRecordArm(track, !track.rec);
        };
        del.onclick = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          e.stopPropagation();
          removeTrack(track);
        };
        var pan: MultitrackRuntimeValue = d.createElement('div');
        pan.className = 'pk_mt_knob pk_mt_pan';
        var needle: MultitrackRuntimeValue = d.createElement('i');
        pan.appendChild(needle);
        addTip(pan, 'Pan L/R');
        updateKnob(pan, track.pan);
        bindPan(pan, track);
        var vol: MultitrackRuntimeValue = d.createElement('div');
        vol.className = 'pk_mt_knob pk_mt_vol';
        needle = d.createElement('i');
        vol.appendChild(needle);
        addTip(vol, 'Volume');
        updateVolume(vol, track.vol === undefined ? 1 : track.vol);
        bindVolume(vol, track);
        bindTrackResize(resize, track);
        row.appendChild(input);
        row.appendChild(mute);
        row.appendChild(solo);
        if (app.isMobile) {
          row.appendChild(arm);
          row.appendChild(d.createElement('br'));
        }
        row.appendChild(vol);
        row.appendChild(pan);
        if (!app.isMobile) row.appendChild(arm);
        row.appendChild(del);
        row.appendChild(resize);
        tracks_el.appendChild(row);
        row.onclick = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          if (e.target === input) return;
          blurActive();
          selected_track = track.id;
          render();
        };
        row.onmousedown = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          if (app.isMobile) return;
          var rect: MultitrackRuntimeValue = row.getBoundingClientRect();
          if (rect.bottom - e.clientY < 12) {
            startTrackResize(e, track);
            return;
          }
          if (!isTrackControl(e.target)) startTrackReorder(e, track);
        };
        row.addEventListener('dragover', stopDrag, false);
        row.addEventListener(
          'drop',
          function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
            stopDrag(e);
            selected_track = track.id;
            addFiles(e.dataTransfer.files, track.id, marker);
          },
          false,
        );
        var lane: MultitrackRuntimeValue = d.createElement('div');
        lane.className = 'pk_mt_lane' + (track.id === selected_track ? ' pk_mt_sel' : '');
        lane.style.top = top + 'px';
        lane.style.height = h + 'px';
        lane.setAttribute('data-track', track.id);
        lane.addEventListener('dragover', stopDrag, false);
        lane.addEventListener(
          'drop',
          function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
            stopDrag(e);
            var tid: MultitrackRuntimeValue = this.getAttribute('data-track');
            selected_track = tid;
            addFiles(e.dataTransfer.files, tid, timeFromEvent(e));
          },
          false,
        );
        lanes.appendChild(lane);
        lane_by_track[track.id] = lane;
      }
      function stopTrackInputEvent(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        e.stopPropagation();
      }
      function setTrackFlag(
        this: MultitrackRuntimeValue,
        track?: MultitrackRuntimeValue,
        flag?: MultitrackRuntimeValue,
        value?: MultitrackRuntimeValue,
        desc?: MultitrackRuntimeValue,
      ) {
        if (track[flag] === value) return;
        var prev: MultitrackRuntimeValue = cloneState();
        track[flag] = value;
        pushState(prev, desc);
        refreshMix();
        render();
      }
      function clearTrackFlag(
        this: MultitrackRuntimeValue,
        flag?: MultitrackRuntimeValue,
        desc?: MultitrackRuntimeValue,
      ) {
        if (!hasTrackFlag(flag)) return;
        var prev: MultitrackRuntimeValue = cloneState();
        for (var i: MultitrackRuntimeValue = 0; i < tracks.length; ++i) tracks[i][flag] = false;
        pushState(prev, desc);
        refreshMix();
        render();
      }
      function updateHeaderButtons(this: MultitrackRuntimeValue) {
        updateHeaderButton(btn_clear_mute, hasTrackFlag('mute'));
        updateHeaderButton(btn_clear_solo, hasTrackFlag('solo'));
        updateBeatUI();
      }
      function updateHeaderButton(
        this: MultitrackRuntimeValue,
        btn?: MultitrackRuntimeValue,
        active?: MultitrackRuntimeValue,
      ) {
        if (!btn) return;
        btn.classList[active ? 'add' : 'remove']('pk_act');
        btn.classList[active ? 'remove' : 'add']('pk_inact');
        btn.setAttribute('aria-disabled', active ? 'false' : 'true');
      }
      function cleanBpm(this: MultitrackRuntimeValue, val?: MultitrackRuntimeValue) {
        val = parseFloat(val);
        if (val !== val) return beat_bpm || 120;
        if (val < 20) return 20;
        return Math.min(300, val);
      }
      function cleanSig(this: MultitrackRuntimeValue, val?: MultitrackRuntimeValue) {
        for (var i: MultitrackRuntimeValue = 0; i < beat_sigs.length; ++i)
          if (beat_sigs[i] === val) return val;
        return '4/4';
      }
      function setBeatOn(this: MultitrackRuntimeValue, val?: MultitrackRuntimeValue) {
        beat_on = !!val;
        if (!beat_on) beat_snap = false;
        updateBeatUI();
        requestBeatGrid();
      }
      function setBeatSnap(this: MultitrackRuntimeValue, val?: MultitrackRuntimeValue) {
        beat_snap = beat_on && !!val;
        updateBeatUI();
        requestBeatGrid();
      }
      function setBeatBpm(
        this: MultitrackRuntimeValue,
        val?: MultitrackRuntimeValue,
        soft?: MultitrackRuntimeValue,
      ) {
        var next: MultitrackRuntimeValue = cleanBpm(val);
        if (next !== beat_bpm) {
          beat_bpm = next;
          requestBeatGrid();
        }
        syncBpmRange();
        if (!soft) updateBeatUI();
      }
      function beatStep(this: MultitrackRuntimeValue) {
        return 60 / beat_bpm;
      }
      function beatBar(this: MultitrackRuntimeValue) {
        return parseInt(beat_sig, 10) || 4;
      }
      function cycleBeatSig(this: MultitrackRuntimeValue) {
        for (var i: MultitrackRuntimeValue = 0; i < beat_sigs.length; ++i) {
          if (beat_sigs[i] === beat_sig) {
            beat_sig = beat_sigs[(i + 1) % beat_sigs.length];
            updateBeatUI();
            requestBeatGrid();
            return;
          }
        }
        beat_sig = '4/4';
        updateBeatUI();
        requestBeatGrid();
      }
      function updateBeatUI(this: MultitrackRuntimeValue) {
        if (btn_beat) btn_beat.classList[beat_on ? 'add' : 'remove']('pk_act');
        if (btn_snap) {
          btn_snap.classList[beat_snap ? 'add' : 'remove']('pk_act');
          btn_snap.classList[beat_on ? 'remove' : 'add']('pk_inact');
          btn_snap.setAttribute('aria-disabled', beat_on ? 'false' : 'true');
        }
        if (btn_sig && btn_sig.firstChild) btn_sig.firstChild.nodeValue = beat_sig;
        if (bpm_input && d.activeElement !== bpm_input) bpm_input.value = beat_bpm;
        if (lanes) lanes.classList[beat_on ? 'add' : 'remove']('pk_mt_beats');
      }
      function setRecordArm(
        this: MultitrackRuntimeValue,
        track?: MultitrackRuntimeValue,
        value?: MultitrackRuntimeValue,
      ) {
        var prev: MultitrackRuntimeValue = cloneState();
        var changed: MultitrackRuntimeValue = false;
        for (var i: MultitrackRuntimeValue = 0; i < tracks.length; ++i) {
          if (tracks[i].rec !== (tracks[i] === track && value)) {
            tracks[i].rec = tracks[i] === track && value;
            changed = true;
          }
        }
        if (!changed) return;
        selected_track = track.id;
        pushState(prev, 'Arm Channel');
        render();
      }
      function removeTrack(this: MultitrackRuntimeValue, track?: MultitrackRuntimeValue) {
        if (tracks.length < 2) return;
        var prev: MultitrackRuntimeValue = cloneState();
        for (var i: MultitrackRuntimeValue = tracks.length - 1; i >= 0; --i)
          if (tracks[i].id === track.id) tracks.splice(i, 1);
        for (var j: MultitrackRuntimeValue = clips.length - 1; j >= 0; --j)
          if (clips[j].track === track.id) clips.splice(j, 1);
        if (selected_track === track.id) selected_track = tracks[0] && tracks[0].id;
        cleanXfades();
        pushState(prev, 'Remove Channel');
        queuePlayRefresh(true);
        render();
        app.fireEvent('DidUpdateMultitrack');
      }
      function isTrackControl(this: MultitrackRuntimeValue, node?: MultitrackRuntimeValue) {
        while (node && node !== tracks_el) {
          if (
            /INPUT|BUTTON/.test(node.tagName || '') ||
            (node.classList &&
              (node.classList.contains('pk_mt_knob') || node.classList.contains('pk_mt_resize')))
          )
            return true;
          if (node.classList && node.classList.contains('pk_mt_track')) return false;
          node = node.parentNode;
        }
        return false;
      }
      function updateKnob(
        this: MultitrackRuntimeValue,
        el?: MultitrackRuntimeValue,
        val?: MultitrackRuntimeValue,
      ) {
        el.getElementsByTagName('i')[0].style.transform = 'rotate(' + val * 65 + 'deg)';
        el.setAttribute('data-val', val.toFixed(2));
      }
      function updateVolume(
        this: MultitrackRuntimeValue,
        el?: MultitrackRuntimeValue,
        val?: MultitrackRuntimeValue,
      ) {
        el.getElementsByTagName('i')[0].style.transform = 'rotate(' + (-135 + val * 270) + 'deg)';
        el.setAttribute('data-val', ((val * 100) >> 0) + '%');
      }
      function knobDelta(
        this: MultitrackRuntimeValue,
        e?: MultitrackRuntimeValue,
        x?: MultitrackRuntimeValue,
        y?: MultitrackRuntimeValue,
      ) {
        return e.clientX - x - (e.clientY - y);
      }
      function bindVolume(
        this: MultitrackRuntimeValue,
        knob?: MultitrackRuntimeValue,
        track?: MultitrackRuntimeValue,
      ) {
        var start_x: MultitrackRuntimeValue = 0;
        var start_y: MultitrackRuntimeValue = 0;
        var start_vol: MultitrackRuntimeValue = 1;
        var prev: MultitrackRuntimeValue = null;
        var moved: MultitrackRuntimeValue = false;
        var stop_drag: MultitrackRuntimeValue = null;
        bindDown(knob, function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          e.preventDefault();
          e.stopPropagation();
          prev = cloneState();
          start_x = e.clientX;
          start_y = e.clientY;
          start_vol = track.vol === undefined ? 1 : track.vol;
          moved = false;
          stop_drag = bindDrag(e, move, up);
          setActiveDrag(up);
        });
        knob.ondblclick = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          e.preventDefault();
          e.stopPropagation();
          if (track.vol === 1 || track.vol === undefined) return;
          var p: MultitrackRuntimeValue = cloneState();
          track.vol = 1;
          pushState(p, 'Volume Channel');
          refreshMix();
          render();
        };
        function move(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          var val: MultitrackRuntimeValue = Math.max(
            0,
            Math.min(1, start_vol + knobDelta(e, start_x, start_y) / 90),
          );
          if (Math.abs(val - (track.vol === undefined ? 1 : track.vol)) > 0.001) moved = true;
          track.vol = val;
          updateVolume(knob, val);
          refreshMix();
        }
        function up(this: MultitrackRuntimeValue) {
          if (stop_drag) stop_drag();
          clearActiveDrag(up);
          if (moved) pushState(prev, 'Volume Channel');
        }
      }
      function bindPan(
        this: MultitrackRuntimeValue,
        knob?: MultitrackRuntimeValue,
        track?: MultitrackRuntimeValue,
      ) {
        var start_x: MultitrackRuntimeValue = 0;
        var start_y: MultitrackRuntimeValue = 0;
        var start_pan: MultitrackRuntimeValue = 0;
        var prev: MultitrackRuntimeValue = null;
        var moved: MultitrackRuntimeValue = false;
        var stop_drag: MultitrackRuntimeValue = null;
        bindDown(knob, function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          e.preventDefault();
          e.stopPropagation();
          prev = cloneState();
          start_x = e.clientX;
          start_y = e.clientY;
          start_pan = track.pan;
          moved = false;
          stop_drag = bindDrag(e, move, up);
          setActiveDrag(up);
        });
        knob.ondblclick = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          e.preventDefault();
          e.stopPropagation();
          if (track.pan === 0) return;
          var p: MultitrackRuntimeValue = cloneState();
          track.pan = 0;
          pushState(p, 'Pan Channel');
          refreshMix();
          render();
        };
        function move(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          var val: MultitrackRuntimeValue = Math.max(
            -1,
            Math.min(1, start_pan + knobDelta(e, start_x, start_y) / 80),
          );
          if (Math.abs(val - track.pan) > 0.001) moved = true;
          track.pan = val;
          updateKnob(knob, val);
          refreshMix();
        }
        function up(this: MultitrackRuntimeValue) {
          if (stop_drag) stop_drag();
          clearActiveDrag(up);
          if (moved) pushState(prev, 'Pan Channel');
        }
      }
      function ToggleMixer(this: MultitrackRuntimeValue, force?: MultitrackRuntimeValue) {
        if (force === false) {
          HideMixer();
          return;
        }
        if (!force && mixer_on) {
          HideMixer();
          return;
        }
        if (force === true && mixer_on) return;
        app.fireEvent('RequestShowFreqAn', 'mix', [1, 1]);
      }
      function HideMixer(this: MultitrackRuntimeValue) {
        if (!mixer_on) return;
        app.fireEvent('RequestShowFreqAn', 'mix', [1, mixer_type]);
      }
      function updateMixerButton(this: MultitrackRuntimeValue, val?: MultitrackRuntimeValue) {
        mixer_on = !!val;
        mixer_type = val && val.type;
      }
      function updateMixerMeters(
        this: MultitrackRuntimeValue,
        vals?: MultitrackRuntimeValue,
        master?: MultitrackRuntimeValue,
      ) {
        if (!mixer_on) return;
        mixer_meters.master = dbPct(master);
        for (var i: MultitrackRuntimeValue = 0; i < tracks.length; ++i)
          mixer_meters[tracks[i].id] = dbPct(vals && vals[tracks[i].id]);
      }
      function dbPct(this: MultitrackRuntimeValue, db?: MultitrackRuntimeValue) {
        return db === undefined ? 0 : Math.max(0, Math.min(1, (db + 80) / 80));
      }
      function meterDb(this: MultitrackRuntimeValue, arr?: MultitrackRuntimeValue) {
        var peak: MultitrackRuntimeValue = 0;
        for (var i: MultitrackRuntimeValue = 0; i < arr.length; ++i) {
          var v: MultitrackRuntimeValue = Math.abs(arr[i]);
          if (v > peak) peak = v;
        }
        return peak > 0.00001 ? (20 * Math.log(peak)) / Math.LN10 + 0.001 : -100;
      }
      function MixerData(this: MultitrackRuntimeValue) {
        var list: MultitrackRuntimeValue = [];
        for (var i: MultitrackRuntimeValue = 0; i < tracks.length; ++i) {
          var t: MultitrackRuntimeValue = tracks[i];
          list.push({
            id: t.id,
            name: t.name,
            mute: !!t.mute,
            solo: !!t.solo,
            rec: !!t.rec,
            sel: t.id === selected_track,
            vol: t.vol === undefined ? 1 : t.vol,
            pan: t.pan || 0,
            meter: mixer_meters[t.id] || 0,
          });
        }
        return {
          on: IsOn(),
          tracks: list,
          master: { vol: master_vol, meter: mixer_meters.master || 0 },
        };
      }
      function MixerSet(
        this: MultitrackRuntimeValue,
        id?: MultitrackRuntimeValue,
        key?: MultitrackRuntimeValue,
        val?: MultitrackRuntimeValue,
        done?: MultitrackRuntimeValue,
      ) {
        var t: MultitrackRuntimeValue = id === 'master' ? null : findTrack(id);
        var old: MultitrackRuntimeValue = t
          ? key === 'vol' && t.vol === undefined
            ? 1
            : t[key]
          : master_vol;
        var desc: MultitrackRuntimeValue =
          key === 'pan' ? 'Pan Channel' : id === 'master' ? 'Master Volume' : 'Volume Channel';
        if (key === 'select' && t) {
          selected_track = t.id;
          render();
          return true;
        }
        if (key === 'mute' && t) {
          setTrackFlag(t, 'mute', !!val, 'Mute Channel');
          return true;
        }
        if (key === 'solo' && t) {
          setTrackFlag(t, 'solo', !!val, 'Solo Channel');
          return true;
        }
        if (key === 'rec' && t) {
          setRecordArm(t, !!val);
          return true;
        }
        if (key !== 'vol' && key !== 'pan') return false;
        val =
          key === 'pan'
            ? Math.max(-1, Math.min(1, +val || 0))
            : Math.max(0, Math.min(1, +val || 0));
        if (Math.abs(old - val) > 0.001) {
          if (!mixer_prev) mixer_prev = cloneState();
          mixer_changed = true;
          if (t) t[key] = val;
          else master_vol = val;
          refreshMix();
        }
        if (done && mixer_prev) {
          if (mixer_changed) pushState(mixer_prev, desc);
          mixer_prev = null;
          mixer_changed = false;
          render();
        }
        return true;
      }
      function startTrackResize(
        this: MultitrackRuntimeValue,
        e?: MultitrackRuntimeValue,
        track?: MultitrackRuntimeValue,
      ) {
        var start_y: MultitrackRuntimeValue = 0;
        var start_h: MultitrackRuntimeValue = 0;
        var prev: MultitrackRuntimeValue = null;
        var moved: MultitrackRuntimeValue = false;
        e.preventDefault();
        e.stopPropagation();
        if (!app.ui.InteractionHandler.checkAndSet('multitrack-resize')) return false;
        prev = cloneState();
        start_y = e.clientY;
        start_h = trackHeight(track);
        var stop_drag: MultitrackRuntimeValue = bindDrag(e, move, up);
        setActiveDrag(up);
        function move(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          var h: MultitrackRuntimeValue = Math.max(
            min_track_h,
            Math.min(max_track_h, start_h + e.clientY - start_y),
          );
          if (Math.abs(h - start_h) > 1) moved = true;
          track.h = h / row_h;
          requestRender();
        }
        function up(this: MultitrackRuntimeValue) {
          stop_drag();
          clearActiveDrag(up);
          app.ui.InteractionHandler.forceUnset('multitrack-resize');
          if (moved) pushState(prev, 'Resize Channel');
        }
      }
      function startTrackReorder(
        this: MultitrackRuntimeValue,
        e?: MultitrackRuntimeValue,
        track?: MultitrackRuntimeValue,
      ) {
        var start_y: MultitrackRuntimeValue = e.clientY;
        var start_i: MultitrackRuntimeValue = trackIndex(track.id);
        var prev: MultitrackRuntimeValue = cloneState();
        var moved: MultitrackRuntimeValue = false;
        if (!app.ui.InteractionHandler.checkAndSet('multitrack-order')) return false;
        selected_track = track.id;
        var stop_drag: MultitrackRuntimeValue = bindDrag(e, move, up);
        setActiveDrag(up);
        function move(this: MultitrackRuntimeValue, ev?: MultitrackRuntimeValue) {
          var dy: MultitrackRuntimeValue = Math.abs(ev.clientY - start_y);
          if (!moved && dy < 6) return;
          var rect: MultitrackRuntimeValue = tracks_wrap.getBoundingClientRect();
          var index: MultitrackRuntimeValue = trackIndexAt(ev.clientY - rect.top + main.scrollTop);
          var old: MultitrackRuntimeValue = trackIndex(track.id);
          ev.preventDefault();
          moved = true;
          if (index === old) return;
          tracks.splice(old, 1);
          tracks.splice(index, 0, track);
          requestRender();
        }
        function up(this: MultitrackRuntimeValue) {
          stop_drag();
          clearActiveDrag(up);
          app.ui.InteractionHandler.forceUnset('multitrack-order');
          if (moved && trackIndex(track.id) !== start_i) {
            pushState(prev, 'Reorder Channel');
            app.fireEvent('DidUpdateMultitrack');
          }
        }
      }
      function scrollTrackIntoView(this: MultitrackRuntimeValue, id?: MultitrackRuntimeValue) {
        if (!main) return;
        var top: MultitrackRuntimeValue = trackTop(id);
        var h: MultitrackRuntimeValue = trackHeight(findTrack(id));
        var view: MultitrackRuntimeValue = main.clientHeight - 24;
        if (top < main.scrollTop) main.scrollTop = top;
        else if (top + h > main.scrollTop + view) main.scrollTop = top + h - view;
        syncScroll();
      }
      function moveSelectedTrack(this: MultitrackRuntimeValue, diff?: MultitrackRuntimeValue) {
        if (!selected_track || tracks.length < 2) return true;
        var old: MultitrackRuntimeValue = trackIndex(selected_track);
        var index: MultitrackRuntimeValue = old + diff;
        if (index < 0 || index >= tracks.length) return true;
        var prev: MultitrackRuntimeValue = cloneState();
        var track: MultitrackRuntimeValue = tracks[old];
        tracks.splice(old, 1);
        tracks.splice(index, 0, track);
        pushState(prev, diff < 0 ? 'Move Channel Up' : 'Move Channel Down');
        render();
        scrollTrackIntoView(track.id);
        app.fireEvent('DidUpdateMultitrack');
        return true;
      }
      function selectTrackByOffset(this: MultitrackRuntimeValue, diff?: MultitrackRuntimeValue) {
        if (!tracks.length) return true;
        var old: MultitrackRuntimeValue = selected_track ? trackIndex(selected_track) : -1;
        var index: MultitrackRuntimeValue = old < 0 ? 0 : old + diff;
        if (index < 0) index = 0;
        else if (index >= tracks.length) index = tracks.length - 1;
        if (index === old) return true;
        selected_track = tracks[index].id;
        render();
        scrollTrackIntoView(selected_track);
        app.fireEvent('DidUpdateMultitrack');
        return true;
      }
      function bindTrackResize(
        this: MultitrackRuntimeValue,
        handle?: MultitrackRuntimeValue,
        track?: MultitrackRuntimeValue,
      ) {
        bindDown(handle, function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          startTrackResize(e, track);
        });
      }
      function pairKey(
        this: MultitrackRuntimeValue,
        a?: MultitrackRuntimeValue,
        b?: MultitrackRuntimeValue,
      ) {
        var x: MultitrackRuntimeValue = typeof a === 'string' ? a : a.id;
        var y: MultitrackRuntimeValue = typeof b === 'string' ? b : b.id;
        return x < y ? x + ':' + y : y + ':' + x;
      }
      function activeXfade(
        this: MultitrackRuntimeValue,
        a?: MultitrackRuntimeValue,
        b?: MultitrackRuntimeValue,
      ) {
        return !!xfades[pairKey(a, b)];
      }
      function clipEnd(this: MultitrackRuntimeValue, clip?: MultitrackRuntimeValue) {
        return clip.start + clipLen(clip);
      }
      function overlapOf(
        this: MultitrackRuntimeValue,
        a?: MultitrackRuntimeValue,
        b?: MultitrackRuntimeValue,
      ) {
        if (!a || !b || a.track !== b.track) return null;
        var start: MultitrackRuntimeValue = Math.max(a.start, b.start);
        var end: MultitrackRuntimeValue = Math.min(clipEnd(a), clipEnd(b));
        return end - start > 0.005 ? [start, end] : null;
      }
      function cleanXfades(this: MultitrackRuntimeValue) {
        var keep: MultitrackRuntimeValue = {};
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i) keep[clips[i].id] = 1;
        for (var k in xfades) {
          var ids: MultitrackRuntimeValue = k.split(':');
          if (!keep[ids[0]] || !keep[ids[1]]) delete xfades[k];
        }
      }
      function clipHasXfade(this: MultitrackRuntimeValue, clip?: MultitrackRuntimeValue) {
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i) {
          if (clips[i] === clip) continue;
          if (activeXfade(clip, clips[i]) && overlapOf(clip, clips[i])) return true;
        }
        return false;
      }
      function xfadeState(this: MultitrackRuntimeValue, clip?: MultitrackRuntimeValue) {
        var hit: MultitrackRuntimeValue = false;
        var all: MultitrackRuntimeValue = true;
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i) {
          if (clips[i] === clip || !overlapOf(clip, clips[i])) continue;
          hit = true;
          if (!activeXfade(clip, clips[i])) all = false;
        }
        return hit ? (all ? 2 : 1) : 0;
      }
      var fadeGain: MultitrackRuntimeValue = app.fadeGain;
      function fadeGainAt(
        this: MultitrackRuntimeValue,
        clip?: MultitrackRuntimeValue,
        time?: MultitrackRuntimeValue,
      ) {
        var len: MultitrackRuntimeValue = clipLen(clip);
        var pos: MultitrackRuntimeValue = time - clip.start;
        var gain: MultitrackRuntimeValue = 1;
        var fi: MultitrackRuntimeValue = Math.min(clip.fi || 0, len);
        var fo: MultitrackRuntimeValue = Math.min(clip.fo || 0, len - fi);
        if (fi && pos < fi) gain *= fadeGain(pos / fi);
        if (fo && pos > len - fo) gain *= fadeGain((len - pos) / fo);
        return gain;
      }
      function clipGainAt(
        this: MultitrackRuntimeValue,
        clip?: MultitrackRuntimeValue,
        time?: MultitrackRuntimeValue,
      ) {
        var gain: MultitrackRuntimeValue = 1;
        var hit: MultitrackRuntimeValue = false;
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i) {
          var other: MultitrackRuntimeValue = clips[i];
          if (other === clip || !activeXfade(clip, other)) continue;
          var ov: MultitrackRuntimeValue = overlapOf(clip, other);
          if (!ov || time < ov[0] || time > ov[1]) continue;
          var p: MultitrackRuntimeValue = (time - ov[0]) / Math.max(0.0001, ov[1] - ov[0]);
          var first: MultitrackRuntimeValue =
            clip.start < other.start || (clip.start === other.start && clip.id < other.id);
          gain *= first ? Math.cos(p * Math.PI * 0.5) : Math.sin(p * Math.PI * 0.5);
          hit = true;
        }
        return gain * (hit ? 1 : fadeGainAt(clip, time));
      }
      function setClipFade(
        this: MultitrackRuntimeValue,
        clip?: MultitrackRuntimeValue,
        left?: MultitrackRuntimeValue,
        val?: MultitrackRuntimeValue,
      ) {
        var len: MultitrackRuntimeValue = clipLen(clip);
        var fi: MultitrackRuntimeValue = clip.fi || 0;
        var fo: MultitrackRuntimeValue = clip.fo || 0;
        if (left) fi = Math.max(0, Math.min(val, len - fo));
        else fo = Math.max(0, Math.min(val, len - fi));
        clip.fi = fi < 0.005 ? 0 : fi;
        clip.fo = fo < 0.005 ? 0 : fo;
      }
      function clampClipFades(this: MultitrackRuntimeValue, clip?: MultitrackRuntimeValue) {
        setClipFade(clip, 1, clip.fi || 0);
        setClipFade(clip, 0, clip.fo || 0);
      }
      function toggleXfade(this: MultitrackRuntimeValue) {
        var clip: MultitrackRuntimeValue = findClip(selected_clip);
        if (!clip) return false;
        var pairs: MultitrackRuntimeValue = [];
        var all_on: MultitrackRuntimeValue = true;
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i) {
          var other: MultitrackRuntimeValue = clips[i];
          if (other === clip || !overlapOf(clip, other)) continue;
          var key: MultitrackRuntimeValue = pairKey(clip, other);
          pairs.push(key);
          if (!xfades[key]) all_on = false;
        }
        if (!pairs.length) {
          OneUp('No overlap on this channel', 1200);
          return true;
        }
        var prev: MultitrackRuntimeValue = cloneState();
        for (i = 0; i < pairs.length; ++i) {
          if (all_on) delete xfades[pairs[i]];
          else xfades[pairs[i]] = 1;
        }
        pushState(prev, all_on ? 'Remove Crossfade' : 'Crossfade Clip');
        queuePlayRefresh(true);
        render();
        OneUp(all_on ? 'Removed Crossfade' : 'Crossfade Clip', 900);
        return true;
      }
      function placeFadeHandles(
        this: MultitrackRuntimeValue,
        ce?: MultitrackRuntimeValue,
        clip?: MultitrackRuntimeValue,
        cw?: MultitrackRuntimeValue,
      ) {
        var l: MultitrackRuntimeValue = ce.getElementsByClassName('pk_mt_fade_l')[0];
        var r: MultitrackRuntimeValue = ce.getElementsByClassName('pk_mt_fade_r')[0];
        var max: MultitrackRuntimeValue = Math.max(0, cw - 10);
        if (l)
          l.style.left = Math.max(0, Math.min(max, ((clip.fi || 0) * px_per_sec - 5) >> 0)) + 'px';
        if (r)
          r.style.right = Math.max(0, Math.min(max, ((clip.fo || 0) * px_per_sec - 5) >> 0)) + 'px';
      }
      function layoutClip(this: MultitrackRuntimeValue, clip?: MultitrackRuntimeValue) {
        var ce: MultitrackRuntimeValue = clip_els[clip.id];
        if (!ce) return;
        var cw: MultitrackRuntimeValue = Math.max(clip_min_w, (clipLen(clip) * px_per_sec) >> 0);
        ce.style.left = ((clip.start * px_per_sec) >> 0) + 'px';
        ce.style.width = cw + 'px';
        placeFadeHandles(ce, clip, cw);
      }
      function renderClip(this: MultitrackRuntimeValue, clip?: MultitrackRuntimeValue) {
        var lane: MultitrackRuntimeValue = lane_by_track[clip.track];
        if (!lane) return;
        var has_xf: MultitrackRuntimeValue = clipHasXfade(clip);
        var track: MultitrackRuntimeValue = findTrack(clip.track);
        var cw: MultitrackRuntimeValue = Math.max(clip_min_w, (clipLen(clip) * px_per_sec) >> 0);
        var ch: MultitrackRuntimeValue = Math.max(30, trackHeight(track) - 16);
        var ce: MultitrackRuntimeValue = d.createElement('div');
        var tc: MultitrackRuntimeValue = trackColor(clip.track);
        ce.className =
          'pk_mt_clip' +
          (clip.id === selected_clip ? ' pk_mt_clip_sel' : '') +
          (has_xf ? ' pk_mt_clip_xf' : '') +
          (track && track.mute ? ' pk_mt_clip_muted' : '');
        ce.setAttribute('data-clip', clip.id);
        ce.style.left = ((clip.start * px_per_sec) >> 0) + 'px';
        ce.style.width = cw + 'px';
        ce.style.height = ch + 'px';
        ce.style.setProperty('--mt-bg', tc[0]);
        ce.style.setProperty('--mt-br', tc[2]);
        var label: MultitrackRuntimeValue = d.createElement('span');
        label.textContent = clip.name || 'Audio';
        var canvas: MultitrackRuntimeValue = d.createElement('canvas');
        var trim_l: MultitrackRuntimeValue = d.createElement('i');
        var trim_r: MultitrackRuntimeValue = d.createElement('i');
        trim_l.className = 'pk_mt_trim pk_mt_trim_l';
        trim_r.className = 'pk_mt_trim pk_mt_trim_r';
        ce.appendChild(canvas);
        ce.appendChild(trim_l);
        ce.appendChild(trim_r);
        if (clip.id === selected_clip) {
          var fade_l: MultitrackRuntimeValue = d.createElement('b');
          var fade_r: MultitrackRuntimeValue = d.createElement('b');
          fade_l.className = 'pk_mt_fade pk_mt_fade_l';
          fade_r.className = 'pk_mt_fade pk_mt_fade_r';
          ce.appendChild(fade_l);
          ce.appendChild(fade_r);
          placeFadeHandles(ce, clip, cw);
        }
        ce.appendChild(label);
        if (has_xf) {
          var xf: MultitrackRuntimeValue = d.createElement('em');
          xf.textContent = 'XF';
          ce.appendChild(xf);
        }
        lane.appendChild(ce);
        clip_els[clip.id] = ce;
        drawWave(clip, canvas, cw, ch, tc);
        bindClipDrag(ce, clip);
        ce.ondblclick = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          e.preventDefault();
          e.stopPropagation();
          selectClip(clip);
          loadClip(clip);
        };
      }
      function selectClip(this: MultitrackRuntimeValue, clip?: MultitrackRuntimeValue) {
        if (selected_clip === clip.id && selected_track === clip.track) {
          app.fireEvent('DidSelectClip', clip);
          return;
        }
        selected_clip = clip.id;
        selected_track = clip.track;
        render();
        app.fireEvent('DidSelectClip', clip);
      }
      function clearSelectedClip(this: MultitrackRuntimeValue, silent?: MultitrackRuntimeValue) {
        if (!selected_clip) return false;
        stopFxPreview(true);
        selected_clip = null;
        app.fireEvent('DidDeselectClip');
        if (!silent) app.fireEvent('DidDestroyRegion');
        render();
        return true;
      }
      function regionTrack(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        var node: MultitrackRuntimeValue = e.target;
        while (node && node !== main) {
          if (node.getAttribute && node.getAttribute('data-track'))
            return node.getAttribute('data-track');
          node = node.parentNode;
        }
        return null;
      }
      function makeRegion(
        this: MultitrackRuntimeValue,
        start?: MultitrackRuntimeValue,
        end?: MultitrackRuntimeValue,
        loop?: MultitrackRuntimeValue,
      ) {
        return {
          id: 't',
          start: start,
          end: end,
          loop: !!loop,
          mt: true,
          element: region_el,
        };
      }
      function setRegion(
        this: MultitrackRuntimeValue,
        start?: MultitrackRuntimeValue,
        end?: MultitrackRuntimeValue,
        seek?: MultitrackRuntimeValue,
      ) {
        var a: MultitrackRuntimeValue = clampTime(start);
        var b: MultitrackRuntimeValue = clampTime(end);
        if (b < a) {
          var t: MultitrackRuntimeValue = a;
          a = b;
          b = t;
        }
        if (b - a < 0.005) return clearRegion();
        region = makeRegion(a, b, region && region.loop);
        if (seek && !play) setCursorTime(region.start);
        else setMarkerTime(region.start);
        renderRegion();
        app.fireEvent('DidCreateRegion', region);
        return region;
      }
      function finishRegionUpdate(this: MultitrackRuntimeValue) {
        if (!region) return;
        if (!play) {
          setCursorTime(region.start);
          return;
        }
        if (!region.loop) return;
        var at: MultitrackRuntimeValue = playingCursor();
        if (at < region.start || at >= region.end) setCursorTime(region.start);
      }
      function clearRegion(this: MultitrackRuntimeValue) {
        if (!region) return false;
        region = null;
        renderRegion();
        app.fireEvent('DidSetLoop', 0);
        app.fireEvent('DidDestroyRegion');
        return true;
      }
      function clearRegionForClipClick(
        this: MultitrackRuntimeValue,
        clip?: MultitrackRuntimeValue,
        e?: MultitrackRuntimeValue,
      ) {
        if (!region) return false;
        if (clip && clip.id !== selected_clip) {
          var at: MultitrackRuntimeValue = timeFromEvent(e);
          if (at >= region.start && at < region.end) return false;
        }
        return clearRegion();
      }
      function renderRegion(this: MultitrackRuntimeValue) {
        if (!region_el) return;
        if (!region) {
          region_el.style.display = 'none';
          return;
        }
        var start: MultitrackRuntimeValue = clampTime(region.start);
        var end: MultitrackRuntimeValue = clampTime(region.end);
        if (end <= start) {
          region_el.style.display = 'none';
          return;
        }
        region_el.style.display = 'block';
        region_el.style.left = ((start * px_per_sec) >> 0) + 'px';
        region_el.style.width = Math.max(1, ((end - start) * px_per_sec) >> 0) + 'px';
      }
      function clipNodeFrom(this: MultitrackRuntimeValue, node?: MultitrackRuntimeValue) {
        while (node && node !== main) {
          if (node.classList && node.classList.contains('pk_mt_clip')) return node;
          node = node.parentNode;
        }
        return null;
      }
      function regionNodeAtEvent(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        var pe: MultitrackRuntimeValue = region_el.style.pointerEvents;
        region_el.style.pointerEvents = 'none';
        var node: MultitrackRuntimeValue = d.elementFromPoint(e.clientX, e.clientY);
        region_el.style.pointerEvents = pe;
        return node;
      }
      function clipNodeAtEvent(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        var node: MultitrackRuntimeValue = regionNodeAtEvent(e);
        return clipNodeFrom(node) ? node : null;
      }
      function clipFromContext(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        var cn: MultitrackRuntimeValue = clipNodeFrom(e.target);
        if (!cn) cn = clipNodeFrom(clipNodeAtEvent(e));
        return cn && findClip(cn.getAttribute('data-clip'));
      }
      function setContextClip(this: MultitrackRuntimeValue, clip?: MultitrackRuntimeValue) {
        if (!clip || findClip(clip.id) !== clip) return null;
        selectClip(clip);
        context_clip = clip;
        return clip;
      }
      function doContextClip(this: MultitrackRuntimeValue, fn?: MultitrackRuntimeValue) {
        var clip: MultitrackRuntimeValue = setContextClip(context_clip);
        return clip && fn(clip);
      }
      function buildClipContext(this: MultitrackRuntimeValue) {
        if (!app._deps.ContextMenu) return;
        mt_context = app._deps.ContextMenu(main);
        mt_context.addOption(
          'Open in Editor',
          function (this: MultitrackRuntimeValue) {
            doContextClip(loadClip);
          },
          false,
        );
        mt_context.addOption(
          'Rename Clip',
          function (this: MultitrackRuntimeValue) {
            doContextClip(renameSelectedClip);
          },
          false,
        );
        mt_context.addOption(
          'Duplicate Clip',
          function (this: MultitrackRuntimeValue) {
            doContextClip(duplicateSelectedClip);
          },
          false,
        );
        mt_context.addOption(
          'Copy Clip',
          function (this: MultitrackRuntimeValue) {
            doContextClip(copySelectedClip);
          },
          false,
        );
        mt_context.addOption(
          'Split Here',
          function (this: MultitrackRuntimeValue) {
            doContextClip(function (this: MultitrackRuntimeValue) {
              splitSelectedClip(context_time);
            });
          },
          false,
        );
        mt_context.addOption(
          'Delete Clip',
          function (this: MultitrackRuntimeValue) {
            doContextClip(deleteSelectedClip);
          },
          false,
        );
        mt_context.addOption(
          'Crossfade',
          function (this: MultitrackRuntimeValue) {
            doContextClip(function (this: MultitrackRuntimeValue, clip?: MultitrackRuntimeValue) {
              xfadeState(clip) && toggleXfade();
            });
          },
          false,
        );
        mt_context.addOption(
          'Fade In',
          function (this: MultitrackRuntimeValue) {
            doContextClip(function (this: MultitrackRuntimeValue) {
              applyFx('FadeIn');
            });
          },
          false,
        );
        mt_context.addOption(
          'Fade Out',
          function (this: MultitrackRuntimeValue) {
            doContextClip(function (this: MultitrackRuntimeValue) {
              applyFx('FadeOut');
            });
          },
          false,
        );
        mt_context.onOpen = function (
          this: MultitrackRuntimeValue,
          menu?: MultitrackRuntimeValue,
          div?: MultitrackRuntimeValue,
        ) {
          var a: MultitrackRuntimeValue = div.childNodes;
          var x: MultitrackRuntimeValue = xfadeState(context_clip);
          a[6].innerHTML = x === 2 ? 'Turn Crossfade Off' : 'Turn Crossfade On';
          a[6].className = 'pk_ctx_action' + (x ? '' : ' pk_inact');
          Pause();
        };
        mt_lane_context = app._deps.ContextMenu(lanes);
        mt_lane_context.addOption(
          'Select Visible View',
          function (this: MultitrackRuntimeValue) {
            app.fireEvent('RequestRegionSet');
          },
          false,
        );
        mt_lane_context.addOption(
          'Add New Channel Here',
          function (this: MultitrackRuntimeValue) {
            addTrack(context_index);
          },
          false,
        );
        mt_lane_context.addOption(
          'Reset Zoom',
          function (this: MultitrackRuntimeValue) {
            app.fireEvent('RequestZoomUI', 0);
          },
          false,
        );
        mt_lane_context.addOption(
          'Add Silence',
          function (this: MultitrackRuntimeValue) {
            if (context_track) selected_track = context_track;
            setCursorTime(context_time);
            app.fireEvent('RequestFXUI_Silence');
          },
          false,
        );
        mt_lane_context.onOpen = function (this: MultitrackRuntimeValue) {
          Pause();
        };
      }
      function openLaneContext(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        if (!mt_lane_context || clipFromContext(e)) return false;
        var track: MultitrackRuntimeValue = regionTrack(e);
        if (!track) return false;
        focusMain();
        e.preventDefault();
        e.stopPropagation();
        context_track = track;
        context_index =
          trackIndex(track) +
          (e.clientY >
          lane_by_track[track].getBoundingClientRect().top + lane_by_track[track].offsetHeight / 2
            ? 1
            : 0);
        context_time = timeFromEvent(e);
        mt_lane_context.open(e);
        return true;
      }
      function openClipContext(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        if (pan_dragged) {
          pan_dragged = false;
          return false;
        }
        var clip: MultitrackRuntimeValue = clipFromContext(e);
        if (!clip || !mt_context) return false;
        focusMain();
        e.preventDefault();
        e.stopPropagation();
        context_time = timeFromEvent(e);
        setContextClip(clip);
        mt_context.open(e);
        return true;
      }
      function cloneMouseEvent(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        var ev: MultitrackRuntimeValue = new MouseEvent(e.type, {
          bubbles: true,
          cancelable: true,
          view: w,
          detail: e.detail,
          screenX: e.screenX,
          screenY: e.screenY,
          clientX: e.clientX,
          clientY: e.clientY,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          shiftKey: e.shiftKey,
          metaKey: e.metaKey,
          button: e.button,
          buttons: e.buttons,
        });
        if (e._touch) ev._touch = true;
        return ev;
      }
      function isRegionHandleEvent(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        var cls: MultitrackRuntimeValue = e.target && e.target.classList;
        return !!(
          cls &&
          (cls.contains('wavesurfer-handle-start') || cls.contains('wavesurfer-handle-end'))
        );
      }
      function passMouseEventTo(
        this: MultitrackRuntimeValue,
        target?: MultitrackRuntimeValue,
        e?: MultitrackRuntimeValue,
      ) {
        if (!target) return false;
        e.preventDefault();
        e.stopPropagation();
        target.dispatchEvent(cloneMouseEvent(e));
        return true;
      }
      function passRegionEventToClip(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        if (e._touch) return false;
        if (isRegionHandleEvent(e)) return false;
        return passMouseEventTo(clipNodeAtEvent(e), e);
      }
      function startRegionEdit(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        if (!region || (e.button !== undefined && e.button !== 0)) return;
        if (!isRegionHandleEvent(e)) {
          startRegionBodyEdit(e);
          return;
        }
        focusMain();
        e.preventDefault();
        e.stopPropagation();
        if (!app.ui.InteractionHandler.checkAndSet('multitrack-region')) return;
        var cls: MultitrackRuntimeValue = e.target && e.target.classList;
        var mode: MultitrackRuntimeValue =
          cls && cls.contains('wavesurfer-handle-start')
            ? -1
            : cls && cls.contains('wavesurfer-handle-end')
              ? 1
              : 0;
        var old_start: MultitrackRuntimeValue = region.start;
        var old_end: MultitrackRuntimeValue = region.end;
        var moved: MultitrackRuntimeValue = false;
        var stop_drag: MultitrackRuntimeValue = bindDrag(e, move, up);
        setActiveDrag(up);
        function move(this: MultitrackRuntimeValue, ev?: MultitrackRuntimeValue) {
          var time: MultitrackRuntimeValue = snapTime(timeFromEvent(ev), ev, null, 1);
          ev.preventDefault();
          moved = true;
          setRegion(mode < 0 ? time : old_start, mode < 0 ? old_end : time);
          edgePan(ev, edgeDirFromEvent(ev), move);
        }
        function up(this: MultitrackRuntimeValue) {
          stopEdgePan();
          stop_drag();
          clearActiveDrag(up);
          app.ui.InteractionHandler.forceUnset('multitrack-region');
          if (moved) finishRegionUpdate();
        }
      }
      function startRegionBodyEdit(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        focusMain();
        if (!e._touch) e.preventDefault();
        e.stopPropagation();
        var down_x: MultitrackRuntimeValue = e.clientX;
        var down_y: MultitrackRuntimeValue = e.clientY;
        var down_time: MultitrackRuntimeValue = timeFromEvent(e);
        var last_time: MultitrackRuntimeValue = down_time;
        var old_start: MultitrackRuntimeValue = region.start;
        var old_end: MultitrackRuntimeValue = region.end;
        var is_touch: MultitrackRuntimeValue = e._touch;
        var active: MultitrackRuntimeValue = false;
        var stop_drag: MultitrackRuntimeValue = bindDrag(e, move, up);
        setActiveDrag(up);
        function move(this: MultitrackRuntimeValue, ev?: MultitrackRuntimeValue) {
          var dx: MultitrackRuntimeValue = ev.clientX - down_x;
          var dy: MultitrackRuntimeValue = ev.clientY - down_y;
          if (!active) {
            if (Math.abs(dx) + Math.abs(dy) < 5) return;
            if (is_touch && Math.abs(dy) > Math.abs(dx)) {
              up();
              return;
            }
            if (!app.ui.InteractionHandler.checkAndSet('multitrack-region')) {
              up(ev);
              return;
            }
            active = true;
          }
          var len: MultitrackRuntimeValue = old_end - old_start;
          var time: MultitrackRuntimeValue = timeFromEvent(ev);
          var start: MultitrackRuntimeValue = Math.max(
            0,
            Math.min(duration() - len, old_start + time - down_time),
          );
          var a: MultitrackRuntimeValue = snapTime(start, ev, null, 1);
          var b: MultitrackRuntimeValue = snapTime(start + len, ev, null, 1) - len;
          start = Math.max(
            0,
            Math.min(duration() - len, Math.abs(a - start) < Math.abs(b - start) ? a : b),
          );
          ev.preventDefault();
          setRegion(start, start + len);
          edgePan(ev, edgeDirFromRegion(time, last_time), move);
          last_time = time;
        }
        function up(this: MultitrackRuntimeValue, ev?: MultitrackRuntimeValue) {
          stopEdgePan();
          stop_drag();
          clearActiveDrag(up);
          if (active) {
            app.ui.InteractionHandler.forceUnset('multitrack-region');
            finishRegionUpdate();
            return;
          }
          if (!ev) return;
          var target: MultitrackRuntimeValue = regionNodeAtEvent(ev);
          var clip_node: MultitrackRuntimeValue = clipNodeFrom(target);
          var clip: MultitrackRuntimeValue =
            clip_node && findClip(clip_node.getAttribute('data-clip'));
          if (clip) {
            clearRegionForClipClick(clip, ev);
            selectClip(clip);
            if (!ev.shiftKey) setClickTime(snapTime(timeFromEvent(ev), ev), false);
            return;
          }
          var track: MultitrackRuntimeValue = regionTrack({ target: target });
          if (track) selected_track = track;
          clearSelectedClip(true);
          clearRegion();
          setClickTime(snapTime(timeFromEvent(ev), ev), false);
          render();
        }
      }
      function drawClipFades(
        this: MultitrackRuntimeValue,
        ctx?: MultitrackRuntimeValue,
        clip?: MultitrackRuntimeValue,
        wdt?: MultitrackRuntimeValue,
        hgt?: MultitrackRuntimeValue,
      ) {
        var dur: MultitrackRuntimeValue = clipLen(clip);
        if (dur <= 0 || !(clip.fi || clip.fo)) return;
        var fi: MultitrackRuntimeValue = Math.min(wdt, ((clip.fi || 0) / dur) * wdt);
        var fo: MultitrackRuntimeValue = Math.min(wdt, ((clip.fo || 0) / dur) * wdt);
        ctx.strokeStyle = 'rgba(240,216,120,.75)';
        ctx.fillStyle = 'rgba(240,216,120,.08)';
        if (fi > 1) {
          ctx.beginPath();
          ctx.moveTo(0, hgt);
          ctx.lineTo(fi, 0);
          ctx.lineTo(fi, hgt);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(0, hgt);
          ctx.lineTo(fi, 0);
          ctx.stroke();
        }
        if (fo > 1) {
          var x: MultitrackRuntimeValue = wdt - fo;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(wdt, hgt);
          ctx.lineTo(x, hgt);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(wdt, hgt);
          ctx.stroke();
        }
      }
      function drawWave(
        this: MultitrackRuntimeValue,
        clip?: MultitrackRuntimeValue,
        canvas?: MultitrackRuntimeValue,
        w?: MultitrackRuntimeValue,
        h?: MultitrackRuntimeValue,
        tone?: MultitrackRuntimeValue,
      ) {
        var buffer: MultitrackRuntimeValue = clip.buffer;
        var pw: MultitrackRuntimeValue = w !== undefined ? w : canvas.parentNode.offsetWidth;
        var ph: MultitrackRuntimeValue = h !== undefined ? h : canvas.parentNode.offsetHeight;
        var wdt: MultitrackRuntimeValue = Math.min(1000, Math.max(64, pw || 64));
        var hgt: MultitrackRuntimeValue = Math.max(22, ph - 8);
        tone = tone || trackColor(clip.track);
        canvas.width = wdt;
        canvas.height = hgt;
        var ctx: MultitrackRuntimeValue = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = tone[0];
        ctx.fillRect(0, 0, wdt, hgt);
        ctx.fillStyle = tone[1];
        var data: MultitrackRuntimeValue = buffer.getChannelData(0);
        var from: MultitrackRuntimeValue = Math.max(0, (clipIn(clip) * buffer.sampleRate) >> 0);
        var to: MultitrackRuntimeValue = Math.min(
          data.length,
          (clipOut(clip) * buffer.sampleRate) >> 0,
        );
        var len: MultitrackRuntimeValue = Math.max(1, to - from);
        var step: MultitrackRuntimeValue = Math.max(1, (len / wdt) >> 0);
        var mid: MultitrackRuntimeValue = hgt >> 1;
        if (step >= wave_peak_step) {
          var peaks: MultitrackRuntimeValue = getWavePeaks(buffer);
          var peak_max: MultitrackRuntimeValue = peaks.max;
          var peak_min: MultitrackRuntimeValue = peaks.min;
          var peak_last: MultitrackRuntimeValue = peak_max.length - 1;
          for (var x: MultitrackRuntimeValue = 0; x < wdt; ++x) {
            var max: MultitrackRuntimeValue = 0;
            var min: MultitrackRuntimeValue = 0;
            var off: MultitrackRuntimeValue = from + x * step;
            var end: MultitrackRuntimeValue = Math.min(to, off + step);
            var p0: MultitrackRuntimeValue = Math.min(peak_last, (off / wave_peak_step) >> 0);
            var p1: MultitrackRuntimeValue = Math.min(peak_last, ((end - 1) / wave_peak_step) >> 0);
            for (var p: MultitrackRuntimeValue = p0; p <= p1; ++p) {
              if (peak_max[p] > max) max = peak_max[p];
              if (peak_min[p] < min) min = peak_min[p];
            }
            ctx.fillRect(x, mid - max * mid, 1, Math.max(1, (max - min) * mid));
          }
          drawClipFades(ctx, clip, wdt, hgt);
          return;
        }
        for (var x2: MultitrackRuntimeValue = 0; x2 < wdt; ++x2) {
          var max2: MultitrackRuntimeValue = 0;
          var min2: MultitrackRuntimeValue = 0;
          var off2: MultitrackRuntimeValue = from + x2 * step;
          for (var j2: MultitrackRuntimeValue = 0; j2 < step; j2 += 24) {
            var v2: MultitrackRuntimeValue = data[off2 + j2] || 0;
            if (v2 > max2) max2 = v2;
            else if (v2 < min2) min2 = v2;
          }
          ctx.fillRect(x2, mid - max2 * mid, 1, Math.max(1, (max2 - min2) * mid));
        }
        drawClipFades(ctx, clip, wdt, hgt);
      }
      function renderRecPreview(this: MultitrackRuntimeValue) {
        if (!rec) return;
        var lane: MultitrackRuntimeValue = lane_by_track[rec.track];
        if (!lane) return;
        if (!rec_el || !rec_el.parentNode) {
          rec_el = d.createElement('div');
          rec_el.className = 'pk_mt_clip pk_mt_rec_clip';
          rec_el.innerHTML = '<canvas></canvas><span>Recording</span>';
          rec_canvas = rec_el.firstChild;
          lane.appendChild(rec_el);
        } else if (!rec_canvas) rec_canvas = rec_el.firstChild;
        var seconds: MultitrackRuntimeValue = Math.max(
          (rec.len || rec.buffers.length * rec.size) / rec.ctx.sampleRate,
          rec.t0 ? (w.performance.now() - rec.t0) / 1000 : 0,
        );
        var cw: MultitrackRuntimeValue = Math.max(clip_min_w, (seconds * px_per_sec) >> 0);
        var ch: MultitrackRuntimeValue = Math.max(30, trackHeight(findTrack(rec.track)) - 16);
        rec_el.style.left = ((rec.start * px_per_sec) >> 0) + 'px';
        rec_el.style.width = cw + 'px';
        rec_el.style.height = ch + 'px';
        drawRecWave(rec.buffers, rec_canvas, cw, ch);
        if (!rec.buffers.length && !rec.stopping && !rec_raf)
          rec_raf = w.requestAnimationFrame(function (this: MultitrackRuntimeValue) {
            rec_raf = 0;
            renderRecPreview();
          });
      }
      function drawRecWave(
        this: MultitrackRuntimeValue,
        buffers?: MultitrackRuntimeValue,
        canvas?: MultitrackRuntimeValue,
        w?: MultitrackRuntimeValue,
        h?: MultitrackRuntimeValue,
      ) {
        var pw: MultitrackRuntimeValue = w !== undefined ? w : canvas.parentNode.offsetWidth;
        var ph: MultitrackRuntimeValue = h !== undefined ? h : canvas.parentNode.offsetHeight;
        var wdt: MultitrackRuntimeValue = Math.min(1000, Math.max(64, pw || 64));
        var hgt: MultitrackRuntimeValue = Math.max(22, ph - 8);
        if (!buffers.length) {
          canvas.width = wdt;
          canvas.height = hgt;
          var bg: MultitrackRuntimeValue = canvas.getContext('2d', { alpha: false });
          bg.fillStyle = '#101008';
          bg.fillRect(0, 0, wdt, hgt);
          return;
        }
        var total: MultitrackRuntimeValue = buffers.length * buffers[0].length;
        var step: MultitrackRuntimeValue = Math.max(1, (total / wdt) >> 0);
        var mid: MultitrackRuntimeValue = hgt >> 1;
        canvas.width = wdt;
        canvas.height = hgt;
        var ctx: MultitrackRuntimeValue = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = '#101008';
        ctx.fillRect(0, 0, wdt, hgt);
        ctx.fillStyle = '#e13030';
        for (var x: MultitrackRuntimeValue = 0; x < wdt; ++x) {
          var max: MultitrackRuntimeValue = 0;
          var min: MultitrackRuntimeValue = 0;
          var off: MultitrackRuntimeValue = x * step;
          for (var j: MultitrackRuntimeValue = 0; j < step; j += 24) {
            var pos: MultitrackRuntimeValue = off + j;
            var b: MultitrackRuntimeValue = buffers[(pos / buffers[0].length) >> 0];
            var v: MultitrackRuntimeValue = b ? b[pos % buffers[0].length] || 0 : 0;
            if (v > max) max = v;
            else if (v < min) min = v;
          }
          ctx.fillRect(x, mid - max * mid, 1, Math.max(1, (max - min) * mid));
        }
      }
      function bindClipDrag(
        this: MultitrackRuntimeValue,
        ce?: MultitrackRuntimeValue,
        clip?: MultitrackRuntimeValue,
      ) {
        var down_x: MultitrackRuntimeValue = 0;
        var down_y: MultitrackRuntimeValue = 0;
        var old_start: MultitrackRuntimeValue = 0;
        var old_track: MultitrackRuntimeValue = null;
        var old_top: MultitrackRuntimeValue = 0;
        var old_h: MultitrackRuntimeValue = 0;
        var old_in: MultitrackRuntimeValue = 0;
        var old_out: MultitrackRuntimeValue = 0;
        var old_fi: MultitrackRuntimeValue = 0;
        var old_fo: MultitrackRuntimeValue = 0;
        var drag_mode: MultitrackRuntimeValue = 0;
        var trim_canvas: MultitrackRuntimeValue = null;
        var trim_redraw: MultitrackRuntimeValue = 0;
        var prev: MultitrackRuntimeValue = null;
        var moved: MultitrackRuntimeValue = false;
        var did_move: MultitrackRuntimeValue = false;
        var stop_drag: MultitrackRuntimeValue = null;
        var last_ns: MultitrackRuntimeValue = 0;
        var stick_t: MultitrackRuntimeValue = null;
        var stick_edge: MultitrackRuntimeValue = 0;
        bindDown(ce, function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          if (e._touch && selected_clip !== clip.id) {
            return startClipTouchSelect(e, clip);
          }
          if ((e.button !== undefined && e.button !== 0) || e.which === 3) return;
          var cls: MultitrackRuntimeValue = e.target && e.target.classList;
          drag_mode =
            cls && cls.contains('pk_mt_trim_l')
              ? 1
              : cls && cls.contains('pk_mt_trim_r')
                ? 2
                : cls && cls.contains('pk_mt_fade_l')
                  ? 3
                  : cls && cls.contains('pk_mt_fade_r')
                    ? 4
                    : 0;
          focusMain();
          if (!e._touch || drag_mode) e.preventDefault();
          e.stopPropagation();
          if (!drag_mode && selected_clip !== clip.id) {
            if (e.shiftKey) {
              selectClip(clip);
              return;
            }
            return startRangeSelect(
              e,
              function (this: MultitrackRuntimeValue, ev?: MultitrackRuntimeValue) {
                setClickTime(snapTime(timeFromEvent(ev || e), ev || e), false);
                clearRegionForClipClick(clip, ev || e);
                selectClip(clip);
              },
            );
          }
          down_x = e.clientX;
          down_y = e.clientY;
          old_start = clip.start;
          old_track = clip.track;
          old_top = trackTop(old_track);
          old_h = trackHeight(findTrack(old_track));
          old_in = clipIn(clip);
          old_out = clipOut(clip);
          old_fi = clip.fi || 0;
          old_fo = clip.fo || 0;
          last_ns = old_start;
          stick_t = null;
          stick_edge = 0;
          prev = cloneState();
          moved = false;
          did_move = false;
          if (!app.ui.InteractionHandler.checkAndSet('multitrack')) return false;
          ce.classList.add('pk_drag');
          if (drag_mode) startTrimView();
          else ce.style.willChange = 'transform';
          stop_drag = bindDrag(e, move, up);
          setActiveDrag(up);
        });
        function startClipTouchSelect(
          this: MultitrackRuntimeValue,
          e?: MultitrackRuntimeValue,
          clip?: MultitrackRuntimeValue,
        ) {
          e.stopPropagation();
          return startRangeSelect(
            e,
            function (this: MultitrackRuntimeValue, ev?: MultitrackRuntimeValue) {
              setCursorTime(snapTime(timeFromEvent(ev), ev));
              clearRegionForClipClick(clip, ev);
              selectClip(clip);
            },
          );
        }
        function startTrimView(this: MultitrackRuntimeValue) {
          trim_canvas = ce.getElementsByTagName('canvas')[0];
          if (!trim_canvas) return;
          ce.style.willChange = 'left,width';
        }
        function updateTrimView(this: MultitrackRuntimeValue) {
          if (!trim_canvas) return;
          if (trim_redraw) return;
          trim_redraw = w.requestAnimationFrame(function (this: MultitrackRuntimeValue) {
            trim_redraw = 0;
            if (!trim_canvas) return;
            drawWave(clip, trim_canvas);
          });
        }
        function clearTrimView(this: MultitrackRuntimeValue) {
          if (trim_redraw) {
            w.cancelAnimationFrame(trim_redraw);
            trim_redraw = 0;
          }
          if (!trim_canvas) return;
          trim_canvas.style.width = '';
          trim_canvas.style.maxWidth = '';
          trim_canvas.style.transform = '';
          trim_canvas.style.transformOrigin = '';
          trim_canvas = null;
        }
        function move(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          var dx: MultitrackRuntimeValue = e.clientX - down_x;
          var dy: MultitrackRuntimeValue = e.clientY - down_y;
          if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return;
          if (!moved && e._touch && !drag_mode && Math.abs(dy) > Math.abs(dx)) {
            up();
            return;
          }
          moved = true;
          did_move = true;
          e.preventDefault();
          if (drag_mode === 1 || drag_mode === 2) {
            trimClip(dx / px_per_sec, e);
            publishDuration();
            var cw: MultitrackRuntimeValue = Math.max(
              clip_min_w,
              (clipLen(clip) * px_per_sec) >> 0,
            );
            ce.style.left = ((clip.start * px_per_sec) >> 0) + 'px';
            ce.style.width = cw + 'px';
            placeFadeHandles(ce, clip, cw);
            updateTrimView();
            queuePlayRefresh();
            return;
          }
          if (drag_mode === 3 || drag_mode === 4) {
            fadeClip(dx / px_per_sec, e);
            placeFadeHandles(ce, clip, Math.max(clip_min_w, (clipLen(clip) * px_per_sec) >> 0));
            updateTrimView();
            queuePlayRefresh();
            return;
          }
          var new_index: MultitrackRuntimeValue = trackIndexAt(old_top + old_h / 2 + dy);
          if (tracks[new_index] && tracks[new_index].id !== clip.track) {
            clip.track = tracks[new_index].id;
            selected_track = clip.track;
            lane_by_track[clip.track].appendChild(ce);
            ce.style.height = Math.max(30, trackHeight(tracks[new_index]) - 16) + 'px';
            stick_edge = 0;
            stick_t = null;
          }
          var ns_raw: MultitrackRuntimeValue = Math.max(0, old_start + dx / px_per_sec);
          var ns: MultitrackRuntimeValue = ns_raw;
          var len: MultitrackRuntimeValue = clipLen(clip);
          if (stick_edge) {
            var raw: MultitrackRuntimeValue = stick_edge < 0 ? ns_raw : ns_raw + len;
            if (Math.abs(raw - stick_t) < snapHoldLimit(stick_t)) raw = stick_t;
            else {
              stick_edge = 0;
              stick_t = null;
            }
            if (stick_edge) ns = stick_edge < 0 ? raw : raw - len;
          }
          if (!stick_edge) {
            var sl: MultitrackRuntimeValue = snapPassTime(ns_raw, last_ns, e, clip);
            var sr: MultitrackRuntimeValue = snapPassTime(ns_raw + len, last_ns + len, e, clip);
            if (sl !== null || sr !== null) {
              if (
                sr === null ||
                (sl !== null && Math.abs(sl - ns_raw) <= Math.abs(sr - ns_raw - len))
              ) {
                stick_edge = -1;
                stick_t = sl;
                ns = sl;
              } else {
                stick_edge = 1;
                stick_t = sr;
                ns = sr - len;
              }
            }
          }
          clip.start = Math.max(0, ns);
          last_ns = ns_raw;
          publishDuration();
          ce.style.transform =
            'translate3d(' + (((clip.start - old_start) * px_per_sec) >> 0) + 'px,0,0)';
          queuePlayRefresh();
        }
        function up(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          if (stop_drag) stop_drag();
          clearActiveDrag(up);
          ce.classList.remove('pk_drag');
          ce.style.transform = '';
          ce.style.willChange = '';
          clearTrimView();
          app.ui.InteractionHandler.forceUnset('multitrack');
          if (
            did_move &&
            (Math.abs(clip.start - old_start) > 0.001 ||
              Math.abs(clipIn(clip) - old_in) > 0.001 ||
              Math.abs(clipOut(clip) - old_out) > 0.001 ||
              Math.abs((clip.fi || 0) - old_fi) > 0.001 ||
              Math.abs((clip.fo || 0) - old_fo) > 0.001 ||
              clip.track !== old_track)
          ) {
            pushState(prev, drag_mode > 2 ? 'Fade Clip' : drag_mode ? 'Trim Clip' : 'Move Clip');
            queuePlayRefresh(true);
            render();
            return;
          }
          if (!e) return;
          if (!e.shiftKey) setClickTime(snapTime(timeFromEvent(e), e), false);
          clearRegionForClipClick(clip, e);
          selectClip(clip);
        }
        function trimClip(
          this: MultitrackRuntimeValue,
          diff?: MultitrackRuntimeValue,
          e?: MultitrackRuntimeValue,
        ) {
          var min: MultitrackRuntimeValue = Math.min(0.05, clip.buffer.duration);
          if (drag_mode === 1) {
            var next_in: MultitrackRuntimeValue = old_in + diff;
            var next_start: MultitrackRuntimeValue = old_start + diff;
            if (next_start < 0) {
              next_in -= next_start;
              next_start = 0;
            }
            if (next_in < 0) {
              next_start -= next_in;
              next_in = 0;
            }
            if (next_in > old_out - min) {
              next_in = old_out - min;
              next_start = old_start + (next_in - old_in);
            }
            next_start = snapTime(next_start, e, clip);
            next_in = old_in + next_start - old_start;
            if (next_in < 0) {
              next_start -= next_in;
              next_in = 0;
            }
            if (next_in > old_out - min) {
              next_in = old_out - min;
              next_start = old_start + (next_in - old_in);
            }
            clip.in = Math.max(0, next_in);
            clip.start = Math.max(0, next_start);
          } else {
            var next_out: MultitrackRuntimeValue = Math.max(
              old_in + min,
              Math.min(clip.buffer.duration, old_out + diff),
            );
            var end: MultitrackRuntimeValue = snapTime(old_start + next_out - old_in, e, clip);
            clip.out = Math.max(
              old_in + min,
              Math.min(clip.buffer.duration, old_in + end - old_start),
            );
          }
          clampClipFades(clip);
        }
        function fadeClip(
          this: MultitrackRuntimeValue,
          diff?: MultitrackRuntimeValue,
          e?: MultitrackRuntimeValue,
        ) {
          if (drag_mode === 3)
            setClipFade(clip, 1, snapTime(clip.start + old_fi + diff, e, clip) - clip.start);
          else {
            var end: MultitrackRuntimeValue = clipEnd(clip);
            setClipFade(clip, 0, end - snapTime(end - old_fo + diff, e, clip));
          }
        }
      }
      function trackIndex(this: MultitrackRuntimeValue, id?: MultitrackRuntimeValue) {
        for (var i: MultitrackRuntimeValue = 0; i < tracks.length; ++i)
          if (tracks[i].id === id) return i;
        return 0;
      }
      function stopDrag(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        e.preventDefault();
        e.stopPropagation();
      }
      function touchDragEvent(
        this: MultitrackRuntimeValue,
        e?: MultitrackRuntimeValue,
        end?: MultitrackRuntimeValue,
      ) {
        if (!e.touches && !e.changedTouches) return e;
        var list: MultitrackRuntimeValue = end ? e.changedTouches : e.touches;
        var t: MultitrackRuntimeValue =
          (list && list[0]) ||
          (e.changedTouches && e.changedTouches[0]) ||
          (e.touches && e.touches[0]);
        if (!t) return null;
        return {
          _touch: true,
          type: 'mousedown',
          target: e.target,
          button: 0,
          buttons: 1,
          detail: 1,
          clientX: t.clientX,
          clientY: t.clientY,
          screenX: t.screenX,
          screenY: t.screenY,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          shiftKey: e.shiftKey,
          metaKey: e.metaKey,
          timeStamp: e.timeStamp,
          preventDefault: function (this: MultitrackRuntimeValue) {
            e.preventDefault();
          },
          stopPropagation: function (this: MultitrackRuntimeValue) {
            e.stopPropagation();
          },
        };
      }
      function bindDown(
        this: MultitrackRuntimeValue,
        el?: MultitrackRuntimeValue,
        fn?: MultitrackRuntimeValue,
      ) {
        el.onmousedown = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
          if (touch_down_time && w.performance.now() - touch_down_time < 700) return;
          return fn(e);
        };
        el.addEventListener(
          'touchstart',
          function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
            if (e.touches.length !== 1) return;
            touch_down_time = w.performance.now();
            var ev: MultitrackRuntimeValue = touchDragEvent(e);
            if (ev) fn(ev);
          },
          { passive: false },
        );
      }
      function bindDrag(
        this: MultitrackRuntimeValue,
        e?: MultitrackRuntimeValue,
        move?: MultitrackRuntimeValue,
        up?: MultitrackRuntimeValue,
      ) {
        if (!e._touch) {
          d.addEventListener('mousemove', move, false);
          d.addEventListener('mouseup', up, false);
          return function (this: MultitrackRuntimeValue) {
            d.removeEventListener('mousemove', move);
            d.removeEventListener('mouseup', up);
          };
        }
        function touchMove(this: MultitrackRuntimeValue, ev?: MultitrackRuntimeValue) {
          if (ev.touches.length !== 1) {
            touchEnd(ev);
            return;
          }
          var t: MultitrackRuntimeValue = touchDragEvent(ev);
          if (t) move(t);
        }
        function touchEnd(this: MultitrackRuntimeValue, ev?: MultitrackRuntimeValue) {
          touch_down_time = w.performance.now();
          var t: MultitrackRuntimeValue = touchDragEvent(ev, true);
          up(t);
        }
        d.addEventListener('touchmove', touchMove, { passive: false });
        d.addEventListener('touchend', touchEnd, false);
        d.addEventListener('touchcancel', touchEnd, false);
        return function (this: MultitrackRuntimeValue) {
          d.removeEventListener('touchmove', touchMove, false);
          d.removeEventListener('touchend', touchEnd, false);
          d.removeEventListener('touchcancel', touchEnd, false);
        };
      }
      function wheelZoom(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        var info: MultitrackRuntimeValue = app.wheelInfo(e);
        e.preventDefault();
        e.stopPropagation();
        if (!hasClips()) return;
        if (info.pinch) {
          var now: MultitrackRuntimeValue = e.timeStamp || w.performance.now();
          if (now - throttle_wheel > 180) wheel_zoom_delta = 0;
          var y: MultitrackRuntimeValue = zeroZoomFlip(info.y, wheel_zoom_delta);
          wheel_zoom_delta = info.y;
          if (!y) return;
          if (now - throttle_wheel < 16) return;
          throttle_wheel = now;
          zoomAtEvent(e, app.wheelZoomFactor(y * 1.45));
          return;
        }
        wheel_zoom_delta = 0;
        if (info.x || info.y) panView(info.x, info.y);
      }
      function zeroZoomFlip(
        this: MultitrackRuntimeValue,
        val?: MultitrackRuntimeValue,
        prev?: MultitrackRuntimeValue,
      ) {
        return val && prev && val < 0 !== prev < 0 ? 0 : val;
      }
      function pinchStep(
        this: MultitrackRuntimeValue,
        e?: MultitrackRuntimeValue,
        delta?: MultitrackRuntimeValue,
        prev?: MultitrackRuntimeValue,
        last?: MultitrackRuntimeValue,
        x?: MultitrackRuntimeValue,
      ) {
        delta = zeroZoomFlip(delta, last || 0);
        if (delta) zoomAtEvent(x === undefined ? e : { clientX: x }, (prev + delta) / prev);
        return delta;
      }
      function beginTouchZoom(this: MultitrackRuntimeValue, info?: MultitrackRuntimeValue) {
        cancelActiveDrag();
        touch_zoom = info;
        touch_zoom.delta = 0;
        touchZoomDoc(true);
      }
      function zoomAtEvent(
        this: MultitrackRuntimeValue,
        e?: MultitrackRuntimeValue,
        factor?: MultitrackRuntimeValue,
      ) {
        var rect: MultitrackRuntimeValue = main.getBoundingClientRect();
        var x: MultitrackRuntimeValue =
          typeof e.clientX === 'number' ? e.clientX : rect.left + main.clientWidth / 2;
        var where: MultitrackRuntimeValue = (x - rect.left) / Math.max(1, main.clientWidth);
        if (where < 0) where = 0;
        else if (where > 1) where = 1;
        zoomTo(
          px_per_sec * factor,
          (main.scrollLeft + where * main.clientWidth) / px_per_sec,
          where,
        );
      }
      function gestureStart(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        e.preventDefault();
        if (!hasClips()) return;
        cancelActiveDrag();
        touch_zoom = null;
        touchZoomDoc(false);
        gesture_zoom = { scale: e.scale || 1, delta: 0 };
      }
      function gestureChange(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        e.preventDefault();
        if (!hasClips()) return;
        if (!gesture_zoom) gestureStart(e);
        var scale: MultitrackRuntimeValue = e.scale || 1;
        var prev: MultitrackRuntimeValue = gesture_zoom.scale || 1;
        gesture_zoom.delta = pinchStep(e, scale - prev, prev, gesture_zoom.delta);
        gesture_zoom.scale = scale;
      }
      function gestureEnd(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        if (e) e.preventDefault();
        gesture_zoom = null;
        finishZoom();
      }
      function touchZoomInfo(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        if (!e.touches || e.touches.length < 2) return null;
        var a: MultitrackRuntimeValue = e.touches[0];
        var b: MultitrackRuntimeValue = e.touches[1];
        var dx: MultitrackRuntimeValue = b.clientX - a.clientX;
        var dy: MultitrackRuntimeValue = b.clientY - a.clientY;
        return {
          x: (a.clientX + b.clientX) / 2,
          dist: Math.sqrt(dx * dx + dy * dy),
        };
      }
      function touchZoomStart(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        if (gesture_zoom) return;
        var info: MultitrackRuntimeValue = touchZoomInfo(e);
        if (!info || !hasClips()) return;
        e.preventDefault();
        e.stopPropagation();
        beginTouchZoom(info);
      }
      function touchZoomMove(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        if (gesture_zoom) return;
        var info: MultitrackRuntimeValue = touchZoomInfo(e);
        if (!info || !hasClips()) return touchZoomEnd();
        e.preventDefault();
        e.stopPropagation();
        if (!touch_zoom) return beginTouchZoom(info);
        if (!touch_zoom.dist || !info.dist) return;
        var now: MultitrackRuntimeValue = w.performance.now();
        if (now - throttle_wheel < 16) return;
        throttle_wheel = now;
        var prev: MultitrackRuntimeValue = touch_zoom;
        info.delta = pinchStep(null, info.dist - prev.dist, prev.dist, prev.delta, info.x);
        touch_zoom = info;
      }
      function touchZoomEnd(this: MultitrackRuntimeValue) {
        touch_zoom = null;
        touchZoomDoc(false);
        if (!gesture_zoom) finishZoom();
      }
      function touchZoomDoc(this: MultitrackRuntimeValue, on?: MultitrackRuntimeValue) {
        if (touch_zoom_doc === on) return;
        var fn: MultitrackRuntimeValue = on ? 'addEventListener' : 'removeEventListener';
        d[fn]('touchmove', touchZoomMove, { passive: false, capture: true });
        d[fn]('touchend', touchZoomEnd, true);
        d[fn]('touchcancel', touchZoomEnd, true);
        touch_zoom_doc = on;
      }
      function timeFromEvent(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        var rect: MultitrackRuntimeValue = lanes.getBoundingClientRect();
        return Math.max(0, (e.clientX - rect.left) / px_per_sec);
      }
      function isRulerEvent(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        var target: MultitrackRuntimeValue = e && e.target;
        if (target === ruler || target === ruler_canvas) return true;
        return !!(
          target &&
          target.classList &&
          (target.classList.contains('pk_mt_tick') || target.classList.contains('pk_mt_timeline'))
        );
      }
      function hoverTime(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        if (e.timeStamp - throttle_hover < 58) return;
        throttle_hover = e.timeStamp;
        app.fireEvent('DidHoverTime', clampTime(timeFromEvent(e)));
      }
      function eachSnap(
        this: MultitrackRuntimeValue,
        skip?: MultitrackRuntimeValue,
        flags?: MultitrackRuntimeValue,
        fn?: MultitrackRuntimeValue,
      ) {
        fn(cursor);
        fn(marker);
        if (!(flags & 1) && region) {
          fn(region.start);
          fn(region.end);
        }
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i) {
          var c: MultitrackRuntimeValue = clips[i];
          if (c === skip) continue;
          if (skip && skip.track && c.track !== skip.track) continue;
          fn(c.start);
          var ce: MultitrackRuntimeValue = clipEnd(c);
          fn(ce);
          if (c.fi) fn(c.start + c.fi);
          if (c.fo) fn(ce - c.fo);
        }
      }
      function snapTime(
        this: MultitrackRuntimeValue,
        t?: MultitrackRuntimeValue,
        e?: MultitrackRuntimeValue,
        skip?: MultitrackRuntimeValue,
        flags?: MultitrackRuntimeValue,
      ) {
        if (e && e.altKey) return Math.max(0, t);
        var lim: MultitrackRuntimeValue = (flags & 1 ? region_snap_px : snap_px) / px_per_sec;
        var best: MultitrackRuntimeValue = t;
        eachSnap(skip, flags, function (this: MultitrackRuntimeValue, v?: MultitrackRuntimeValue) {
          var dlt: MultitrackRuntimeValue = Math.abs(v - t);
          if (dlt < lim) {
            lim = dlt;
            best = v;
          }
        });
        if (beat_on && beat_snap) {
          var beat: MultitrackRuntimeValue = beatStep();
          var val: MultitrackRuntimeValue = Math.round(t / beat) * beat;
          var dlt: MultitrackRuntimeValue = Math.abs(val - t);
          if (dlt < Math.min(lim, beat_snap_px / px_per_sec)) best = val;
        }
        return Math.max(0, best);
      }
      function snapHoldLimit(this: MultitrackRuntimeValue, t?: MultitrackRuntimeValue) {
        if (beat_on && beat_snap) {
          var beat: MultitrackRuntimeValue = beatStep();
          if (Math.abs(Math.round(t / beat) * beat - t) < 0.000001)
            return beat_snap_px / px_per_sec;
        }
        return snap_px / px_per_sec;
      }
      function snapPassTime(
        this: MultitrackRuntimeValue,
        t?: MultitrackRuntimeValue,
        from?: MultitrackRuntimeValue,
        e?: MultitrackRuntimeValue,
        skip?: MultitrackRuntimeValue,
        flags?: MultitrackRuntimeValue,
      ) {
        if (e && e.altKey) return null;
        var lim: MultitrackRuntimeValue = (flags & 1 ? region_snap_px : snap_px) / px_per_sec;
        var best: MultitrackRuntimeValue = null;
        var dir: MultitrackRuntimeValue = t < from ? -1 : t > from ? 1 : 0;
        if (!dir) return null;
        eachSnap(skip, flags, function (this: MultitrackRuntimeValue, v?: MultitrackRuntimeValue) {
          var dlt: MultitrackRuntimeValue = Math.abs(v - t);
          if (dlt >= lim) return;
          if (dir < 0 ? !(from >= v && t <= v) : !(from <= v && t >= v)) return;
          lim = dlt;
          best = v;
        });
        if (beat_on && beat_snap) {
          var beat: MultitrackRuntimeValue = beatStep();
          var val: MultitrackRuntimeValue = Math.round(t / beat) * beat;
          var dlt: MultitrackRuntimeValue = Math.abs(val - t);
          if (
            dlt < Math.min(lim, beat_snap_px / px_per_sec) &&
            (dir < 0 ? from >= val && t <= val : from <= val && t >= val)
          )
            best = val;
        }
        return best;
      }
      function stopEdgePan(this: MultitrackRuntimeValue) {
        edge_pan_dir = 0;
        edge_pan_ev = edge_pan_update = null;
        if (edge_pan_raf) {
          w.cancelAnimationFrame(edge_pan_raf);
          edge_pan_raf = 0;
        }
      }
      function edgePanStep(this: MultitrackRuntimeValue) {
        edge_pan_raf = 0;
        if (!edge_pan_dir || !edge_pan_update || !edge_pan_ev) return;
        var rect: MultitrackRuntimeValue = main.getBoundingClientRect();
        var over: MultitrackRuntimeValue =
          edge_pan_dir < 0
            ? Math.abs(rect.left - edge_pan_ev.clientX)
            : Math.abs(edge_pan_ev.clientX - rect.right);
        var old: MultitrackRuntimeValue = main.scrollLeft;
        main.scrollLeft += edge_pan_dir * (over > 10 ? over / 2 : 1);
        clampScroll();
        if (main.scrollLeft === old) return stopEdgePan();
        redrawRuler();
        fireZoom();
        edge_pan_update(edge_pan_ev);
        if (edge_pan_dir && !edge_pan_raf) edge_pan_raf = w.requestAnimationFrame(edgePanStep);
      }
      function edgePan(
        this: MultitrackRuntimeValue,
        e?: MultitrackRuntimeValue,
        dir?: MultitrackRuntimeValue,
        update?: MultitrackRuntimeValue,
      ) {
        if (!main || GetZoomFactor() <= 1 || !dir) {
          stopEdgePan();
          return;
        }
        edge_pan_ev = e;
        edge_pan_dir = dir;
        edge_pan_update = update;
        if (!edge_pan_raf) edge_pan_raf = w.requestAnimationFrame(edgePanStep);
      }
      function edgeDirFromEvent(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        var rect: MultitrackRuntimeValue = main.getBoundingClientRect();
        var x: MultitrackRuntimeValue = e.clientX - rect.left;
        return x <= 28 ? -1 : x >= rect.width - 28 ? 1 : 0;
      }
      function edgeDirFromRegion(
        this: MultitrackRuntimeValue,
        time?: MultitrackRuntimeValue,
        old_time?: MultitrackRuntimeValue,
      ) {
        var rect: MultitrackRuntimeValue = main.getBoundingClientRect();
        var rr: MultitrackRuntimeValue = region_el.getBoundingClientRect();
        var dir: MultitrackRuntimeValue =
          time < old_time && rr.left >= rect.left
            ? -1
            : time > old_time && rr.right <= rect.right
              ? 1
              : 0;
        if ((dir < 0 && rr.left - rect.left > 28) || (dir > 0 && rect.right - rr.right > 28))
          dir = 0;
        return dir;
      }
      function canRangeSelect(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        if (e.button !== undefined && e.button !== 0) return false;
        if (
          e.target === main ||
          e.target === lanes ||
          e.target === ruler ||
          e.target === ruler_canvas
        )
          return true;
        if (
          e.target.classList &&
          (e.target.classList.contains('pk_mt_tick') ||
            e.target.classList.contains('pk_mt_timeline'))
        )
          return true;
        var cn: MultitrackRuntimeValue = clipNodeFrom(e.target);
        if (cn) return cn.getAttribute('data-clip') !== selected_clip;
        return !!(e.target.classList && e.target.classList.contains('pk_mt_lane'));
      }
      function mainDown(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        if (e.button === 2 || e.which === 3) return startPanDrag(e);
        return startRangeSelect(e);
      }
      function startPanDrag(this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
        if (!hasClips()) return;
        focusMain();
        e.preventDefault();
        e.stopPropagation();
        if (!app.ui.InteractionHandler.checkAndSet('multitrack-pan')) return false;
        pan_dragged = false;
        var x: MultitrackRuntimeValue = e.clientX;
        var y: MultitrackRuntimeValue = e.clientY;
        var down: MultitrackRuntimeValue = e;
        var moved: MultitrackRuntimeValue = false;
        var stop_drag: MultitrackRuntimeValue = bindDrag(e, move, up);
        main.classList.add('pk_grabbing');
        setActiveDrag(up);
        function move(this: MultitrackRuntimeValue, ev?: MultitrackRuntimeValue) {
          var dx: MultitrackRuntimeValue = x - ev.clientX;
          var dy: MultitrackRuntimeValue = y - ev.clientY;
          if (!dx && !dy) return;
          ev.preventDefault();
          moved = pan_dragged = true;
          panView(dx, dy);
          x = ev.clientX;
          y = ev.clientY;
        }
        function up(this: MultitrackRuntimeValue, ev?: MultitrackRuntimeValue) {
          stop_drag();
          clearActiveDrag(up);
          main.classList.remove('pk_grabbing');
          app.ui.InteractionHandler.forceUnset('multitrack-pan');
          if (!moved && openClipContext(down)) skip_context = true;
          if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
          }
        }
        return false;
      }
      function startRangeSelect(
        this: MultitrackRuntimeValue,
        e?: MultitrackRuntimeValue,
        click_cb?: MultitrackRuntimeValue,
      ) {
        if (!hasClips()) return;
        if (!canRangeSelect(e)) return;
        focusMain();
        if (!e._touch) e.preventDefault();
        e.stopPropagation();
        if (e.detail === 2) {
          app.fireEvent('RequestRegionSet');
          return true;
        }
        var seek_on_click: MultitrackRuntimeValue = isRulerEvent(e);
        var track: MultitrackRuntimeValue = regionTrack(e);
        var start: MultitrackRuntimeValue = snapTime(timeFromEvent(e), e, null, 1);
        var down_x: MultitrackRuntimeValue = e.clientX;
        var down_y: MultitrackRuntimeValue = e.clientY;
        var is_touch: MultitrackRuntimeValue = e._touch;
        var active: MultitrackRuntimeValue = false;
        var last: MultitrackRuntimeValue = start;
        if (track) selected_track = track;
        var stop_drag: MultitrackRuntimeValue = bindDrag(e, move, up);
        setActiveDrag(up);
        function move(this: MultitrackRuntimeValue, ev?: MultitrackRuntimeValue) {
          var dx: MultitrackRuntimeValue = ev.clientX - down_x;
          var dy: MultitrackRuntimeValue = ev.clientY - down_y;
          if (!active) {
            if (Math.abs(dx) + Math.abs(dy) < 5) return;
            if (is_touch && Math.abs(dy) > Math.abs(dx)) {
              up();
              return;
            }
            if (!app.ui.InteractionHandler.checkAndSet('multitrack-region')) {
              up(ev);
              return;
            }
            active = true;
            clearSelectedClip(true);
          }
          ev.preventDefault();
          last = snapTime(timeFromEvent(ev), ev, null, 1);
          setRegion(start, last);
          edgePan(ev, edgeDirFromEvent(ev), move);
        }
        function up(this: MultitrackRuntimeValue, ev?: MultitrackRuntimeValue) {
          stopEdgePan();
          stop_drag();
          clearActiveDrag(up);
          if (active) {
            app.ui.InteractionHandler.forceUnset('multitrack-region');
            if (ev) last = snapTime(timeFromEvent(ev), ev, null, 1);
            setRegion(start, last, true);
            if (!region) setClickTime(start, seek_on_click);
          } else {
            if (!ev) return;
            if (click_cb) click_cb(ev);
            else {
              clearSelectedClip(true);
              clearRegion();
              setClickTime(start, seek_on_click);
            }
          }
          render();
        }
      }
      function setClickTime(
        this: MultitrackRuntimeValue,
        time?: MultitrackRuntimeValue,
        seek?: MultitrackRuntimeValue,
      ) {
        if (seek || !play) setCursorTime(time);
        else setMarkerTime(time);
      }
      function setMarkerTime(this: MultitrackRuntimeValue, time?: MultitrackRuntimeValue) {
        marker = clampTime(time);
        updatePlayhead();
      }
      function setCursorTime(this: MultitrackRuntimeValue, time?: MultitrackRuntimeValue) {
        marker = clampTime(time);
        cursor = marker;
        if (play) {
          stopNodes();
          play = null;
          schedulePlayback(true);
        } else {
          app.fireEvent('DidAudioProcess', [cursor, null, w.performance.now()]);
        }
        updatePlayhead();
        fireZoom();
      }
      function SeekTo(this: MultitrackRuntimeValue, progress?: MultitrackRuntimeValue) {
        if (!hasClips()) return;
        if (progress > 1) return;
        setCursorTime(progress * duration());
      }
      function Skip(this: MultitrackRuntimeValue, seconds?: MultitrackRuntimeValue) {
        if (!hasClips()) return;
        setCursorTime((play ? playingCursor() : cursor) + seconds);
      }
      function trackHasClip(this: MultitrackRuntimeValue, id?: MultitrackRuntimeValue) {
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i)
          if (clips[i].track === id) return true;
        return false;
      }
      function emptyTracks(this: MultitrackRuntimeValue, first_id?: MultitrackRuntimeValue) {
        var list: MultitrackRuntimeValue = [];
        var first: MultitrackRuntimeValue = findTrack(first_id);
        if (first && !trackHasClip(first.id)) list.push(first);
        for (var i: MultitrackRuntimeValue = 0; i < tracks.length; ++i) {
          if (tracks[i] !== first && !trackHasClip(tracks[i].id)) list.push(tracks[i]);
        }
        return list;
      }
      function addFiles(
        this: MultitrackRuntimeValue,
        file_list?: MultitrackRuntimeValue,
        track_id?: MultitrackRuntimeValue,
        start?: MultitrackRuntimeValue,
      ) {
        if (!file_list || !file_list.length) return;
        if (LoadSessionFiles(file_list)) return;
        var files: MultitrackRuntimeValue = [];
        for (var i: MultitrackRuntimeValue = 0; i < file_list.length; ++i) files.push(file_list[i]);
        var multi: MultitrackRuntimeValue = files.length > 1;
        if (!multi && !findTrack(track_id)) return;
        var prev: MultitrackRuntimeValue = cloneState();
        var zoom: MultitrackRuntimeValue = captureZoom();
        var pending: MultitrackRuntimeValue = files.length;
        var decoded: MultitrackRuntimeValue = multi ? new Array(files.length) : null;
        var added: MultitrackRuntimeValue = 0;
        var missing_track: MultitrackRuntimeValue = false;
        app.fireEvent('WillDownloadFile');
        files.forEach(function (
          this: MultitrackRuntimeValue,
          file?: MultitrackRuntimeValue,
          index?: MultitrackRuntimeValue,
        ) {
          decodeFile(
            file,
            function (this: MultitrackRuntimeValue, buffer?: MultitrackRuntimeValue) {
              if (multi) {
                decoded[index] = {
                  buffer: buffer,
                  name: file.name || 'Audio',
                };
                done();
                return;
              }
              if (!findTrack(track_id)) {
                missing_track = true;
                done();
                return;
              }
              clips.push(makeClip(track_id, start + index * 0.1, buffer, file.name || 'Audio'));
              ++added;
              done();
            },
            done,
          );
        });
        function done(this: MultitrackRuntimeValue) {
          if (--pending > 0) return;
          app.fireEvent('DidDownloadFile');
          if (multi) {
            var first: MultitrackRuntimeValue = null;
            var targets: MultitrackRuntimeValue = emptyTracks(track_id);
            for (var i: MultitrackRuntimeValue = 0; i < decoded.length; ++i) {
              if (!decoded[i]) continue;
              var track: MultitrackRuntimeValue = targets[added];
              if (!track) {
                track = makeTrack(trackName(decoded[i].name));
                tracks.push(track);
              }
              clips.push(makeClip(track.id, start, decoded[i].buffer, decoded[i].name));
              if (!first) first = track.id;
              ++added;
            }
            if (added) {
              selected_track = first;
              selected_clip = null;
            }
          }
          if (added && (multi || findTrack(track_id))) {
            applyZoom(zoom);
            pushState(prev, multi ? 'Add Tracks' : 'Add Clip');
            queuePlayRefresh(true);
            render();
            restoreZoomScroll(zoom);
            app.fireEvent('DidUpdateMultitrack');
            OneUp(
              'Added ' +
                added +
                (multi ? ' track' + (added === 1 ? '' : 's') : ' clip' + (added === 1 ? '' : 's')),
            );
          } else {
            OneUp(missing_track ? 'Channel removed' : 'Could not decode audio', 1200);
          }
        }
      }
      function makeClip(
        this: MultitrackRuntimeValue,
        track_id?: MultitrackRuntimeValue,
        start?: MultitrackRuntimeValue,
        buffer?: MultitrackRuntimeValue,
        name?: MultitrackRuntimeValue,
      ) {
        return {
          id: 'mc' + clip_uid++,
          track: track_id,
          start: Math.max(0, start || 0),
          in: 0,
          out: buffer.duration,
          fi: 0,
          fo: 0,
          name: name || 'Audio',
          buffer: buffer,
        };
      }
      function copyClipBuffer(this: MultitrackRuntimeValue, clip?: MultitrackRuntimeValue) {
        var src: MultitrackRuntimeValue = clip.buffer;
        var rate: MultitrackRuntimeValue = src.sampleRate;
        var from: MultitrackRuntimeValue = Math.max(0, (clipIn(clip) * rate) >> 0);
        var to: MultitrackRuntimeValue = Math.min(src.length, (clipOut(clip) * rate) >> 0);
        var len: MultitrackRuntimeValue = Math.max(1, to - from);
        var out: MultitrackRuntimeValue = audioCtx().createBuffer(src.numberOfChannels, len, rate);
        for (var i: MultitrackRuntimeValue = 0; i < src.numberOfChannels; ++i)
          out.getChannelData(i).set(src.getChannelData(i).subarray(from, from + len));
        return out;
      }
      function copySelectedClip(this: MultitrackRuntimeValue) {
        var clip: MultitrackRuntimeValue = findClip(selected_clip);
        if (!clip) return true;
        var part: MultitrackRuntimeValue = clipRegionPart(clip);
        var buffer: MultitrackRuntimeValue = copyClipBuffer(part);
        if (app.engine.SetCopyBuff) app.engine.SetCopyBuff(buffer);
        clip_copy = part.region
          ? null
          : {
              buffer: clip.buffer,
              in: clipIn(clip),
              out: clipOut(clip),
              fi: clip.fi || 0,
              fo: clip.fo || 0,
              name: clip.name,
            };
        app.fireEvent('DidCopy', buffer);
        OneUp('Copied clip');
        return true;
      }
      function renameSelectedClip(this: MultitrackRuntimeValue) {
        var clip: MultitrackRuntimeValue = findClip(selected_clip);
        if (!clip) return true;
        var name: MultitrackRuntimeValue = w.prompt('Rename Clip', clip.name || 'Audio');
        if (name === null) return true;
        name = name.replace(/^\s+|\s+$/g, '');
        if (!name || name === clip.name) return true;
        var prev: MultitrackRuntimeValue = cloneState();
        clip.name = name;
        pushState(prev, 'Rename Clip');
        render();
        app.fireEvent('DidUpdateMultitrack');
        return true;
      }
      function duplicateSelectedClip(this: MultitrackRuntimeValue) {
        var clip: MultitrackRuntimeValue = findClip(selected_clip);
        if (!clip) return true;
        var prev: MultitrackRuntimeValue = cloneState();
        var dup: MultitrackRuntimeValue = {
          id: 'mc' + clip_uid++,
          track: clip.track,
          start: clipEnd(clip),
          in: clipIn(clip),
          out: clipOut(clip),
          fi: clip.fi || 0,
          fo: clip.fo || 0,
          name: clip.name,
          buffer: clip.buffer,
        };
        clips.splice(clips.indexOf(clip) + 1, 0, dup);
        selected_track = dup.track;
        selected_clip = dup.id;
        pushState(prev, 'Duplicate Clip');
        queuePlayRefresh(true);
        render();
        app.fireEvent('DidSelectClip', dup);
        app.fireEvent('DidUpdateMultitrack');
        OneUp('Duplicated clip', 900);
        return true;
      }
      function replaceBufferSegment(
        this: MultitrackRuntimeValue,
        src?: MultitrackRuntimeValue,
        from?: MultitrackRuntimeValue,
        old_len?: MultitrackRuntimeValue,
        rendered?: MultitrackRuntimeValue,
      ) {
        var len: MultitrackRuntimeValue = Math.max(1, src.length - old_len + rendered.length);
        var out: MultitrackRuntimeValue = audioCtx().createBuffer(
          src.numberOfChannels,
          len,
          src.sampleRate,
        );
        for (var i: MultitrackRuntimeValue = 0; i < src.numberOfChannels; ++i) {
          var src_data: MultitrackRuntimeValue = src.getChannelData(i);
          var out_data: MultitrackRuntimeValue = out.getChannelData(i);
          var fx_data: MultitrackRuntimeValue = rendered.getChannelData(
            Math.min(i, rendered.numberOfChannels - 1),
          );
          out_data.set(src_data.subarray(0, from));
          out_data.set(fx_data, from);
          out_data.set(src_data.subarray(from + old_len), from + rendered.length);
        }
        return out;
      }
      function disconnectFx(this: MultitrackRuntimeValue, filter?: MultitrackRuntimeValue) {
        if (!filter) return;
        if (filter.length !== undefined) {
          for (var i: MultitrackRuntimeValue = 0; i < filter.length; ++i)
            try {
              filter[i].disconnect();
            } catch (e: MultitrackRuntimeValue) {}
          return;
        }
        try {
          filter.stop && filter.stop(0);
        } catch (e1: MultitrackRuntimeValue) {}
        try {
          filter.disconnect && filter.disconnect();
        } catch (e2: MultitrackRuntimeValue) {}
      }
      function setFxPreviewMeter(
        this: MultitrackRuntimeValue,
        filter?: MultitrackRuntimeValue,
        on?: MultitrackRuntimeValue,
      ) {
        var host: MultitrackRuntimeValue = app.engine && app.engine.FXPreviewHost;
        if (!host) return;
        host.MTPreviewFilter = filter || null;
        host.MTPreviewing = !!on;
      }
      function selectedFxClip(this: MultitrackRuntimeValue) {
        var clip: MultitrackRuntimeValue = findClip(selected_clip);
        if (!clip) OneUp('Select a waveform box first', 1200);
        return clip;
      }
      function clipRegionPart(this: MultitrackRuntimeValue, clip?: MultitrackRuntimeValue) {
        var c: MultitrackRuntimeValue = clipIn(clip);
        var a: MultitrackRuntimeValue = c;
        var b: MultitrackRuntimeValue = clipOut(clip);
        var hit: MultitrackRuntimeValue = false;
        if (region) {
          var x: MultitrackRuntimeValue = Math.max(a, region.start - clip.start + c);
          var y: MultitrackRuntimeValue = Math.min(b, region.end - clip.start + c);
          if (y - x >= 0.005) {
            a = x;
            b = y;
            hit = true;
          }
        }
        return { buffer: clip.buffer, in: a, out: b, region: hit };
      }
      function fxName(this: MultitrackRuntimeValue, id?: MultitrackRuntimeValue) {
        var map: MultitrackRuntimeValue = {
          GAIN: 'Gain',
          FadeIn: 'FadeIn',
          FadeOut: 'FadeOut',
          HardLimit: 'HardLimit',
          PARAMEQ: 'ParametricEQ',
          COMPRESSOR: 'Compressor',
          Compressor: 'Compressor',
          Normalize: 'Normalize',
          NormalizeRMS: 'NormalizeRMS',
          NormalizeLUFS: 'NormalizeLUFS',
          DELAY: 'Delay',
          DISTORT: 'Distortion',
          REVERB: 'Reverb',
          Reverse: 'Reverse',
          Invert: 'Invert',
          RATE: 'Rate',
          SPEED: 'Speed',
        };
        return map[id];
      }
      function fxLabel(this: MultitrackRuntimeValue, name?: MultitrackRuntimeValue) {
        return (
          (
            {
              Gain: 'Gain',
              FadeIn: 'Fade In',
              FadeOut: 'Fade Out',
              HardLimit: 'Hard Limit',
              ParametricEQ: 'Parametric EQ',
              Compressor: 'Compressor',
              Normalize: 'Normalize',
              NormalizeRMS: 'RMS Normalize',
              NormalizeLUFS: 'LUFS Normalize',
              Delay: 'Delay',
              Distortion: 'Distortion',
              Reverb: 'Reverb',
              Reverse: 'Reverse',
              Invert: 'Invert',
              Rate: 'Rate',
              Speed: 'Speed',
            } as MultitrackRuntimeValue
          )[name] || name
        );
      }
      function fxEventName(
        this: MultitrackRuntimeValue,
        id?: MultitrackRuntimeValue,
        preview?: MultitrackRuntimeValue,
      ) {
        var pref: MultitrackRuntimeValue = preview
          ? 'RequestActionFX_PREVIEW_'
          : 'RequestActionFX_';
        return id.substr(0, pref.length) === pref ? fxName(id.substr(pref.length)) : null;
      }
      function stopFxPreview(this: MultitrackRuntimeValue, silent?: MultitrackRuntimeValue) {
        if (!fx_preview) return true;
        if (fx_preview.raf) w.cancelAnimationFrame(fx_preview.raf);
        try {
          fx_preview.source.stop(0);
        } catch (e: MultitrackRuntimeValue) {}
        try {
          fx_preview.source.disconnect();
        } catch (e2: MultitrackRuntimeValue) {}
        try {
          fx_preview.dry.disconnect();
        } catch (e3: MultitrackRuntimeValue) {}
        try {
          fx_preview.wet.disconnect();
        } catch (e4: MultitrackRuntimeValue) {}
        try {
          fx_preview.analyser.disconnect();
        } catch (e5: MultitrackRuntimeValue) {}
        disconnectFx(fx_preview.filter);
        fx_preview.fx && fx_preview.fx.destroy && fx_preview.fx.destroy();
        setFxPreviewMeter(null, false);
        fx_preview = null;
        if (!silent) app.fireEvent('DidStopPreview');
        return true;
      }
      function setFxPreviewOn(this: MultitrackRuntimeValue, on?: MultitrackRuntimeValue) {
        fx_preview_on = !!on;
        if (fx_preview) {
          fx_preview.dry.gain.value = fx_preview_on ? 0 : 1;
          fx_preview.wet.gain.value = fx_preview_on ? 1 : 0;
          if (fx_preview.fx.preview) fx_preview.fx.preview(fx_preview_on, fx_preview.source);
        }
        return fx_preview_on;
      }
      function tickFxPreview(this: MultitrackRuntimeValue) {
        if (!fx_preview) return;
        if (!fx_preview.freq)
          fx_preview.freq = new Uint8Array(fx_preview.analyser.frequencyBinCount);
        fx_preview.analyser.getByteFrequencyData(fx_preview.freq);
        app.fireEvent('DidAudioProcess', [-1, null, w.performance.now()], fx_preview.freq);
        fx_preview.raf = w.requestAnimationFrame(tickFxPreview);
      }
      function toggleFxPreview(this: MultitrackRuntimeValue, val?: MultitrackRuntimeValue) {
        setFxPreviewOn(val === undefined ? !fx_preview_on : !!val);
        app.fireEvent('DidTogglePreview', fx_preview_on);
        return true;
      }
      function analyzeFxLoudness(this: MultitrackRuntimeValue, done?: MultitrackRuntimeValue) {
        var clip: MultitrackRuntimeValue = selectedFxClip();
        var lufs: MultitrackRuntimeValue = app._deps && app._deps.lufs;
        if (!clip || !lufs) {
          done && done(null);
          return true;
        }
        var part: MultitrackRuntimeValue = clipRegionPart(clip);
        done && done(lufs.analyze(copyClipBuffer(part)));
        return true;
      }
      function previewFx(
        this: MultitrackRuntimeValue,
        name?: MultitrackRuntimeValue,
        val?: MultitrackRuntimeValue,
      ) {
        var clip: MultitrackRuntimeValue = selectedFxClip();
        if (!clip) return true;
        var hasSeek: MultitrackRuntimeValue = val && val.seek !== undefined;
        var seek: MultitrackRuntimeValue = hasSeek ? val.seek / 1 : 0;
        if (!(seek > 0)) seek = 0;
        if (hasSeek) val = val.val;
        if (fx_preview) {
          stopFxPreview(hasSeek);
          if (!hasSeek) return true;
        }
        var ctx: MultitrackRuntimeValue = audioCtx();
        var part: MultitrackRuntimeValue = clipRegionPart(clip);
        var buffer: MultitrackRuntimeValue = copyClipBuffer(part);
        var source: MultitrackRuntimeValue = ctx.createBufferSource();
        var fx: MultitrackRuntimeValue = app.engine.GetFX(
          name,
          name === 'Rate' ? 1 / Math.max(0.001, val) : val,
        );
        var wet: MultitrackRuntimeValue = ctx.createGain();
        var dry: MultitrackRuntimeValue = ctx.createGain();
        var analyser: MultitrackRuntimeValue = ctx.createAnalyser();
        var filter: MultitrackRuntimeValue = null;
        source.buffer = buffer;
        source.loop = true;
        source._pkSeek = seek;
        analyser.fftSize = 1024;
        wet.connect(analyser);
        dry.connect(analyser);
        analyser.connect(ctx.destination);
        source.connect(dry);
        filter = fx.filter(ctx, wet, source, buffer.duration, true, seek);
        fx_preview = {
          source: source,
          filter: filter,
          fx: fx,
          ctx: ctx,
          wet: wet,
          dry: dry,
          analyser: analyser,
        };
        setFxPreviewMeter(filter, true);
        setFxPreviewOn(fx_preview_on);
        source.onended = function (this: MultitrackRuntimeValue) {
          if (fx_preview && fx_preview.source === source) stopFxPreview();
        };
        source.start(0, Math.max(0, Math.min(seek, buffer.duration - 1 / buffer.sampleRate)));
        tickFxPreview();
        app.fireEvent('DidStartPreview', seek);
        return true;
      }
      function updateFxPreview(this: MultitrackRuntimeValue, val?: MultitrackRuntimeValue) {
        var host: MultitrackRuntimeValue = app.engine && app.engine.FXPreviewHost;
        if (!fx_preview || !fx_preview.fx.update) return true;
        if (host) host.PreviewFilter = fx_preview.filter;
        fx_preview.fx.update.call(
          host || fx_preview.fx,
          fx_preview.filter,
          fx_preview.ctx,
          val,
          fx_preview.source,
          fx_preview.wet,
        );
        if (host && host.PreviewFilter !== fx_preview.filter)
          fx_preview.filter = host.PreviewFilter;
        setFxPreviewMeter(fx_preview.filter, true);
        try {
          fx_preview.source.connect(fx_preview.dry);
        } catch (e: MultitrackRuntimeValue) {}
        setFxPreviewOn(fx_preview_on);
        return true;
      }
      function applyFx(
        this: MultitrackRuntimeValue,
        name?: MultitrackRuntimeValue,
        val?: MultitrackRuntimeValue,
      ) {
        var clip: MultitrackRuntimeValue = selectedFxClip();
        if (!clip || !app.engine.GetFX) return true;
        stopFxPreview(true);
        Stop();
        var prev: MultitrackRuntimeValue = cloneState();
        var src: MultitrackRuntimeValue = clip.buffer;
        var rate: MultitrackRuntimeValue = src.sampleRate;
        var part: MultitrackRuntimeValue = clipRegionPart(clip);
        var from: MultitrackRuntimeValue = Math.max(0, (clipIn(part) * rate) >> 0);
        var segment: MultitrackRuntimeValue = copyClipBuffer(part);
        var old_len: MultitrackRuntimeValue = segment.length;
        var old_out: MultitrackRuntimeValue = clipOut(clip);
        var new_len: MultitrackRuntimeValue = old_len;
        var fx_val: MultitrackRuntimeValue = val;
        var Ctx: MultitrackRuntimeValue = w.OfflineAudioContext || w.webkitOfflineAudioContext;
        if (name === 'Rate') {
          new_len = Math.max(1, (old_len / Math.max(0.001, val)) >> 0);
          fx_val = new_len / old_len;
        }
        var fx: MultitrackRuntimeValue = app.engine.GetFX(name, fx_val);
        if (name === 'Speed') {
          var fx_dur: MultitrackRuntimeValue = fx.duration
            ? fx.duration(segment.duration)
            : segment.duration / Math.max(0.001, val);
          new_len = Math.max(1, (fx_dur * rate) >> 0);
        }
        var ctx: MultitrackRuntimeValue = new Ctx(segment.numberOfChannels, new_len, rate);
        var source: MultitrackRuntimeValue = ctx.createBufferSource();
        var filter: MultitrackRuntimeValue = null;
        source.buffer = segment;
        filter = fx.filter(ctx, ctx.destination, source, segment.duration);
        source.start(0);
        function done(this: MultitrackRuntimeValue, rendered?: MultitrackRuntimeValue) {
          if (findClip(clip.id) !== clip) return;
          clip.buffer = replaceBufferSegment(src, from, old_len, rendered);
          clip.out = old_out + (rendered.length - old_len) / rate;
          disconnectFx(filter);
          fx.destroy && fx.destroy();
          try {
            source.disconnect();
          } catch (e: MultitrackRuntimeValue) {}
          pushState(prev, 'Apply ' + fxLabel(name) + ' (fx)');
          queuePlayRefresh(true);
          render();
          app.fireEvent('DidUpdateMultitrack');
          OneUp(
            name === 'NormalizeLUFS' && val && val.limited
              ? 'Applied LUFS Normalize (ceiling limited) (fx)'
              : 'Applied ' + fxLabel(name) + ' (fx)',
          );
        }
        var ret: MultitrackRuntimeValue = ctx.startRendering();
        if (ret)
          ret.then(done).catch(function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
            console.log('Rendering failed: ' + e);
          });
        else
          ctx.oncomplete = function (this: MultitrackRuntimeValue, e?: MultitrackRuntimeValue) {
            done(e.renderedBuffer);
          };
        return true;
      }
      function pasteClip(this: MultitrackRuntimeValue) {
        var meta: MultitrackRuntimeValue = clip_copy;
        var buffer: MultitrackRuntimeValue = meta
          ? meta.buffer
          : app.engine.GetCopyBuff && app.engine.GetCopyBuff();
        if (!buffer) return true;
        var track: MultitrackRuntimeValue = selected_track || (tracks[0] && tracks[0].id);
        if (!track) return true;
        var prev: MultitrackRuntimeValue = cloneState();
        var clip: MultitrackRuntimeValue = makeClip(
          track,
          marker,
          buffer,
          meta ? meta.name : 'Paste',
        );
        if (meta) {
          clip.in = meta.in;
          clip.out = meta.out;
          clip.fi = meta.fi || 0;
          clip.fo = meta.fo || 0;
        }
        clips.push(clip);
        selected_track = track;
        selected_clip = clip.id;
        clearRegion();
        setMarkerTime(clip.start);
        pushState(prev, 'Paste Clip');
        queuePlayRefresh(true);
        render();
        app.fireEvent('DidSelectClip', clip);
        app.fireEvent('DidUpdateMultitrack');
        OneUp('Pasted clip', 900);
        return true;
      }
      function makeSilenceBuffer(this: MultitrackRuntimeValue, seconds?: MultitrackRuntimeValue) {
        var ctx: MultitrackRuntimeValue = audioCtx();
        var wv: MultitrackRuntimeValue = app.engine && app.engine.wavesurfer;
        var src: MultitrackRuntimeValue = wv && wv.backend && wv.backend.buffer;
        var rate: MultitrackRuntimeValue = src ? src.sampleRate : ctx.sampleRate;
        var chans: MultitrackRuntimeValue = src ? src.numberOfChannels : 1;
        return ctx.createBuffer(chans, Math.max(1, (seconds * rate) >> 0), rate);
      }
      function contentDuration(this: MultitrackRuntimeValue) {
        var dur: MultitrackRuntimeValue = 0;
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i)
          dur = Math.max(dur, clips[i].start + clipLen(clips[i]));
        return dur;
      }
      function mixSample(
        this: MultitrackRuntimeValue,
        buffer?: MultitrackRuntimeValue,
        channel?: MultitrackRuntimeValue,
        time?: MultitrackRuntimeValue,
      ) {
        var data: MultitrackRuntimeValue = buffer.getChannelData(
          Math.min(channel, buffer.numberOfChannels - 1),
        );
        var pos: MultitrackRuntimeValue = time * buffer.sampleRate;
        var idx: MultitrackRuntimeValue = pos >> 0;
        var frac: MultitrackRuntimeValue = pos - idx;
        var a: MultitrackRuntimeValue = data[idx] || 0;
        var b: MultitrackRuntimeValue = data[idx + 1] || a;
        return a + (b - a) * frac;
      }
      function clipTimelineStart(
        this: MultitrackRuntimeValue,
        clip?: MultitrackRuntimeValue,
        offset?: MultitrackRuntimeValue,
      ) {
        return clip.start + offset - clipIn(clip);
      }
      function applyClipEnvelope(
        this: MultitrackRuntimeValue,
        param?: MultitrackRuntimeValue,
        clip?: MultitrackRuntimeValue,
        base?: MultitrackRuntimeValue,
        when?: MultitrackRuntimeValue,
        offset?: MultitrackRuntimeValue,
        play_len?: MultitrackRuntimeValue,
      ) {
        var start: MultitrackRuntimeValue = clipTimelineStart(clip, offset);
        var end: MultitrackRuntimeValue = start + play_len;
        var points: MultitrackRuntimeValue = [{ t: start, v: base * clipGainAt(clip, start) }];
        function addPoint(this: MultitrackRuntimeValue, t?: MultitrackRuntimeValue) {
          if (t > start && t < end) points.push({ t: t, v: base * clipGainAt(clip, t) });
        }
        function addSteps(
          this: MultitrackRuntimeValue,
          from?: MultitrackRuntimeValue,
          to?: MultitrackRuntimeValue,
        ) {
          if (to <= from) return;
          var steps: MultitrackRuntimeValue = Math.max(4, Math.min(24, ((to - from) / 0.03) >> 0));
          for (var j: MultitrackRuntimeValue = 0; j <= steps; ++j)
            addPoint(from + ((to - from) * j) / steps);
        }
        param.cancelScheduledValues(when);
        if (clip.fi) addSteps(start, Math.min(end, clip.start + clip.fi));
        if (clip.fo) addSteps(Math.max(start, clipEnd(clip) - clip.fo), end);
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i) {
          var other: MultitrackRuntimeValue = clips[i];
          if (other === clip || !activeXfade(clip, other)) continue;
          var ov: MultitrackRuntimeValue = overlapOf(clip, other);
          if (!ov) continue;
          var from: MultitrackRuntimeValue = Math.max(start, ov[0]);
          var to: MultitrackRuntimeValue = Math.min(end, ov[1]);
          if (to <= from) continue;
          addSteps(from, to);
        }
        points.push({ t: end, v: base * clipGainAt(clip, end) });
        points.sort(function (
          this: MultitrackRuntimeValue,
          a?: MultitrackRuntimeValue,
          b?: MultitrackRuntimeValue,
        ) {
          return a.t - b.t;
        });
        param.setValueAtTime(points[0].v, when);
        for (i = 1; i < points.length; ++i) {
          if (points[i].t <= points[i - 1].t + 0.0001) continue;
          param.linearRampToValueAtTime(points[i].v, when + (points[i].t - start));
        }
      }
      function meterAt(this: MultitrackRuntimeValue, time?: MultitrackRuntimeValue) {
        var solo: MultitrackRuntimeValue = hasSolo();
        var vals: MultitrackRuntimeValue = {};
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i) {
          var clip: MultitrackRuntimeValue = clips[i];
          var tr: MultitrackRuntimeValue = findTrack(clip.track);
          var gain: MultitrackRuntimeValue = trackGain(tr, solo);
          if (!tr || gain <= 0 || time < clip.start || time > clipEnd(clip)) continue;
          var src: MultitrackRuntimeValue = clipIn(clip) + time - clip.start;
          var pan: MultitrackRuntimeValue = tr.pan || 0;
          var gl: MultitrackRuntimeValue = gain * (pan > 0 ? 1 - pan : 1);
          var gr: MultitrackRuntimeValue = gain * (pan < 0 ? 1 + pan : 1);
          var env: MultitrackRuntimeValue = clipGainAt(clip, time);
          var l: MultitrackRuntimeValue = mixSample(clip.buffer, 0, src) * gl * env;
          var r: MultitrackRuntimeValue =
            mixSample(clip.buffer, clip.buffer.numberOfChannels > 1 ? 1 : 0, src) * gr * env;
          vals[tr.id] = Math.max(vals[tr.id] || 0, Math.sqrt((l * l + r * r) / 2));
        }
        for (var k in vals)
          vals[k] = vals[k] > 0.00001 ? (20 * Math.log(vals[k])) / Math.LN10 : -100;
        return vals;
      }
      function Mixdown(this: MultitrackRuntimeValue, selection?: MultitrackRuntimeValue) {
        if (!clips.length) return null;
        var ctx: MultitrackRuntimeValue = audioCtx();
        var rate: MultitrackRuntimeValue = clips[0].buffer.sampleRate || ctx.sampleRate;
        var from: MultitrackRuntimeValue = 0;
        var to: MultitrackRuntimeValue = contentDuration();
        if (selection) {
          from = Math.max(0, selection[0] || 0);
          to = Math.max(from, selection[1] || 0);
        }
        if (to <= from) return null;
        var out: MultitrackRuntimeValue = ctx.createBuffer(
          2,
          Math.max(1, ((to - from) * rate) >> 0),
          rate,
        );
        var left: MultitrackRuntimeValue = out.getChannelData(0);
        var right: MultitrackRuntimeValue = out.getChannelData(1);
        var solo: MultitrackRuntimeValue = hasSolo();
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i) {
          var clip: MultitrackRuntimeValue = clips[i];
          var tr: MultitrackRuntimeValue = findTrack(clip.track);
          var gain: MultitrackRuntimeValue = trackGain(tr, solo);
          var start: MultitrackRuntimeValue = Math.max(from, clip.start);
          var end: MultitrackRuntimeValue = Math.min(to, clip.start + clipLen(clip));
          if (!tr || gain <= 0 || end <= start) continue;
          var off: MultitrackRuntimeValue = ((start - from) * rate) >> 0;
          var len: MultitrackRuntimeValue = Math.min(
            left.length - off,
            ((end - start) * rate) >> 0,
          );
          var src: MultitrackRuntimeValue = clipIn(clip) + start - clip.start;
          var pan: MultitrackRuntimeValue = tr.pan || 0;
          var gl: MultitrackRuntimeValue = gain * (pan > 0 ? 1 - pan : 1);
          var gr: MultitrackRuntimeValue = gain * (pan < 0 ? 1 + pan : 1);
          for (var j: MultitrackRuntimeValue = 0; j < len; ++j) {
            var t: MultitrackRuntimeValue = src + j / rate;
            var env: MultitrackRuntimeValue = clipGainAt(clip, start + j / rate) * master_vol;
            left[off + j] += mixSample(clip.buffer, 0, t) * gl * env;
            right[off + j] +=
              mixSample(clip.buffer, clip.buffer.numberOfChannels > 1 ? 1 : 0, t) * gr * env;
          }
        }
        return out;
      }
      function MixdownAsync(
        this: MultitrackRuntimeValue,
        selection?: MultitrackRuntimeValue,
        done?: MultitrackRuntimeValue,
      ) {
        if (!clips.length) return done(null);
        var Ctx: MultitrackRuntimeValue = w.OfflineAudioContext || w.webkitOfflineAudioContext;
        if (!Ctx) {
          w.setTimeout(function (this: MultitrackRuntimeValue) {
            done(Mixdown(selection));
          }, 20);
          return;
        }
        var ctx: MultitrackRuntimeValue = audioCtx();
        var rate: MultitrackRuntimeValue = clips[0].buffer.sampleRate || ctx.sampleRate;
        var from: MultitrackRuntimeValue = 0;
        var to: MultitrackRuntimeValue = contentDuration();
        if (selection) {
          from = Math.max(0, selection[0] || 0);
          to = Math.max(from, selection[1] || 0);
        }
        if (to <= from) return done(null);
        var render_ctx: MultitrackRuntimeValue = new Ctx(
          2,
          Math.max(1, ((to - from) * rate) >> 0),
          rate,
        );
        var master: MultitrackRuntimeValue = render_ctx.createGain();
        var solo: MultitrackRuntimeValue = hasSolo();
        var called: MultitrackRuntimeValue = false;
        function finish(this: MultitrackRuntimeValue, buffer?: MultitrackRuntimeValue) {
          if (called) return;
          called = true;
          done(buffer);
        }
        master.gain.value = master_vol;
        master.connect(render_ctx.destination);
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i) {
          var clip: MultitrackRuntimeValue = clips[i];
          var tr: MultitrackRuntimeValue = findTrack(clip.track);
          var gain: MultitrackRuntimeValue = trackGain(tr, solo);
          var start: MultitrackRuntimeValue = Math.max(from, clip.start);
          var end: MultitrackRuntimeValue = Math.min(to, clip.start + clipLen(clip));
          if (!tr || gain <= 0 || end <= start) continue;
          var source: MultitrackRuntimeValue = render_ctx.createBufferSource();
          var track_gain: MultitrackRuntimeValue = render_ctx.createGain();
          var env: MultitrackRuntimeValue = render_ctx.createGain();
          var pan: MultitrackRuntimeValue = render_ctx.createStereoPanner
            ? render_ctx.createStereoPanner()
            : null;
          var when: MultitrackRuntimeValue = start - from;
          var offset: MultitrackRuntimeValue = clipIn(clip) + start - clip.start;
          var play_len: MultitrackRuntimeValue = end - start;
          source.buffer = clip.buffer;
          track_gain.gain.value = gain;
          if (pan) {
            pan.pan.value = tr.pan || 0;
            source.connect(pan);
            pan.connect(env);
          } else {
            source.connect(env);
          }
          env.connect(track_gain);
          track_gain.connect(master);
          applyClipEnvelope(env.gain, clip, 1, when, offset, play_len);
          source.start(when, offset, play_len);
        }
        render_ctx.oncomplete = function (
          this: MultitrackRuntimeValue,
          e?: MultitrackRuntimeValue,
        ) {
          finish(e.renderedBuffer);
        };
        var ret: MultitrackRuntimeValue = render_ctx.startRendering();
        if (ret && ret.then) {
          ret.then(finish).catch(function (this: MultitrackRuntimeValue) {
            finish(Mixdown(selection));
          });
        }
      }
      function GetTempoBuffer(
        this: MultitrackRuntimeValue,
        selection_only?: MultitrackRuntimeValue,
      ) {
        var clip: MultitrackRuntimeValue = findClip(selected_clip);
        if (selection_only) {
          if (!region) return null;
          if (clip) {
            var part: MultitrackRuntimeValue = clipRegionPart(clip);
            if (part.region) return copyClipBuffer(part);
          }
          return Mixdown([region.start, region.end]);
        }
        if (clip)
          return copyClipBuffer({
            buffer: clip.buffer,
            in: clipIn(clip),
            out: clipOut(clip),
          });
        OneUp('Select a waveform box first', 1200);
        return null;
      }
      function GetFxBuffer(this: MultitrackRuntimeValue) {
        var clip: MultitrackRuntimeValue = findClip(selected_clip);
        return clip ? copyClipBuffer(clipRegionPart(clip)) : null;
      }
      function addSilence(
        this: MultitrackRuntimeValue,
        offset?: MultitrackRuntimeValue,
        seconds?: MultitrackRuntimeValue,
      ) {
        var track: MultitrackRuntimeValue = selected_track || (tracks[0] && tracks[0].id);
        if (!track) return true;
        if (!seconds || seconds < 0) seconds = 1;
        if (offset === undefined) offset = marker;
        if (rec) Pause();
        var prev: MultitrackRuntimeValue = cloneState();
        var clip: MultitrackRuntimeValue = makeClip(
          track,
          offset,
          makeSilenceBuffer(seconds),
          'Silence',
        );
        clips.push(clip);
        selected_track = track;
        selected_clip = clip.id;
        clearRegion();
        setMarkerTime(clip.start);
        pushState(prev, 'Silence');
        queuePlayRefresh(true);
        render();
        app.fireEvent('DidUpdateMultitrack');
        app.fireEvent('DidSelectClip', clip);
        OneUp('Inserted Silence');
        return true;
      }
      function addURL(
        this: MultitrackRuntimeValue,
        url?: MultitrackRuntimeValue,
        name?: MultitrackRuntimeValue,
      ) {
        fetchBlob(
          url,
          function (this: MultitrackRuntimeValue, blob?: MultitrackRuntimeValue) {
            blob.name = fileName(url, name);
            addFiles([blob], selected_track || (tracks[0] && tracks[0].id), marker);
          },
          function (this: MultitrackRuntimeValue) {
            OneUp('Could not load audio', 1200);
          },
        );
      }
      function loadMultiSample(this: MultitrackRuntimeValue) {
        if (sample_loading) return;
        sample_loading = true;
        var prev: MultitrackRuntimeValue = cloneState();
        var zoom: MultitrackRuntimeValue = captureZoom();
        var pending: MultitrackRuntimeValue = multi_sample_files.length;
        var items: MultitrackRuntimeValue = new Array(pending);
        var completed: MultitrackRuntimeValue = new Array(pending);
        var replace: MultitrackRuntimeValue = !clips.length;
        var canceled: MultitrackRuntimeValue = false;
        var abort: MultitrackRuntimeValue = w.AbortController ? new w.AbortController() : null;
        app.listenFor('RequestCancelModal', cancelMultiSample);
        app.fireEvent('WillDownloadFile');
        for (var i: MultitrackRuntimeValue = 0; i < multi_sample_files.length; ++i)
          loadMultiSampleFile(i, sampleInfo(multi_sample_files[i]), 0);
        function loadMultiSampleFile(
          this: MultitrackRuntimeValue,
          index?: MultitrackRuntimeValue,
          info?: MultitrackRuntimeValue,
          retry?: MultitrackRuntimeValue,
        ) {
          if (canceled) return;
          var url: MultitrackRuntimeValue = 'mp3/multi/' + info.f;
          var cached: MultitrackRuntimeValue = sample_cache[info.f];
          if (cached) {
            items[index] = {
              buffer: cached,
              name: fileName(url),
              vol: info.v,
              pan: info.p,
              clips: info.c,
            };
            finishMultiSampleFile(index);
            return;
          }
          var settled: MultitrackRuntimeValue = false;
          fetchArrayBuffer(
            url,
            function (this: MultitrackRuntimeValue, arr?: MultitrackRuntimeValue) {
              if (canceled) return;
              decodeMp3Buffer(
                arr,
                function (this: MultitrackRuntimeValue, buffer?: MultitrackRuntimeValue) {
                  if (canceled || settled) return;
                  settled = true;
                  sample_cache[info.f] = buffer;
                  items[index] = {
                    buffer: buffer,
                    name: fileName(url),
                    vol: info.v,
                    pan: info.p,
                    clips: info.c,
                  };
                  finishMultiSampleFile(index);
                },
                fail,
              );
            },
            fail,
            abort && abort.signal,
          );
          function fail(this: MultitrackRuntimeValue) {
            if (canceled || settled) return;
            settled = true;
            if (retry < 2) loadMultiSampleFile(index, info, retry + 1);
            else finishMultiSampleFile(index);
          }
        }
        function finishMultiSampleFile(
          this: MultitrackRuntimeValue,
          index?: MultitrackRuntimeValue,
        ) {
          if (canceled || completed[index]) return;
          completed[index] = true;
          done();
        }
        function cancelMultiSample(this: MultitrackRuntimeValue) {
          if (canceled) return;
          canceled = true;
          if (abort) abort.abort();
          finishMultiSampleLoad();
          OneUp('Canceled Loading', 1350);
        }
        function finishMultiSampleLoad(this: MultitrackRuntimeValue) {
          sample_loading = false;
          app.fireEvent('DidDownloadFile');
          app.stopListeningForName('RequestCancelModal');
        }
        function done(this: MultitrackRuntimeValue) {
          if (--pending > 0) return;
          finishMultiSampleLoad();
          addMultiSampleBuffers(prev, items, replace, zoom);
        }
      }
      function addMultiSampleBuffers(
        this: MultitrackRuntimeValue,
        prev?: MultitrackRuntimeValue,
        items?: MultitrackRuntimeValue,
        replace?: MultitrackRuntimeValue,
        zoom?: MultitrackRuntimeValue,
      ) {
        var first: MultitrackRuntimeValue = null;
        var added: MultitrackRuntimeValue = 0;
        for (var n: MultitrackRuntimeValue = 0; n < multi_sample_files.length; ++n) {
          if (items[n]) continue;
          OneUp('Could not load all samples', 1400);
          return;
        }
        if (replace) {
          tracks = [];
          selected_track = null;
        }
        for (var i: MultitrackRuntimeValue = 0; i < items.length; ++i) {
          if (!items[i]) continue;
          var track: MultitrackRuntimeValue = makeTrack(trackName(items[i].name));
          if (items[i].vol !== undefined) track.vol = items[i].vol;
          if (items[i].pan !== undefined) track.pan = items[i].pan;
          var parts: MultitrackRuntimeValue = items[i].clips || [[0, 0]];
          var last: MultitrackRuntimeValue = null;
          tracks.push(track);
          for (var j: MultitrackRuntimeValue = 0; j < parts.length; ++j) {
            var p: MultitrackRuntimeValue = parts[j];
            var clip: MultitrackRuntimeValue = makeClip(
              track.id,
              p[0],
              items[i].buffer,
              items[i].name,
            );
            clip.in = Math.min(clip.buffer.duration, p[1] || 0);
            if (p[2] !== undefined) clip.out = Math.min(clip.buffer.duration, p[2]);
            if (p[3]) clip.fi = p[3];
            if (p[4]) clip.fo = p[4];
            clampClipFades(clip);
            if (clip.out > clip.in) {
              clips.push(clip);
              if (p[5] && last) xfades[pairKey(last, clip)] = 1;
              last = clip;
            }
          }
          if (!first) first = track.id;
          ++added;
        }
        if (!added) {
          OneUp('Could not load audio', 1200);
          return;
        }
        selected_track = first;
        selected_clip = null;
        clearRegion();
        setCursorTime(0);
        setBeatBpm(136);
        applyZoom(zoom);
        pushState(prev, 'Load Multitrack Sample');
        queuePlayRefresh(true);
        render();
        restoreZoomScroll(zoom);
        if (replace && app.mrk)
          app.mrk.loadMt([{ id: 'm1', time: 28.274, name: 'Here!', color: '#9dff6a' }], false);
        app.fireEvent('DidUpdateMultitrack');
        OneUp('Added ' + added + ' sample tracks');
      }
      function fetchBlob(
        this: MultitrackRuntimeValue,
        url?: MultitrackRuntimeValue,
        ok?: MultitrackRuntimeValue,
        bad?: MultitrackRuntimeValue,
      ) {
        fetch(url)
          .then(function (this: MultitrackRuntimeValue, res?: MultitrackRuntimeValue) {
            if (!res.ok) throw 1;
            return res.blob();
          })
          .then(ok)
          .catch(bad);
      }
      function fetchArrayBuffer(
        this: MultitrackRuntimeValue,
        url?: MultitrackRuntimeValue,
        ok?: MultitrackRuntimeValue,
        bad?: MultitrackRuntimeValue,
        signal?: MultitrackRuntimeValue,
      ) {
        fetch(url, signal ? { signal: signal } : undefined)
          .then(function (this: MultitrackRuntimeValue, res?: MultitrackRuntimeValue) {
            if (!res.ok) throw 1;
            return res.arrayBuffer();
          })
          .then(ok)
          .catch(bad);
      }
      function fileName(
        this: MultitrackRuntimeValue,
        url?: MultitrackRuntimeValue,
        name?: MultitrackRuntimeValue,
      ) {
        return name || (url.split('/').pop() || '').split('?')[0] || 'Audio';
      }
      function trackName(this: MultitrackRuntimeValue, name?: MultitrackRuntimeValue) {
        return name.replace(/\.[^\.]+$/, '').replace(/[-_]+/g, ' ');
      }
      function sampleInfo(this: MultitrackRuntimeValue, sample?: MultitrackRuntimeValue) {
        if (typeof sample === 'string') return { f: sample };
        if (sample.f !== undefined) return sample;
        return {
          f: sample.file,
          v: sample.vol === undefined ? sample.volume : sample.vol,
          p: sample.pan,
        };
      }
      function decodeFile(
        this: MultitrackRuntimeValue,
        file?: MultitrackRuntimeValue,
        ok?: MultitrackRuntimeValue,
        bad?: MultitrackRuntimeValue,
      ) {
        var reader: MultitrackRuntimeValue = new FileReader();
        reader.onerror = bad;
        reader.onload = function (this: MultitrackRuntimeValue) {
          decodeArrayBuffer(reader.result, ok, bad);
        };
        reader.readAsArrayBuffer(file);
      }
      function decodeMp3Buffer(
        this: MultitrackRuntimeValue,
        arr?: MultitrackRuntimeValue,
        ok?: MultitrackRuntimeValue,
        bad?: MultitrackRuntimeValue,
      ) {
        var called: MultitrackRuntimeValue = false;
        var done: MultitrackRuntimeValue = function (
          this: MultitrackRuntimeValue,
          buffer?: MultitrackRuntimeValue,
        ) {
          if (called) return;
          called = true;
          ok(buffer);
        };
        var fail: MultitrackRuntimeValue = function (this: MultitrackRuntimeValue) {
          if (called) return;
          called = true;
          bad && bad();
        };
        var ret: MultitrackRuntimeValue = audioCtx().decodeAudioData(arr, done, fail);
        if (ret && ret.then) ret.then(done).catch(fail);
      }
      function decodeArrayBuffer(
        this: MultitrackRuntimeValue,
        arr?: MultitrackRuntimeValue,
        ok?: MultitrackRuntimeValue,
        bad?: MultitrackRuntimeValue,
      ) {
        var ctx: MultitrackRuntimeValue = audioCtx();
        var called: MultitrackRuntimeValue = false;
        var done: MultitrackRuntimeValue = function (
          this: MultitrackRuntimeValue,
          buffer?: MultitrackRuntimeValue,
        ) {
          if (called) return;
          called = true;
          ok(buffer);
        };
        var fail: MultitrackRuntimeValue = function (this: MultitrackRuntimeValue) {
          if (called) return;
          called = true;
          bad && bad();
        };
        var tryAiff: MultitrackRuntimeValue = function (this: MultitrackRuntimeValue) {
          if (called) return;
          try {
            var buffer: MultitrackRuntimeValue = decodeAiff(arr, ctx);
            if (buffer) done(buffer);
            else fail();
          } catch (e: MultitrackRuntimeValue) {
            fail();
          }
        };
        var ret: MultitrackRuntimeValue = ctx.decodeAudioData(arr.slice(0), done, tryAiff);
        if (ret && ret.then) ret.then(done).catch(tryAiff);
      }
      function strAt(
        this: MultitrackRuntimeValue,
        data?: MultitrackRuntimeValue,
        off?: MultitrackRuntimeValue,
        len?: MultitrackRuntimeValue,
      ) {
        var str: MultitrackRuntimeValue = '';
        for (var i: MultitrackRuntimeValue = 0; i < len; ++i)
          str += String.fromCharCode(data.getUint8(off + i));
        return str;
      }
      function readAiffRate(
        this: MultitrackRuntimeValue,
        data?: MultitrackRuntimeValue,
        off?: MultitrackRuntimeValue,
      ) {
        var sign: MultitrackRuntimeValue = data.getUint8(off) & 0x80 ? -1 : 1;
        var exp: MultitrackRuntimeValue =
          ((data.getUint8(off) & 0x7f) << 8) | data.getUint8(off + 1);
        var hi: MultitrackRuntimeValue = data.getUint32(off + 2, false);
        var lo: MultitrackRuntimeValue = data.getUint32(off + 6, false);
        if (!exp && !hi && !lo) return 0;
        return sign * (hi * Math.pow(2, exp - 16383 - 31) + lo * Math.pow(2, exp - 16383 - 63));
      }
      function readAiffSample(
        this: MultitrackRuntimeValue,
        data?: MultitrackRuntimeValue,
        off?: MultitrackRuntimeValue,
        bits?: MultitrackRuntimeValue,
        little?: MultitrackRuntimeValue,
      ) {
        var val: MultitrackRuntimeValue = 0;
        if (bits === 8) return data.getInt8(off) / 128;
        if (bits === 16) return data.getInt16(off, little) / 32768;
        if (bits === 24) {
          if (little)
            val =
              data.getUint8(off) | (data.getUint8(off + 1) << 8) | (data.getUint8(off + 2) << 16);
          else
            val =
              (data.getUint8(off) << 16) | (data.getUint8(off + 1) << 8) | data.getUint8(off + 2);
          if (val & 0x800000) val |= 0xff000000;
          return val / 8388608;
        }
        if (bits === 32) return data.getInt32(off, little) / 2147483648;
        return 0;
      }
      function decodeAiff(
        this: MultitrackRuntimeValue,
        arr?: MultitrackRuntimeValue,
        ctx?: MultitrackRuntimeValue,
      ) {
        var data: MultitrackRuntimeValue = new DataView(arr);
        var len: MultitrackRuntimeValue = data.byteLength;
        if (len < 54 || strAt(data, 0, 4) !== 'FORM') return null;
        var kind: MultitrackRuntimeValue = strAt(data, 8, 4);
        if (kind !== 'AIFF' && kind !== 'AIFC') return null;
        var channels: MultitrackRuntimeValue = 0;
        var frames: MultitrackRuntimeValue = 0;
        var bits: MultitrackRuntimeValue = 0;
        var rate: MultitrackRuntimeValue = 0;
        var sound: MultitrackRuntimeValue = 0;
        var sound_len: MultitrackRuntimeValue = 0;
        var little: MultitrackRuntimeValue = false;
        var compression: MultitrackRuntimeValue = kind === 'AIFF' ? 'NONE' : '';
        var off: MultitrackRuntimeValue = 12;
        while (off + 8 <= len) {
          var id: MultitrackRuntimeValue = strAt(data, off, 4);
          var size: MultitrackRuntimeValue = data.getUint32(off + 4, false);
          var start: MultitrackRuntimeValue = off + 8;
          var end: MultitrackRuntimeValue = Math.min(start + size, len);
          if (id === 'COMM' && size >= 18) {
            channels = data.getUint16(start, false);
            frames = data.getUint32(start + 2, false);
            bits = data.getUint16(start + 6, false);
            rate = readAiffRate(data, start + 8);
            if (kind === 'AIFC' && size >= 22) compression = strAt(data, start + 18, 4);
          } else if (id === 'SSND' && size >= 8) {
            sound = start + 8 + data.getUint32(start, false);
            sound_len = Math.max(0, end - sound);
          }
          off = end + (size & 1);
        }
        if (compression === 'sowt') little = true;
        else if (compression !== 'NONE') return null;
        var bytes: MultitrackRuntimeValue = (bits + 7) >> 3;
        var frame_size: MultitrackRuntimeValue = bytes * channels;
        if (!channels || !frames || !bytes || !frame_size || !sound_len) return null;
        if (bits !== 8 && bits !== 16 && bits !== 24 && bits !== 32) return null;
        frames = Math.min(frames, (sound_len / frame_size) >> 0);
        rate = Math.round(rate) || ctx.sampleRate;
        var out: MultitrackRuntimeValue = ctx.createBuffer(channels, frames, rate);
        for (var i: MultitrackRuntimeValue = 0; i < frames; ++i) {
          var pos: MultitrackRuntimeValue = sound + i * frame_size;
          for (var ch: MultitrackRuntimeValue = 0; ch < channels; ++ch)
            out.getChannelData(ch)[i] = readAiffSample(data, pos + ch * bytes, bits, little);
        }
        return out;
      }
      function loadClip(this: MultitrackRuntimeValue, clip?: MultitrackRuntimeValue) {
        var buffer: MultitrackRuntimeValue = clip.buffer;
        var wv: MultitrackRuntimeValue = app.engine.wavesurfer;
        var clip_id: MultitrackRuntimeValue = clip.id;
        if (wv.backend.buffer !== buffer && app.engine.PreserveCurrentForUndo)
          app.engine.PreserveCurrentForUndo(
            'Open Clip',
            function (this: MultitrackRuntimeValue, undo?: MultitrackRuntimeValue) {
              editing_clip = undo ? null : clip_id;
            },
          );
        Stop();
        Toggle(false);
        editing_clip = clip_id;
        app.engine.is_ready = true;
        wv.loadDecodedBuffer(buffer);
        if (buffer.numberOfChannels === 1) {
          wv.backend.SetNumberOfChannels(1);
          wv.ActiveChannels = [1];
          wv.SelectedChannelsLen = 1;
          app.el.classList.add('pk_mono');
        } else {
          wv.backend.SetNumberOfChannels(2);
          wv.ActiveChannels = [1, 1];
          wv.SelectedChannelsLen = 2;
          app.el.classList.remove('pk_mono');
        }
        wv.drawer.params.ActiveChannels = wv.ActiveChannels;
        wv.getWaveEl().style.opacity = '1';
        app.fireEvent('DidLoadFile');
        app.fireEvent('DidUpdateLen', wv.getDuration());
        app.fireEvent('RequestSeekTo', 0);
        app.fireEvent('RequestResize');
        wv.drawBuffer();
        var dirty: MultitrackRuntimeValue = d.getElementsByClassName('pk_ed_empty');
        if (dirty.length) dirty[0].parentNode.removeChild(dirty[0]);
        OneUp('Loaded clip in editor', 1000);
      }
      function syncEditingClip(this: MultitrackRuntimeValue) {
        if (!editing_clip || on) return;
        var clip: MultitrackRuntimeValue = findClip(editing_clip);
        var buffer: MultitrackRuntimeValue =
          app.engine &&
          app.engine.wavesurfer &&
          app.engine.wavesurfer.backend &&
          app.engine.wavesurfer.backend.buffer;
        if (!clip || !buffer) return;
        clip.buffer = buffer;
        if (clipOut(clip) > buffer.duration) clip.out = buffer.duration;
        if (clipIn(clip) > clipOut(clip) - 0.05) clip.in = Math.max(0, clipOut(clip) - 0.05);
        clampClipFades(clip);
      }
      function Play(this: MultitrackRuntimeValue, x?: MultitrackRuntimeValue) {
        if (rec) {
          RecordStop(function (this: MultitrackRuntimeValue, clip?: MultitrackRuntimeValue) {
            if (clip) {
              setCursorTime(clip.start);
              withAudio(function (this: MultitrackRuntimeValue, ctx?: MultitrackRuntimeValue) {
                schedulePlayback(false, ctx);
              });
            }
          });
          return;
        }
        if (!clips.length) return;
        if (play && !x) {
          Stop();
          return;
        }
        if (play) {
          cursor = playingCursor();
          stopNodes();
          play = null;
        }
        if (region && cursor >= region.end) setCursorTime(region.start);
        withAudio(function (this: MultitrackRuntimeValue, ctx?: MultitrackRuntimeValue) {
          schedulePlayback(false, ctx);
        });
      }
      function schedulePlayback(
        this: MultitrackRuntimeValue,
        silent?: MultitrackRuntimeValue,
        ctx?: MultitrackRuntimeValue,
      ) {
        ctx = ctx || audioCtx();
        var start_ctx: MultitrackRuntimeValue = ctx.currentTime;
        var solo: MultitrackRuntimeValue = hasSolo();
        var nodes: MultitrackRuntimeValue = [];
        var dur: MultitrackRuntimeValue = region ? region.end : duration();
        var analyser: MultitrackRuntimeValue = ctx.createAnalyser();
        var splitter: MultitrackRuntimeValue = ctx.createChannelSplitter(2);
        var merger: MultitrackRuntimeValue = ctx.createChannelMerger(2);
        var meter_l: MultitrackRuntimeValue = ctx.createAnalyser();
        var meter_r: MultitrackRuntimeValue = ctx.createAnalyser();
        var master: MultitrackRuntimeValue = ctx.createGain();
        analyser.fftSize = logFrequencies() ? 1024 : 256;
        meter_l.fftSize = meter_r.fftSize = 256;
        master.gain.value = master_vol;
        master.connect(analyser);
        analyser.connect(splitter);
        splitter.connect(meter_l, 0);
        splitter.connect(meter_r, 1);
        meter_l.connect(merger, 0, 0);
        meter_r.connect(merger, 0, 1);
        merger.connect(ctx.destination);
        for (var i: MultitrackRuntimeValue = 0; i < clips.length; ++i) {
          var clip: MultitrackRuntimeValue = clips[i];
          var tr: MultitrackRuntimeValue = findTrack(clip.track);
          var clip_len: MultitrackRuntimeValue = clipLen(clip);
          var clip_end: MultitrackRuntimeValue = clip.start + clip_len;
          if (!tr || clip_end <= cursor) continue;
          if (region && clip.start >= region.end) continue;
          var source: MultitrackRuntimeValue = ctx.createBufferSource();
          var gain: MultitrackRuntimeValue = ctx.createGain();
          var env: MultitrackRuntimeValue = ctx.createGain();
          var pan: MultitrackRuntimeValue = ctx.createStereoPanner
            ? ctx.createStereoPanner()
            : null;
          var when: MultitrackRuntimeValue = start_ctx + Math.max(0, clip.start - cursor);
          var offset: MultitrackRuntimeValue = clipIn(clip) + Math.max(0, cursor - clip.start);
          var play_len: MultitrackRuntimeValue = Math.max(0.01, clipOut(clip) - offset);
          if (region)
            play_len = Math.min(
              play_len,
              Math.max(0.01, region.end - Math.max(cursor, clip.start)),
            );
          source.buffer = clip.buffer;
          gain.gain.value = trackGain(tr, solo);
          if (pan) {
            pan.pan.value = tr.pan;
            source.connect(pan);
            pan.connect(env);
          } else {
            source.connect(env);
          }
          env.connect(gain);
          gain.connect(master);
          applyClipEnvelope(env.gain, clip, 1, when, offset, play_len);
          source.start(when, offset, play_len);
          nodes.push({ src: source, gain: gain, env: env, pan: pan, track: tr.id, clip: clip });
        }
        play = {
          ctx: ctx,
          start: start_ctx,
          cursor: cursor,
          nodes: nodes,
          dur: dur,
          analyser: analyser,
          splitter: splitter,
          merger: merger,
          meter_l: meter_l,
          meter_r: meter_r,
          master: master,
          meter: [new Float32Array(128), new Float32Array(128)],
          freq: null,
        };
        if (!silent) app.fireEvent('DidPlay');
        tick();
      }
      function playingCursor(this: MultitrackRuntimeValue) {
        return play ? play.cursor + (play.ctx.currentTime - play.start) : cursor;
      }
      function refreshPlayNow(this: MultitrackRuntimeValue) {
        if (!play) return;
        if (play_sync) {
          w.clearTimeout(play_sync);
          play_sync = 0;
        }
        cursor = playingCursor();
        stopNodes();
        play = null;
        if (clips.length) {
          schedulePlayback(true);
        } else {
          app.fireEvent('DidAudioProcess', [cursor, null, w.performance.now()]);
          app.fireEvent('DidStopPlay');
          updatePlayhead();
          fireZoom();
        }
      }
      function queuePlayRefresh(this: MultitrackRuntimeValue, force?: MultitrackRuntimeValue) {
        if (!play) return;
        if (force) {
          refreshPlayNow();
          return;
        }
        if (play_sync) return;
        play_sync = w.setTimeout(function (this: MultitrackRuntimeValue) {
          play_sync = 0;
          refreshPlayNow();
        }, 1000);
      }
      function tick(this: MultitrackRuntimeValue) {
        if (!play) return;
        cursor = playingCursor();
        if (region && region.loop && cursor >= region.end) {
          setCursorTime(region.start);
          return;
        }
        if (cursor >= play.dur) {
          Stop();
          return;
        }
        play.meter_l.getFloatTimeDomainData(play.meter[0]);
        play.meter_r.getFloatTimeDomainData(play.meter[1]);
        var loudness: MultitrackRuntimeValue = [meterDb(play.meter[0]), meterDb(play.meter[1])];
        var db: MultitrackRuntimeValue = Math.max(loudness[0], loudness[1]);
        var stamp: MultitrackRuntimeValue = w.performance.now();
        var freq: MultitrackRuntimeValue = null;
        if (logFrequencies()) {
          if (play.analyser.fftSize !== 1024) {
            play.analyser.fftSize = 1024;
            play.freq = null;
          }
          if (!play.freq) play.freq = new Uint8Array(play.analyser.frequencyBinCount);
          play.analyser.getByteFrequencyData(play.freq);
          freq = play.freq;
        } else if (play.freq) {
          play.freq = null;
          play.analyser.fftSize = 256;
        }
        app.fireEvent('DidAudioProcess', [cursor, loudness, stamp], freq);
        if (mixer_on) updateMixerMeters(meterAt(cursor), db);
        followPlayback();
        updatePlayhead();
        raf = w.requestAnimationFrame(tick);
      }
      function followPlayback(this: MultitrackRuntimeValue) {
        var ws: MultitrackRuntimeValue = app.engine && app.engine.wavesurfer;
        if (
          !main ||
          GetZoomFactor() <= 1 ||
          active_drag ||
          (ws && (!ws.FollowCursor || ws.Interacting)) ||
          (app.ui.InteractionHandler && app.ui.InteractionHandler.on)
        )
          return;
        var width: MultitrackRuntimeValue = main.clientWidth;
        var max: MultitrackRuntimeValue = totalPixels();
        var half: MultitrackRuntimeValue = width >> 1;
        var real: MultitrackRuntimeValue = cursor * px_per_sec;
        var target: MultitrackRuntimeValue = real - half;
        var left_middle: MultitrackRuntimeValue = (main.scrollLeft + half) >> 0;
        var max_left: MultitrackRuntimeValue = Math.max(0, max - width);
        if (left_middle > real || real > left_middle + half) return;
        if (left_middle + half > real && left_middle + half < max) {
          var pos: MultitrackRuntimeValue = (((real - main.scrollLeft) / width) * 100) >> 0;
          if (pos > 99) {
            var x: MultitrackRuntimeValue = target - left_middle + half;
            target -= Math.max(0, x - 2 * GetZoomFactor());
          } else target = Math.max(0, Math.min(max_left, target));
        } else target = Math.max(0, Math.min(max_left, target));
        target = target >> 0;
        if (target === main.scrollLeft) return;
        main.scrollLeft = target;
        redrawRuler();
        fireZoom();
      }
      function Pause(this: MultitrackRuntimeValue) {
        ++wake_id;
        if (rec) {
          RecordStop();
          return;
        }
        if (!play) return;
        cursor = playingCursor();
        stopNodes();
        play = null;
        app.fireEvent('DidAudioProcess', [cursor, null, w.performance.now()]);
        app.fireEvent('DidStopPlay');
        updateMixerMeters(null);
        updatePlayhead();
        fireZoom();
      }
      function Stop(this: MultitrackRuntimeValue) {
        ++wake_id;
        if (rec) {
          RecordStop();
          return;
        }
        if (play) {
          stopNodes();
          play = null;
        }
        if (region) marker = region.start;
        cursor = marker;
        app.fireEvent('DidAudioProcess', [cursor, null, w.performance.now()]);
        app.fireEvent('DidStopPlay');
        updateMixerMeters(null);
        updatePlayhead();
        fireZoom();
      }
      function stopNodes(this: MultitrackRuntimeValue) {
        if (raf) {
          w.cancelAnimationFrame(raf);
          raf = 0;
        }
        if (play_sync) {
          w.clearTimeout(play_sync);
          play_sync = 0;
        }
        if (!play) return;
        for (var i: MultitrackRuntimeValue = 0; i < play.nodes.length; ++i) {
          try {
            play.nodes[i].src.stop(0);
          } catch (e: MultitrackRuntimeValue) {}
          try {
            play.nodes[i].src.disconnect();
          } catch (e2: MultitrackRuntimeValue) {}
          try {
            play.nodes[i].gain.disconnect();
          } catch (e3: MultitrackRuntimeValue) {}
          try {
            play.nodes[i].env.disconnect();
          } catch (e4: MultitrackRuntimeValue) {}
          if (play.nodes[i].pan) {
            try {
              play.nodes[i].pan.disconnect();
            } catch (e5: MultitrackRuntimeValue) {}
          }
        }
        if (play.master) {
          try {
            play.master.disconnect();
          } catch (e6: MultitrackRuntimeValue) {}
        }
        if (play.analyser) {
          try {
            play.analyser.disconnect();
          } catch (e7: MultitrackRuntimeValue) {}
        }
        if (play.splitter) {
          try {
            play.splitter.disconnect();
          } catch (e8: MultitrackRuntimeValue) {}
        }
        if (play.meter_l) {
          try {
            play.meter_l.disconnect();
          } catch (e9: MultitrackRuntimeValue) {}
        }
        if (play.meter_r) {
          try {
            play.meter_r.disconnect();
          } catch (e10: MultitrackRuntimeValue) {}
        }
        if (play.merger) {
          try {
            play.merger.disconnect();
          } catch (e11: MultitrackRuntimeValue) {}
        }
      }
      function refreshMix(this: MultitrackRuntimeValue) {
        if (!play) return;
        var solo: MultitrackRuntimeValue = hasSolo();
        if (play.master) play.master.gain.value = master_vol;
        for (var i: MultitrackRuntimeValue = 0; i < play.nodes.length; ++i) {
          var node: MultitrackRuntimeValue = play.nodes[i];
          var tr: MultitrackRuntimeValue = findTrack(node.track);
          node.gain.gain.value = trackGain(tr, solo);
          if (node.pan && tr) node.pan.pan.value = tr.pan;
        }
      }
      function updatePlayhead(this: MultitrackRuntimeValue) {
        var x: MultitrackRuntimeValue = (cursor * px_per_sec) >> 0;
        var mx: MultitrackRuntimeValue = (marker * px_per_sec) >> 0;
        if (playhead && x !== playhead_x) {
          playhead_x = x;
          playhead.style.transform = 'translate3d(' + x + 'px,0,0)';
        }
        if (marker_el && mx !== marker_x) {
          marker_x = mx;
          marker_el.style.transform = 'translate3d(' + mx + 'px,0,0)';
        }
      }
      function resizeTrackers(this: MultitrackRuntimeValue, height?: MultitrackRuntimeValue) {
        height = trackerHeight(height);
        if (playhead) playhead.style.height = height + 'px';
        if (marker_el) marker_el.style.height = height + 'px';
        if (region_el) region_el.style.height = height + 'px';
      }
      function trackerHeight(this: MultitrackRuntimeValue, height?: MultitrackRuntimeValue) {
        return Math.max(height || 0, main ? main.clientHeight - 24 : 0);
      }
      function totalPixels(this: MultitrackRuntimeValue) {
        return Math.max(1, duration() * px_per_sec);
      }
      function GetZoomFactor(this: MultitrackRuntimeValue) {
        if (!main) return 1;
        return Math.max(1, totalPixels() / Math.max(1, main.clientWidth));
      }
      function GetSeekZoomFactor(this: MultitrackRuntimeValue) {
        return Math.max(1, px_per_sec / default_px_per_sec);
      }
      function GetCursorPercent(this: MultitrackRuntimeValue) {
        return cursor / Math.max(0.0001, duration());
      }
      function leftPercent(this: MultitrackRuntimeValue) {
        if (!main) return 0;
        return (main.scrollLeft / totalPixels()) * 100;
      }
      function fireZoom(this: MultitrackRuntimeValue) {
        if (!on || !main) return;
        app.fireEvent('DidZoom', [
          GetZoomFactor(),
          leftPercent(),
          row_h / default_row_h,
          GetCursorPercent(),
        ]);
      }
      function captureZoom(this: MultitrackRuntimeValue) {
        if (!main || !main.clientWidth) return null;
        return {
          factor: GetZoomFactor(),
          left: main.scrollLeft / Math.max(0.0001, px_per_sec),
        };
      }
      function applyZoom(this: MultitrackRuntimeValue, zoom?: MultitrackRuntimeValue) {
        if (!zoom || !main || !main.clientWidth) return;
        px_per_sec = Math.max(
          fitHorizontalPxPerSec(),
          Math.min(1200, fitHorizontalPxPerSec() * Math.max(1, zoom.factor || 1)),
        );
      }
      function restoreZoomScroll(this: MultitrackRuntimeValue, zoom?: MultitrackRuntimeValue) {
        if (!zoom || !main) return;
        main.scrollLeft = (zoom.left || 0) * px_per_sec;
        clampScroll();
        redrawRuler();
        fireZoom();
      }
      function clampScroll(this: MultitrackRuntimeValue) {
        if (!main) return;
        var max: MultitrackRuntimeValue = Math.max(0, totalPixels() - main.clientWidth);
        if (main.scrollLeft < 0) main.scrollLeft = 0;
        else if (main.scrollLeft > max) main.scrollLeft = max;
      }
      function fitHorizontalPxPerSec(this: MultitrackRuntimeValue) {
        if (!main || !main.clientWidth) return default_px_per_sec;
        return main.clientWidth / Math.max(0.001, duration());
      }
      function resetHorizontalZoom(this: MultitrackRuntimeValue) {
        if (!main || !main.clientWidth) {
          px_per_sec = default_px_per_sec;
          return;
        }
        px_per_sec = fitHorizontalPxPerSec();
        main.scrollLeft = 0;
      }
      function zoomTo(
        this: MultitrackRuntimeValue,
        next_pps?: MultitrackRuntimeValue,
        center_time?: MultitrackRuntimeValue,
        where?: MultitrackRuntimeValue,
      ) {
        next_pps = Math.max(main ? fitHorizontalPxPerSec() : 12, Math.min(1200, next_pps));
        if (!main) {
          px_per_sec = next_pps;
          return;
        }
        if (where === undefined) where = 0.5;
        if (center_time === undefined)
          center_time = (main.scrollLeft + main.clientWidth * where) / px_per_sec;
        px_per_sec = next_pps;
        if (gesture_zoom || touch_zoom) renderZoom();
        else render();
        main.scrollLeft = center_time * px_per_sec - main.clientWidth * where;
        clampScroll();
        redrawRuler();
        fireZoom();
      }
      function ZoomUI(
        this: MultitrackRuntimeValue,
        type?: MultitrackRuntimeValue,
        val?: MultitrackRuntimeValue,
      ) {
        if (!hasClips()) return;
        if (type === 0) {
          var top: MultitrackRuntimeValue = main ? main.scrollTop / row_h : 0;
          row_h = default_row_h;
          resetHorizontalZoom();
          if (main) main.scrollTop = top * row_h;
          render();
          fireZoom();
          return;
        }
        if (type === 'h') {
          zoomTo(px_per_sec * (val < 0 ? 1.25 : 0.8));
          return;
        }
        if (type === 'v') {
          row_h = Math.max(min_track_h, Math.min(130, row_h * (val < 0 ? 1.15 : 1 / 1.15)));
          render();
          fireZoom();
        }
      }
      function Zoom(
        this: MultitrackRuntimeValue,
        diff?: MultitrackRuntimeValue,
        mode?: MultitrackRuntimeValue,
      ) {
        if (!hasClips()) return;
        var factor: MultitrackRuntimeValue = 1;
        if (mode === -1) {
          factor = 1 + diff / Math.max(160, main.clientWidth);
          main.scrollLeft += diff;
        } else if (mode === 1) {
          factor = 1 - diff / Math.max(160, main.clientWidth);
        }
        if (factor <= 0.05) factor = 0.05;
        zoomTo(px_per_sec * factor);
      }
      function Pan(
        this: MultitrackRuntimeValue,
        diff?: MultitrackRuntimeValue,
        mode?: MultitrackRuntimeValue,
      ) {
        if (!main || !hasClips()) return;
        var wave: MultitrackRuntimeValue = app.el.getElementsByClassName('pk_wavescroll')[0];
        var ww: MultitrackRuntimeValue = wave ? wave.clientWidth : main.clientWidth;
        if (mode === 2) {
          main.scrollLeft = (diff / Math.max(1, ww)) * totalPixels();
        } else {
          main.scrollLeft += diff * (totalPixels() / Math.max(1, ww));
        }
        clampScroll();
        redrawRuler();
        fireZoom();
      }
      function CenterToCursor(this: MultitrackRuntimeValue) {
        if (!main || !hasClips()) return;
        main.scrollLeft = cursor * px_per_sec - main.clientWidth / 2;
        clampScroll();
        redrawRuler();
        fireZoom();
      }
      function RecordToggle(this: MultitrackRuntimeValue) {
        if (rec) RecordStop();
        else RecordStart();
      }
      function RecordStart(this: MultitrackRuntimeValue) {
        if (rec) return;
        var tr: MultitrackRuntimeValue = activeTrack();
        if (!tr) {
          OneUp('Arm a channel to record', 1200);
          return;
        }
        Pause();
        var ctx: MultitrackRuntimeValue = audioCtx();
        var size: MultitrackRuntimeValue = 4096;
        var buffers: MultitrackRuntimeValue = [];
        var skip: MultitrackRuntimeValue = 4;
        var r: MultitrackRuntimeValue = (rec = {
          ctx: ctx,
          track: tr.id,
          size: size,
          buffers: buffers,
          start: cursor,
          len: 0,
          t0: 0,
        });
        if (
          !app.rec.startCapture({
            ctx: ctx,
            chunkSize: size,
            ondata: function (this: MultitrackRuntimeValue, b?: MultitrackRuntimeValue) {
              if (rec !== r) return;
              if (skip > 0) {
                --skip;
                return;
              }
              buffers.push(b);
              r.len += b.length;
              if (buffers.length === 1 || ++rec_redraw >= 3) {
                rec_redraw = 0;
                if (!rec_raf)
                  rec_raf = w.requestAnimationFrame(function (this: MultitrackRuntimeValue) {
                    rec_raf = 0;
                    renderRecPreview();
                  });
              }
            },
            onstart: function (this: MultitrackRuntimeValue) {
              if (rec !== r) return;
              rec_redraw = 0;
              r.t0 = w.performance.now();
              renderRecPreview();
              app.fireEvent('DidActionRecordStart');
              OneUp('Recording ' + tr.name, 1000);
            },
            onerror: function (this: MultitrackRuntimeValue) {
              if (rec === r) rec = null;
              OneUp('No recording device found', 1200);
            },
          })
        ) {
          rec = null;
          return;
        }
      }
      function RecordStop(this: MultitrackRuntimeValue, done?: MultitrackRuntimeValue) {
        if (!rec || rec.stopping) return;
        var r: MultitrackRuntimeValue = rec;
        r.stopping = true;
        if (rec_raf) {
          w.cancelAnimationFrame(rec_raf);
          rec_raf = 0;
        }
        app.rec.stopCapture(function (this: MultitrackRuntimeValue) {
          rec = null;
          app.fireEvent('DidActionRecordStop', !!r.buffers.length);
          if (!r.buffers.length) {
            rec_el = null;
            rec_canvas = null;
            render();
            done && done(null);
            return;
          }
          var prev: MultitrackRuntimeValue = cloneState();
          var len: MultitrackRuntimeValue =
            r.len ||
            r.buffers.reduce(function (
              this: MultitrackRuntimeValue,
              sum?: MultitrackRuntimeValue,
              b?: MultitrackRuntimeValue,
            ) {
              return sum + b.length;
            }, 0);
          var buffer: MultitrackRuntimeValue = r.ctx.createBuffer(1, len, r.ctx.sampleRate);
          var chan: MultitrackRuntimeValue = buffer.getChannelData(0);
          for (
            var i: MultitrackRuntimeValue = 0, off: MultitrackRuntimeValue = 0;
            i < r.buffers.length;
            ++i
          ) {
            chan.set(r.buffers[i], off);
            off += r.buffers[i].length;
          }
          var clip: MultitrackRuntimeValue = makeClip(r.track, r.start, buffer, 'Recording');
          clips.push(clip);
          selected_track = r.track;
          selected_clip = clip.id;
          pushState(prev, 'Record Clip');
          render();
          rec_el = null;
          rec_canvas = null;
          app.fireEvent('DidUpdateMultitrack');
          app.fireEvent('DidSelectClip', clip);
          OneUp('Recorded clip', 1000);
          done && done(clip);
        });
      }
      function deleteSelectedClip(this: MultitrackRuntimeValue) {
        if (!selected_clip) return false;
        stopFxPreview(true);
        var removed: MultitrackRuntimeValue = false;
        var prev: MultitrackRuntimeValue = cloneState();
        for (var i: MultitrackRuntimeValue = clips.length - 1; i >= 0; --i) {
          if (clips[i].id === selected_clip) {
            clips.splice(i, 1);
            removed = true;
            break;
          }
        }
        if (!removed) return false;
        if (editing_clip === selected_clip) editing_clip = null;
        selected_clip = null;
        app.fireEvent('DidDeselectClip');
        pushState(prev, 'Delete Clip');
        queuePlayRefresh(true);
        render();
        app.fireEvent('DidUpdateMultitrack');
        return true;
      }
      function splitSelectedClip(this: MultitrackRuntimeValue, at?: MultitrackRuntimeValue) {
        if (!selected_clip) return false;
        var clip: MultitrackRuntimeValue = findClip(selected_clip);
        if (!clip) return false;
        if (at === undefined) at = marker;
        var rel: MultitrackRuntimeValue = at - clip.start;
        var len: MultitrackRuntimeValue = clipLen(clip);
        if (rel <= 0.005 || rel >= len - 0.005) {
          OneUp('Move marker inside selected clip', 1200);
          return false;
        }
        var prev: MultitrackRuntimeValue = cloneState();
        var split: MultitrackRuntimeValue = clipIn(clip) + rel;
        var right: MultitrackRuntimeValue = {
          id: 'mc' + clip_uid++,
          track: clip.track,
          start: at,
          in: split,
          out: clipOut(clip),
          fi: 0,
          fo: clip.fo || 0,
          name: clip.name,
          buffer: clip.buffer,
        };
        clip.out = split;
        clip.fo = 0;
        clampClipFades(clip);
        clampClipFades(right);
        clips.splice(clips.indexOf(clip) + 1, 0, right);
        selected_clip = right.id;
        selected_track = right.track;
        pushState(prev, 'Split Clip');
        queuePlayRefresh(true);
        render();
        app.fireEvent('DidSelectClip', right);
        OneUp('Split Clip', 900);
        return true;
      }
      q.IsOn = IsOn;
      q.ExportSession = ExportSession;
      q.LoadSessionBuffer = LoadSessionBuffer;
      q.LoadSessionFiles = LoadSessionFiles;
      q.AddFilesAuto = function (this: MultitrackRuntimeValue, file_list?: MultitrackRuntimeValue) {
        if (!file_list || !file_list.length) return false;
        if (file_list.length > 1) {
          addFiles(file_list, null, 0);
          return true;
        }
        var target: MultitrackRuntimeValue = emptyTracks()[0];
        if (!target) {
          addTrack();
          target = tracks[tracks.length - 1];
        } else {
          selected_track = target.id;
        }
        addFiles(file_list, target.id, 0);
        return true;
      };
      q.IsRecording = function (this: MultitrackRuntimeValue) {
        return !!rec;
      };
      q.IsPlaying = function (this: MultitrackRuntimeValue) {
        return !!play;
      };
      q.Toggle = Toggle;
      q.Play = Play;
      q.Pause = Pause;
      q.Stop = Stop;
      q.ZoomUI = ZoomUI;
      q.Zoom = Zoom;
      q.Pan = Pan;
      q.GetZoomFactor = GetZoomFactor;
      q.GetSeekZoomFactor = GetSeekZoomFactor;
      q.GetCursor = function (this: MultitrackRuntimeValue) {
        return cursor;
      };
      q.GetMarker = function (this: MultitrackRuntimeValue) {
        return marker;
      };
      q.GetCursorPercent = GetCursorPercent;
      q.GetDuration = duration;
      q.GetRegion = function (this: MultitrackRuntimeValue) {
        return region;
      };
      q.HasClips = hasClips;
      q.Mixdown = Mixdown;
      q.MixdownAsync = MixdownAsync;
      q.GetTempoBuffer = GetTempoBuffer;
      q.GetFxBuffer = GetFxBuffer;
      q.RecordToggle = RecordToggle;
      q.RecordStart = RecordStart;
      q.RecordStop = RecordStop;
      q.ToggleMixer = ToggleMixer;
      q.MixerData = MixerData;
      q.MixerSet = MixerSet;
      q.Propagate = function (
        this: MultitrackRuntimeValue,
        id?: MultitrackRuntimeValue,
        arg1?: MultitrackRuntimeValue,
        arg2?: MultitrackRuntimeValue,
      ) {
        if (!IsOn() && id !== 'RequestActionRecordStop') return false;
        if (id === 'RequestTransportToggle') {
          if (arg1 === 'pause') {
            if (play) Pause();
            else Play();
          } else {
            if (play) Stop();
            else Play();
          }
          return true;
        }
        if (id === 'RequestStop') {
          Stop();
          return true;
        }
        if (id === 'RequestPlay') {
          Play(arg1);
          return true;
        }
        if (id === 'RequestPause') {
          Pause();
          return true;
        }
        if (id === 'RequestSeekTo') {
          SeekTo(arg1);
          return true;
        }
        if (id === 'RequestSkipBack') {
          Skip(-(arg1 || 0));
          return true;
        }
        if (id === 'RequestSkipFront') {
          Skip(arg1 || 0);
          return true;
        }
        if (id === 'RequestZoom') {
          Zoom(arg1, arg2);
          return true;
        }
        if (id === 'RequestPan') {
          Pan(arg1, arg2);
          return true;
        }
        if (id === 'RequestViewCenterToCursor') {
          CenterToCursor();
          return true;
        }
        if (id === 'RequestMixerToggle') {
          ToggleMixer();
          return true;
        }
        if (id === 'RequestChannelMove') {
          return moveSelectedTrack(arg1 || 0);
        }
        if (id === 'RequestChannelSelect') {
          return selectTrackByOffset(arg1 || 0);
        }
        if (id === 'RequestLoadPickedFiles') {
          var track: MultitrackRuntimeValue = selected_track || (tracks[0] && tracks[0].id);
          if (track) addFiles(arg1, track, marker);
          return true;
        }
        if (id === 'RequestLoadSampleFile') {
          addURL('test.mp3', 'Sample File');
          return true;
        }
        if (id === 'RequestLoadURL') {
          addURL(arg1);
          return true;
        }
        if (id === 'RequestZoomUI') {
          ZoomUI(arg1, arg2);
          return true;
        }
        if (id === 'RequestActionFX_PREVIEW_STOP') {
          return stopFxPreview();
        }
        if (id === 'RequestActionFX_TOGGLE') {
          return toggleFxPreview(arg1);
        }
        if (id === 'RequestActionFX_UPDATE_PREVIEW') {
          updateFxPreview(arg1);
          return false;
        }
        if (id === 'RequestActionFX_Loudness') {
          return analyzeFxLoudness(arg1);
        }
        if (fxEventName(id, true)) {
          return previewFx(fxEventName(id, true), arg1);
        }
        if (fxEventName(id, false)) {
          return applyFx(fxEventName(id, false), arg1);
        }
        if (
          id === 'RequestActionFX_NoiseRNN' ||
          id === 'RequestActionFX_RemSil' ||
          id === 'RequestActionFX_Flip'
        ) {
          OneUp('Open this clip in the editor for that effect', 1400);
          return true;
        }
        if (id === 'RequestActionFXUI_Flip') {
          OneUp('Open this clip in the editor for channel info', 1400);
          return true;
        }
        if (
          (id === 'RequestFXUI_Gain' || id.substr(0, 17) === 'RequestActionFXUI') &&
          !selected_clip
        ) {
          OneUp('Select a waveform box first', 1200);
          return true;
        }
        if (id === 'RequestSelect') {
          if (!hasClips()) return true;
          if (arg1 && selected_clip) {
            app.fireEvent('DidSelectClip', findClip(selected_clip));
            return true;
          }
          clearSelectedClip(true);
          setRegion(0, duration());
          setCursorTime(0);
          return true;
        }
        if (id === 'RequestRegionSet') {
          if (!hasClips()) return true;
          if (arg1 === undefined) arg1 = main.scrollLeft / px_per_sec;
          if (arg2 === undefined) arg2 = (main.scrollLeft + main.clientWidth) / px_per_sec;
          clearSelectedClip(true);
          setRegion(arg1, arg2, true);
          return true;
        }
        if (id === 'RequestSetLoop') {
          if (!hasClips()) return true;
          if (!region) setRegion(0.01, duration() - 0.01);
          region.loop = !region.loop;
          app.fireEvent('DidSetLoop', region.loop);
          if (region.loop) setCursorTime(region.start);
          return true;
        }
        if (id === 'RequestDeselect' || id === 'RequestRegionClear') {
          var cleared_region: MultitrackRuntimeValue = clearRegion();
          clearSelectedClip(cleared_region);
          return true;
        }
        if (id === 'RequestActionCopy') {
          return copySelectedClip();
        }
        if (id === 'RequestActionPaste') {
          return pasteClip();
        }
        if (id === 'RequestActionSilence') {
          return addSilence(arg1, arg2);
        }
        if (id === 'RequestActionCut') {
          if (/INPUT|TEXTAREA|SELECT/.test((d.activeElement && d.activeElement.tagName) || ''))
            return true;
          if (arg1) {
            splitSelectedClip();
            return true;
          }
          if (region) return true;
          deleteSelectedClip();
          return true;
        }
        if (id === 'RequestActionCrossfade') {
          return toggleXfade();
        }
        if (id === 'RequestActionRecordToggle') {
          RecordToggle();
          return true;
        }
        if (id === 'RequestActionRecordStart') {
          RecordStart();
          return true;
        }
        if (id === 'RequestActionRecordStop' && rec) {
          RecordStop();
          return true;
        }
        return false;
      };
      app.listenFor('RequestOriginalEditor', function (this: MultitrackRuntimeValue) {
        if (IsOn()) Toggle(false);
      });
      app.listenFor(
        'StateDidPop',
        function (
          this: MultitrackRuntimeValue,
          state?: MultitrackRuntimeValue,
          undo?: MultitrackRuntimeValue,
        ) {
          if (state.type !== 'mult') return;
          restoreState(state.mt, true);
          if (undo) OneUp('Undo ' + state.desc);
          else OneUp('Redo ' + state.desc);
        },
      );
      app.listenFor(
        'DidToggleFreqAn',
        function (
          this: MultitrackRuntimeValue,
          url?: MultitrackRuntimeValue,
          val?: MultitrackRuntimeValue,
        ) {
          if (url === 'mix') updateMixerButton(val);
        },
      );
      app.listenFor(
        'DidViewTimelineToggle',
        function (this: MultitrackRuntimeValue, val?: MultitrackRuntimeValue) {
          timeline_on = !!val;
          redrawRuler();
        },
      );
      app.listenFor('DidSetClipboard', function (this: MultitrackRuntimeValue) {
        clip_copy = null;
      });
      app.listenFor('RequestResize', function (this: MultitrackRuntimeValue) {
        if (!el) return;
        el.style.height = app.ui.MainHeight() + 'px';
        syncScroll();
        resizeTrackers(tracksHeight());
        redrawRuler();
        requestBeatGrid();
      });
      app.listenFor('DidUpdateLen', syncEditingClip);
      app.listenFor('DidUnloadFile', function (this: MultitrackRuntimeValue) {
        if (!on) editing_clip = null;
      });
      app.listenFor('RequestDetachClipEditor', function (this: MultitrackRuntimeValue) {
        editing_clip = null;
      });
      tracks.push(makeTrack('Channel 1'));
      tracks.push(makeTrack('Channel 2'));
      selected_track = tracks[0].id;
      build();
    }
    PKAE._deps.multitrack = PKMultitrack;
  })(window, document, PKAudioEditor);
})();
