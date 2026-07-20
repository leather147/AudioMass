(function (w, d) {
	'use strict';

	var KEY = 'pk_single_wave_view';

	function storageGet() {
		try { return w.localStorage && w.localStorage.getItem(KEY); }
		catch (e) { return null; }
	}

	function storageSet(mode) {
		try { w.localStorage && w.localStorage.setItem(KEY, mode); }
		catch (e) {}
	}

	function install(editor) {
		if (!editor || !editor.el || editor.__singleWaveformViewMode) return;
		editor.__singleWaveformViewMode = true;

		var root = editor.el;
		var btn = null;

		function currentMode() {
			var saved = storageGet();
			return saved === 'normal' || saved === 'focus' ? saved : 'focus';
		}

		function modeLabel(mode) {
			return mode === 'focus' ? 'Фокус' : 'Обычный';
		}

		function apply(mode) {
			mode = mode || currentMode();
			root.classList.toggle('pk_single_wave_focus', mode === 'focus');
			root.classList.toggle('pk_single_wave_normal', mode === 'normal');
			if (btn) {
				btn.classList.toggle('pk_act', mode === 'focus');
				btn.setAttribute('aria-pressed', mode === 'focus' ? 'true' : 'false');
				btn.childNodes[1].nodeValue = modeLabel(mode);
				var tip = btn.querySelector('span');
				if (tip) {
					tip.textContent = mode === 'focus' ?
						'Вид waveform: края уходят в тишину, центр обычный' :
						'Вид waveform: обычная полная волна';
				}
			}
		}

		function setMode(mode) {
			storageSet(mode);
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
			btn.appendChild(d.createTextNode(''));
			btn.appendChild(d.createTextNode(modeLabel(currentMode())));
			var tip = d.createElement('span');
			btn.appendChild(tip);
			btn.onclick = function () {
				var next = currentMode() === 'focus' ? 'normal' : 'focus';
				setMode(next);
				this.blur();
			};

			var insertBefore = toolbar.querySelector('.pk_composition_wave_badge') ||
				toolbar.querySelector('.pk_marker_create_btn') ||
				toolbar.querySelector('.pk_selection');
			if (insertBefore) toolbar.insertBefore(btn, insertBefore);
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

		editor.listenFor && editor.listenFor('DidUpdateLen', function () { apply(); });
		editor.listenFor && editor.listenFor('DidUnloadFile', function () { apply(); });
		editor.listenFor && editor.listenFor('RequestResize', function () { apply(); });
	}

	w.AMInstallSingleWaveformViewMode = install;
})(window, document);
