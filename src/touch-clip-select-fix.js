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
		if (!canvas || !canvas.parentNode) return false;
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

		/* Strictly symmetrical envelope: only the distance from the center matters,
		   so left and right sides decay identically. */
		var distFromCenter = Math.abs(nx - 0.5) * 2; // 0 center, 1 edges
		var edge = 1 - distFromCenter;
		var edgeZone = channel === 1 ? 0.40 : 0.34;
		var t = smoothstep(edge / edgeZone);

		/* Lower stereo channel is intentionally a little different: slightly wider
		   fade and a very soft symmetrical breathing curve. It is not a copy of the
		   top channel, but it still remains balanced left-to-right. */
		if (channel === 1) {
			t = Math.pow(t, 0.92);
			var breath = 0.982 + 0.018 * Math.cos(distFromCenter * Math.PI * 2);
			t *= breath;
		}

		var floor = channel === 1 ? 0.055 : 0.035;
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

		function label(mode) {
			return mode === 'focus' ? 'Фокус' : 'Обычный';
		}

		function apply(mode) {
			mode = mode || getSingleWaveMode();
			root.classList.toggle('pk_single_wave_focus', mode === 'focus');
			root.classList.toggle('pk_single_wave_normal', mode === 'normal');

			if (btn) {
				btn.classList.toggle('pk_act', mode === 'focus');
				btn.setAttribute('aria-pressed', mode === 'focus' ? 'true' : 'false');
				var txt = btn.querySelector('b');
				var tip = btn.querySelector('span');
				if (txt) txt.textContent = label(mode);
				if (tip) {
					tip.textContent = mode === 'focus' ?
						'Вид waveform: сама волна симметрично затухает к краям' :
						'Вид waveform: обычная полная волна';
				}
			}
		}

		function choose(mode) {
			setSingleWaveMode(mode);
			apply(mode);
			redrawWave(editor);
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

		editor.listenFor && editor.listenFor('DidUpdateLen', function () { setTimeout(function () { redrawWave(editor); }, 0); });
		editor.listenFor && editor.listenFor('DidUnloadFile', function () { apply(); });
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
