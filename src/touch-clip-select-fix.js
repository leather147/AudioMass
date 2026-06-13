(function (w, d) {
	'use strict';

	var SINGLE_WAVE_KEY = 'pk_single_wave_view';

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
			/* Important: multitrack.js does not move the playhead/cursor on clip mouseup
			   when shiftKey is true. We use that existing path so touch-tap selects the
			   clip but does not trigger cursor/range placement. */
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

	function installSingleWaveView(editor) {
		if (!editor || !editor.el || editor.__amSingleWaveViewMode) return;
		editor.__amSingleWaveViewMode = true;
		injectSingleWaveCss();

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
						'Вид waveform: края уходят в тишину, центр обычный' :
						'Вид waveform: обычная полная волна';
				}
			}
		}

		function choose(mode) {
			setSingleWaveMode(mode);
			apply(mode);
			if (editor.fireEvent) editor.fireEvent('RequestResize');
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
			active = {
				id: t.identifier,
				clip: clip,
				target: e.target,
				moved: false
			};

			e.preventDefault();
			e.stopPropagation();

			/* Route through the app's own mouse selection/drag logic. For an unselected
			   clip this selects it only; for an already selected clip this still allows
			   touch-drag movement, while shiftKey prevents cursor relocation on tap. */
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
