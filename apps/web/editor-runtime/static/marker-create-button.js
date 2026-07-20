(function (w, d) {
	'use strict';

	function install(app) {
		if (!app || app.__markerCreateButtonInstalled) return;
		app.__markerCreateButtonInstalled = true;

		var btn = null;
		var installRaf = 0;
		var max = 11;

		function qs(sel, root) {
			return (root || d).querySelector(sel);
		}

		function cleanName(value) {
			value = (value || '').replace(/[\r\n\t]/g, ' ').trim();
			return value ? value.substr(0, max) : '';
		}

		function markerIcon() {
			return '' +
				'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
					'<path d="M12 3v14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
					'<path d="M12 3l7 4.2-7 4.2L5 7.2 12 3z" fill="currentColor" opacity=".94"/>' +
					'<path d="M12 17l-3 4h6l-3-4z" fill="currentColor" opacity=".86"/>' +
				'</svg>';
		}

		function canCreateMarker() {
			if (app.multitrack && app.multitrack.IsOn && app.multitrack.IsOn()) {
				return !!(app.multitrack.HasClips && app.multitrack.HasClips());
			}
			var ws = app.engine && app.engine.wavesurfer;
			return !!(ws && ws.getDuration && ws.getDuration());
		}

		function openDialog() {
			if (!canCreateMarker()) {
				if (w.OneUp) w.OneUp('Load audio before adding a marker', 1200);
				return;
			}

			var mid = 'mrk_add_named';
			var defaultName = 'Marker';
			new PKSimpleModal({
				title: 'New marker',
				clss: 'pk_fnt10 pk_new_marker_modal',
				ondestroy: function () {
					if (app.ui && app.ui.InteractionHandler) app.ui.InteractionHandler.forceUnset(mid);
					if (app.ui && app.ui.KeyHandler) {
						app.ui.KeyHandler.removeCallback(mid + 'esc');
						app.ui.KeyHandler.removeCallback(mid + 'en');
					}
				},
				buttons: [{
					title: 'Create',
					clss: 'pk_modal_a_accpt',
					callback: function (modal) {
						var input = modal.el_body.getElementsByTagName('input')[0];
						var name = cleanName(input && input.value);
						if (!name) {
							if (w.OneUp) w.OneUp('Enter a marker name', 1200);
							return;
						}
						app.fireEvent('MrkrAdd', {name: name});
						modal.Destroy();
					}
				}],
				body: '<label for="k_new_mrkr">Marker name</label>' +
					'<p class="pk_marker_name_hint">The marker will be created at the current cursor position.</p>' +
					'<input style="width:100%;box-sizing:border-box;min-width:0" maxlength="' + max + '" class="pk_txt" type="text" id="k_new_mrkr" />',
				setup: function (modal) {
					if (app.ui && app.ui.InteractionHandler) app.ui.InteractionHandler.forceSet(mid);
					if (app.ui && app.ui.KeyHandler) {
						app.ui.KeyHandler.addCallback(mid + 'esc', function () {
							if (!app.ui.InteractionHandler || app.ui.InteractionHandler.check(mid)) modal.Destroy();
						}, [27]);
						app.ui.KeyHandler.addCallback(mid + 'en', function () {
							if (!app.ui.InteractionHandler || app.ui.InteractionHandler.check(mid)) modal.els.bottom[0].click();
						}, [13]);
					}
					setTimeout(function () {
						if (!modal.el) return;
						var input = modal.el.getElementsByTagName('input')[0];
						if (!input) return;
						input.value = defaultName;
						input.focus();
						input.selectionStart = 0;
						input.selectionEnd = input.value.length;
					}, 20);
				}
			}).Show();
		}

		function makeButton() {
			var toolbar = qs('.pk_tb', app.el || d) || qs('.pk_tb');
			if (!toolbar) return null;
			if (btn && btn.parentNode === toolbar) return btn;

			btn = d.createElement('button');
			btn.type = 'button';
			btn.tabIndex = -1;
			btn.className = 'pk_marker_add_btn';
			btn.title = 'Create a new marker';
			btn.setAttribute('aria-label', 'Create a new marker');
			btn.innerHTML = markerIcon() + '<span>Marker</span>';
			btn.addEventListener('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				openDialog();
			}, false);

			var selection = qs('.pk_selection', toolbar);
			var wave = qs('.pk_comp_wave_badge', toolbar);
			if (selection) toolbar.insertBefore(btn, selection);
			else if (wave && wave.nextSibling) toolbar.insertBefore(btn, wave.nextSibling);
			else toolbar.appendChild(btn);
			return btn;
		}

		function syncButtonState() {
			if (!btn) return;
			btn.classList[canCreateMarker() ? 'remove' : 'add']('pk_disabled');
		}

		function ensure() {
			installRaf = 0;
			makeButton();
			syncButtonState();
		}

		function schedule() {
			if (installRaf) return;
			installRaf = w.requestAnimationFrame(ensure);
		}

		if (app.listenFor) {
			app.listenFor('DidUpdateMultitrack', schedule);
			app.listenFor('DidUpdateLen', schedule);
			app.listenFor('RequestResize', schedule);
			app.listenFor('DidUnloadFile', schedule);
		}

		var mo = new MutationObserver(function () {
			if (!btn || !btn.parentNode) schedule();
		});
		mo.observe(app.el || d.body, {childList: true, subtree: true});

		schedule();
		w.setTimeout(schedule, 250);
		w.setTimeout(schedule, 1200);
	}

	w.AMInstallMarkerCreateButton = install;
})(window, document);
