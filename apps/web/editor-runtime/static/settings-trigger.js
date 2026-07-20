(function (w, d) {
	'use strict';

	function label () {
		return 'Settings';
	}

	function updateLabel () {
		var button = d.querySelector('.am_settings_entry>button');
		if (!button) return;
		button.textContent = label();
		button.setAttribute('aria-label', label());
	}

	function attach () {
		var header = d.querySelector('.pk_hdr');
		if (!header) return false;
		if (header.querySelector('.am_settings_entry')) {
			updateLabel();
			return true;
		}
		var item = d.createElement('div');
		item.className = 'pk_btn pk_noselect am_settings_entry';
		var button = d.createElement('button');
		button.type = 'button';
		button.tabIndex = -1;
		button.textContent = label();
		button.setAttribute('aria-label', label());
		button.onclick = function (event) {
			event.preventDefault();
			event.stopPropagation();
			w.AMAppearance.open('themes');
		};
		item.appendChild(button);
		header.appendChild(item);
		return true;
	}

	function refreshRenderers () {
		var editor = w.PKAudioEditor;
		var wavesurfer = editor && editor.engine && editor.engine.wavesurfer;
		if (wavesurfer && w.AMTheme) {
			var wave = w.AMTheme.color('wave-color', '#8ef1ec');
			var progress = w.AMTheme.color('wave-progress', 'rgba(255,77,94,.24)');
			var cursor = w.AMTheme.color('ring', '#43e4dc');
			wavesurfer.params.waveColor = wave;
			wavesurfer.params.progressColor = progress;
			wavesurfer.params.cursorColor = cursor;
			if (wavesurfer.setWaveColor) wavesurfer.setWaveColor(wave);
			if (wavesurfer.setProgressColor) wavesurfer.setProgressColor(progress);
			if (wavesurfer.setCursorColor) wavesurfer.setCursorColor(cursor);
			if (wavesurfer.drawBuffer && wavesurfer.backend && wavesurfer.backend.buffer) wavesurfer.drawBuffer();
		}
		if (editor && editor.fireEvent) editor.fireEvent('RequestResize');
		if (w.dispatchEvent && w.Event) w.dispatchEvent(new Event('resize'));
	}

	function scheduleRefresh () {
		refreshRenderers();
		if (!w.requestAnimationFrame) return;
		w.requestAnimationFrame(function () {
			w.requestAnimationFrame(refreshRenderers);
		});
	}

	function boot () {
		if (!attach()) {
			var observer = new MutationObserver(function () {
				if (attach()) observer.disconnect();
			});
			observer.observe(d.documentElement, {childList:true, subtree:true});
		}
		scheduleRefresh();
	}

	if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot, false);
	else boot();

	w.addEventListener('am:themechange', scheduleRefresh);
	w.addEventListener('am:localechange', updateLabel);
})(window, document);
