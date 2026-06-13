(function (w, d) {
	'use strict';

	var SINGLE_WAVE_KEY = 'pk_single_wave_view';
	var canvasPatched = false;
	var originalMoveTo = null;
	var originalLineTo = null;
	var wavePathState = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

	function closestClip(node) {
		while (node && node !== d && node.nodeType === 1) {
			if (node.classList && node.classList.contains('pk_mt_clip')) return node;
			node = node.parentNode;
		}
		return null;
	}

	function hasModifier(e) {
		return !!(e && (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey));
	}

	function isHandleTarget(node) {
		while (node && node !== d && node.nodeType === 1) {
			if (node.classList && (
				node.classList.contains('pk_mt_trim') ||
				node.classList.contains('pk_mt_fade') ||
				node.classList.contains('wavesurfer-handle')
			)) return true;
			if (node.classList && node.classList.contains('pk_mt_clip')) return false;
			node = node.parentNode;
		}
		return false;
	}

	function mouseEvent(type, t, target) {
		return new MouseEvent(type, {
			bubbles: true,
			cancelable: true,
			view: w,
			button: 0,
			buttons: type === 'mouseup' ? 0 : 1,
			detail: 1,
			clientX: t.clientX,
			clientY: t.clientY,
			screenX: t.screenX,
			screenY: t.screenY,
			shiftKey: true
		});
	}

	function getSingleWaveMode() {
		try {
			var saved = w.localStorage && w.localStorage.getItem(SINGLE_WAVE_KEY);
			return saved === 'normal' || saved === 'focus' ? saved : 'focus';
		} catch (e) {
			return 'focus';
		}
	}

	function setSingleWaveMode(mode) {
		try { w.localStorage && w.localStorage.setItem(SINGLE_WAVE_KEY, mode); }
		catch (e) {}
	}

	function injectSingleWaveCss() {
		if (d.querySelector('link[href="single-waveform-view-mode.css"]')) return;
		var link = d.createElement('link');
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = 'single-waveform-view-mode.css';
		d.head.appendChild(link);
	}

	function isFocusWaveCanvas(ctx) {
		var canvas = ctx && ctx.canvas;
		if (!canvas || !canvas.parentNode || ctx.__amFocusLiveDraw) return false;
		var app = d.querySelector('.pk_app.pk_single_wave_focus:not(.pk_mt_on)');
		if (!app) return false;
		if (!canvas.closest || !canvas.closest('.pk_av')) return false;
		if (canvas.closest('.pk_mt')) return false;
		return true;
	}

	function smoothstep(t) {
		t = Math.max(0, Math.min(1, t));
		return t * t * (3 - 2 * t);
	}

	function focusGain(x, canvas, channel) {
		var width = Math.max(1, canvas && canvas.width || 1);
		var nx = Math.max(0, Math.min(1, x / width));

		var distFromCenter = Math.abs(nx - 0.5) * 2;
		var edge = 1 - distFromCenter;
		var quietInset = channel === 1 ? 0.26 : 0.22;
		var shaped = smoothstep((edge - quietInset) / (1 - quietInset));
		var t = Math.pow(shaped, channel === 1 ? 1.30 : 1.42);

		if (channel === 1) {
			var breath = 0.972 + 0.028 * Math.cos(distFromCenter * Math.PI * 2);
			t *= breath;
		}

		var floor = channel === 1 ? 0.008 : 0.004;
		var gain = floor + (1 - floor) * t;
		return Math.max(floor, Math.min(1, gain));
	}

	function patchCanvasWaveformDraw() {
		if (canvasPatched || !w.CanvasRenderingContext2D) return;
		var proto = w.CanvasRenderingContext2D.prototype;
		if (!proto || !proto.moveTo || !proto.lineTo) return;

		canvasPatched = true;
		originalMoveTo = proto.moveTo;
		originalLineTo = proto.lineTo;

		proto.moveTo = function (x, y) {
			if (wavePathState && isFocusWaveCanvas(this)) {
				var h = this.canvas && this.canvas.height || 1;
				var channel = y > h * 0.52 ? 1 : 0;
				wavePathState.set(this, { base: y, active: y > 24, channel: channel });
			}
			return originalMoveTo.call(this, x, y);
		};

		proto.lineTo = function (x, y) {
			if (wavePathState && isFocusWaveCanvas(this)) {
				var st = wavePathState.get(this);
				if (st && st.active && Math.abs(y - st.base) > 0.25) {
					var g = focusGain(x, this.canvas, st.channel || 0);
					y = st.base + (y - st.base) * g;
				}
			}
			return originalLineTo.call(this, x, y);
		};
	}

	function redrawWave(editor) {
		if (!editor || !editor.engine || !editor.engine.wavesurfer) return;
		var ws = editor.engine.wavesurfer;
		try {
			if (ws.drawBuffer) ws.drawBuffer();
			else if (ws.drawer && ws.backend && ws.backend.buffer && ws.drawer.drawPeaks) {
				ws.drawer.drawPeaks(ws.backend.getPeaks(ws.drawer.width), ws.getDuration());
			}
		} catch (e) {}
		try { editor.fireEvent && editor.fireEvent('RequestResize'); } catch (e2) {}
	}

	function installSingleWaveView(editor) {
		if (!editor || !editor.el || editor.__amSingleWaveViewMode) return;
		editor.__amSingleWaveViewMode = true;
		injectSingleWaveCss();
		patchCanvasWaveformDraw();

		var root = editor.el;
		var btn = null;
		var prevFollow = null;
		var liveRaf = 0;
		var lastLiveAt = -1;

		function label(mode) {
			return mode === 'focus' ? 'Фокус' : 'Обычный';
		}

		function keepFocusPeaksStatic(mode) {
			var ws = editor.engine && editor.engine.wavesurfer;
			if (!ws) return;

			if (mode === 'focus') {
				if (prevFollow === null) prevFollow = ws.FollowCursor;
				ws.FollowCursor = 0;
			}
			else if (prevFollow !== null) {
				ws.FollowCursor = prevFollow;
				prevFollow = null;
			}
		}

		function liveEntry() {
			var ws = editor.engine && editor.engine.wavesurfer;
			var drawer = ws && ws.drawer;
			var entry = drawer && drawer.canvases && drawer.canvases[0];
			return entry && entry.waveCtx ? { ws: ws, ctx: entry.waveCtx, canvas: entry.waveCtx.canvas } : null;
		}

		function samplePeak(data, center, radius, len) {
			var start = Math.max(0, center - radius) | 0;
			var end = Math.min(len - 1, center + radius) | 0;
			var min = 0;
			var max = 0;
			for (var i = start; i <= end; i += 2) {
				var v = data[i] || 0;
				if (v > max) max = v;
				else if (v < min) min = v;
			}
			return [max, min];
		}

		function drawFocusChannel(ctx, canvas, buffer, channel, top, height, now, width) {
			var data = buffer.getChannelData(Math.min(channel, buffer.numberOfChannels - 1));
			var len = data.length;
			var sr = buffer.sampleRate;
			var base = top + height * 0.5;
			var half = height * (channel === 1 ? 0.37 : 0.40);
			var step = Math.max(2, Math.round(width / 210));
			var points = Math.ceil(width / step) + 1;
			var liveWindow = channel === 1 ? 0.46 : 0.40;
			var sampleRadius = Math.max(12, Math.round(sr * liveWindow / points * 0.55));

			ctx.beginPath();
			ctx.moveTo(0, base);

			for (var p = 0; p <= points; ++p) {
				var x = Math.min(width, p * step);
				var rel = x / Math.max(1, width) - 0.5;
				var lookup = now + rel * liveWindow;
				var idx = Math.max(0, Math.min(len - 1, Math.round(lookup * sr)));
				var pk = samplePeak(data, idx, sampleRadius, len);
				var amp = Math.max(Math.abs(pk[0]), Math.abs(pk[1]));
				var gain = focusGain(x, canvas, channel);
				var y = base - Math.min(1, amp * 1.7) * half * gain;
				ctx.lineTo(x, y);
			}

			for (var q = points; q >= 0; --q) {
				var bx = Math.min(width, q * step);
				var brel = bx / Math.max(1, width) - 0.5;
				var blookup = now + brel * liveWindow;
				var bidx = Math.max(0, Math.min(len - 1, Math.round(blookup * sr)));
				var bpk = samplePeak(data, bidx, sampleRadius, len);
				var bamp = Math.max(Math.abs(bpk[0]), Math.abs(bpk[1]));
				var bgain = focusGain(bx, canvas, channel);
				var by = base + Math.min(1, bamp * 1.7) * half * bgain;
				ctx.lineTo(bx, by);
			}

			ctx.closePath();
			ctx.fill();

			ctx.globalAlpha = 0.18;
			ctx.fillRect(0, base - 0.5, width, 1);
			ctx.globalAlpha = 1;
		}

		function drawLiveFocusWave(force) {
			if (getSingleWaveMode() !== 'focus' || root.classList.contains('pk_mt_on')) return;
			var live = liveEntry();
			if (!live || !live.ws.backend || !live.ws.backend.buffer) return;

			var ws = live.ws;
			var canvas = live.canvas;
			var ctx = live.ctx;
			var buffer = ws.backend.buffer;
			var now = Math.max(0, Math.min(buffer.duration || 0, ws.getCurrentTime ? ws.getCurrentTime() : 0));
			if (!force && Math.abs(now - lastLiveAt) < 0.012 && ws.isPlaying && ws.isPlaying()) return;
			lastLiveAt = now;

			var width = canvas.width || 1;
			var height = canvas.height || 1;
			var topPad = ws.drawer && ws.drawer.params && ws.drawer.params.timeline ? 24 : 0;
			var usable = Math.max(20, height - topPad);
			var laneH = usable / 2;

			ctx.__amFocusLiveDraw = true;
			try {
				ctx.fillStyle = '#000';
				ctx.fillRect(0, 0, width, height);
				ctx.fillStyle = ws.drawer && ws.drawer.params && ws.drawer.params.waveColor || '#99c2c6';
				drawFocusChannel(ctx, canvas, buffer, 0, topPad, laneH, now, width);
				ctx.fillStyle = ws.drawer && ws.drawer.params && ws.drawer.params.ActiveChannels && ws.drawer.params.ActiveChannels[1] === false ?
					(ws.drawer.params.waveDisabledColor || 'rgba(153,194,198,.35)') :
					(ws.drawer && ws.drawer.params && ws.drawer.params.waveColor || '#99c2c6');
				drawFocusChannel(ctx, canvas, buffer, buffer.numberOfChannels > 1 ? 1 : 0, topPad + laneH, laneH, now, width);
			}
			finally {
				ctx.__amFocusLiveDraw = false;
			}
		}

		function scheduleLiveFocusWave(force) {
			if (liveRaf) return;
			liveRaf = w.requestAnimationFrame(function () {
				liveRaf = 0;
				drawLiveFocusWave(!!force);
				var ws = editor.engine && editor.engine.wavesurfer;
				if (getSingleWaveMode() === 'focus' && ws && ws.isPlaying && ws.isPlaying()) {
					scheduleLiveFocusWave(false);
				}
			});
		}

		function apply(mode) {
			mode = mode || getSingleWaveMode();
			root.classList.toggle('pk_single_wave_focus', mode === 'focus');
			root.classList.toggle('pk_single_wave_normal', mode === 'normal');
			keepFocusPeaksStatic(mode);

			if (btn) {
				btn.classList.toggle('pk_act', mode === 'focus');
				btn.setAttribute('aria-pressed', mode === 'focus' ? 'true' : 'false');
				var txt = btn.querySelector('b');
				var tip = btn.querySelector('span');
				if (txt) txt.textContent = label(mode);
				if (tip) {
					tip.textContent = mode === 'focus' ?
						'Вид waveform: пики статичны и обновляются на месте' :
						'Вид waveform: обычная полная волна';
				}
			}

			if (mode === 'focus') scheduleLiveFocusWave(true);
		}

		function choose(mode) {
			setSingleWaveMode(mode);
			apply(mode);
			if (mode === 'focus') scheduleLiveFocusWave(true);
			else redrawWave(editor);
		}

		function makeButton() {
			if (btn && btn.parentNode) return true;
			var toolbar = root.querySelector('.pk_tb');
			if (!toolbar) return false;

			btn = d.createElement('button');
			btn.type = 'button';
			btn.tabIndex = -1;
			btn.className = 'pk_btn pk_wave_view_toggle';
			btn.innerHTML = '<b></b><span></span>';
			btn.onclick = function () {
				choose(getSingleWaveMode() === 'focus' ? 'normal' : 'focus');
				this.blur();
			};

			var before = toolbar.querySelector('.pk_composition_wave_badge') ||
				toolbar.querySelector('.pk_marker_create_btn') ||
				toolbar.querySelector('.pk_selection');
			if (before) toolbar.insertBefore(btn, before);
			else toolbar.appendChild(btn);

			apply();
			return true;
		}

		apply();
		if (!makeButton()) {
			var tries = 0;
			var timer = w.setInterval(function () {
				if (makeButton() || ++tries > 30) w.clearInterval(timer);
			}, 120);
		}

		editor.listenFor && editor.listenFor('DidUpdateLen', function () { setTimeout(function () { scheduleLiveFocusWave(true); }, 0); });
		editor.listenFor && editor.listenFor('DidUnloadFile', function () { apply(); });
		editor.listenFor && editor.listenFor('DidAudioProcess', function () {
			if (getSingleWaveMode() === 'focus') {
				keepFocusPeaksStatic('focus');
				scheduleLiveFocusWave(false);
			}
		});
		editor.listenFor && editor.listenFor('DidViewFollowCursorToggle', function () {
			if (getSingleWaveMode() === 'focus') keepFocusPeaksStatic('focus');
		});
	}

	function install(editor) {
		if (!editor || editor.__amTouchClipSelectFix) return;
		editor.__amTouchClipSelectFix = true;
		installSingleWaveView(editor);

		var active = null;

		function inMultitrack() {
			var root = editor.el || d.body;
			return !!(root && root.classList && root.classList.contains('pk_mt_on'));
		}

		function onTouchStart(e) {
			if (!inMultitrack()) return;
			if (!e.touches || e.touches.length !== 1 || hasModifier(e)) return;
			if (isHandleTarget(e.target)) return;

			var clip = closestClip(e.target);
			if (!clip || clip.classList.contains('pk_mt_rec_clip')) return;

			var t = e.touches[0];
			active = { id: t.identifier, clip: clip, target: e.target, moved: false };

			e.preventDefault();
			e.stopPropagation();
			clip.dispatchEvent(mouseEvent('mousedown', t, clip));
		}

		function findTouch(list, id) {
			for (var i = 0; list && i < list.length; ++i)
				if (list[i].identifier === id) return list[i];
			return null;
		}

		function onTouchMove(e) {
			if (!active) return;
			var t = findTouch(e.touches, active.id);
			if (!t) return;
			active.moved = true;
			e.preventDefault();
			e.stopPropagation();
			d.dispatchEvent(mouseEvent('mousemove', t, active.clip));
		}

		function onTouchEnd(e) {
			if (!active) return;
			var t = findTouch(e.changedTouches, active.id);
			if (!t) return;
			e.preventDefault();
			e.stopPropagation();
			d.dispatchEvent(mouseEvent('mouseup', t, active.clip));
			active = null;
		}

		d.addEventListener('touchstart', onTouchStart, {capture: true, passive: false});
		d.addEventListener('touchmove', onTouchMove, {capture: true, passive: false});
		d.addEventListener('touchend', onTouchEnd, {capture: true, passive: false});
		d.addEventListener('touchcancel', onTouchEnd, {capture: true, passive: false});
	}

	w.AMInstallTouchClipSelectFix = install;
})(window, document);
