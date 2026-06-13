(function (w, d) {
	'use strict';

	function install(app) {
		if (!app || app.__clipRenameButtonInstalled) return;
		app.__clipRenameButtonInstalled = true;

		var btn = null;
		var selectedClip = null;
		var installRaf = 0;
		var max = 64;

		function qs(sel, root) {
			return (root || d).querySelector(sel);
		}

		function cleanName(value) {
			value = (value || '').replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
			return value ? value.substr(0, max) : '';
		}

		function icon() {
			return '' +
				'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
					'<path d="M4 7.5h10.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".82"/>' +
					'<path d="M4 12h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".64"/>' +
					'<path d="M4 16.5h5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".46"/>' +
					'<path d="M13.2 17.8l1.1-4.2 5.8-5.8a1.7 1.7 0 0 1 2.4 2.4l-5.8 5.8-4.2 1.1.7-2.9z" fill="currentColor" opacity=".96"/>' +
					'<path d="M18.8 8.9l2.3 2.3" fill="none" stroke="#071014" stroke-width="1.25" stroke-linecap="round" opacity=".72"/>' +
				'</svg>';
		}

		function isMtOn() {
			return !!(app.multitrack && app.multitrack.IsOn && app.multitrack.IsOn());
		}

		function currentClipNode() {
			var root = app.el || d;
			return qs('.pk_mt_clip.pk_mt_clip_sel', root) || qs('.pk_mt_clip_sel', root);
		}

		function selectedClipId() {
			var node = currentClipNode();
			return node && node.getAttribute('data-clip');
		}

		function canRename() {
			return isMtOn() && !!selectedClip && (!selectedClipId() || selectedClipId() === selectedClip.id);
		}

		function syncLabel(name) {
			var node = currentClipNode();
			if (!node) return;
			var label = node.querySelector('span');
			if (label) label.textContent = name;
		}

		function pushUndo(prev) {
			if (!prev || !app.fireEvent) return;
			var data = app.engine && app.engine.wavesurfer && app.engine.wavesurfer.backend && app.engine.wavesurfer.backend.buffer;
			app.fireEvent('StateRequestPush', {
				type: 'mult',
				desc: 'Rename Clip',
				mt: prev,
				data: data
			});
		}

		function renameTo(name) {
			name = cleanName(name);
			if (!name) {
				if (w.OneUp) w.OneUp('Введите название карточки', 1200);
				return false;
			}
			if (!canRename()) {
				if (w.OneUp) w.OneUp('Выберите звуковую карточку', 1200);
				return false;
			}
			if (name === selectedClip.name) return true;

			var prev = app.multitrack && app.multitrack.getState ? app.multitrack.getState() : null;
			selectedClip.name = name;
			pushUndo(prev);
			syncLabel(name);
			if (app.fireEvent) {
				app.fireEvent('DidSelectClip', selectedClip);
				app.fireEvent('DidUpdateMultitrack');
			}
			if (w.OneUp) w.OneUp('Карточка переименована', 900);
			return true;
		}

		function openDialog() {
			if (!canRename()) {
				if (w.OneUp) w.OneUp('Выберите звуковую карточку', 1200);
				return;
			}

			var mid = 'clip_rename_named';
			var currentName = cleanName(selectedClip.name || 'Audio') || 'Audio';
			new PKSimpleModal({
				title: 'Название карточки',
				clss: 'pk_fnt10 pk_rename_clip_modal',
				ondestroy: function () {
					if (app.ui && app.ui.InteractionHandler) app.ui.InteractionHandler.forceUnset(mid);
					if (app.ui && app.ui.KeyHandler) {
						app.ui.KeyHandler.removeCallback(mid + 'esc');
						app.ui.KeyHandler.removeCallback(mid + 'en');
					}
				},
				buttons: [{
					title: 'Сохранить',
					clss: 'pk_modal_a_accpt',
					callback: function (modal) {
						var input = modal.el_body.getElementsByTagName('input')[0];
						if (renameTo(input && input.value)) modal.Destroy();
					}
				}],
				body: '<label for="k_clip_rename">Название карточки</label>' +
					'<p class="pk_clip_name_hint">Имя будет показано на выбранной звуковой карточке на дорожке.</p>' +
					'<input style="width:100%;box-sizing:border-box;min-width:0" maxlength="' + max + '" class="pk_txt" type="text" id="k_clip_rename" />',
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
						input.value = currentName;
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
			btn.className = 'pk_clip_rename_btn pk_disabled';
			btn.title = 'Задать имя выбранной карточке звука';
			btn.setAttribute('aria-label', 'Задать имя выбранной карточке звука');
			btn.innerHTML = icon() + '<span>Имя</span>';
			btn.addEventListener('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				openDialog();
			}, false);

			var selection = qs('.pk_selection', toolbar);
			if (selection) toolbar.insertBefore(btn, selection);
			else toolbar.appendChild(btn);
			return btn;
		}

		function syncButtonState() {
			if (!btn) return;
			btn.classList[canRename() ? 'remove' : 'add']('pk_disabled');
			if (selectedClip && selectedClip.name) btn.setAttribute('data-name', selectedClip.name);
			else btn.removeAttribute('data-name');
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
			app.listenFor('DidSelectClip', function (clip) {
				selectedClip = clip || null;
				schedule();
			});
			app.listenFor('DidDeselectClip', function () {
				selectedClip = null;
				schedule();
			});
			app.listenFor('DidUpdateMultitrack', schedule);
			app.listenFor('RequestResize', schedule);
		}

		var mo = new MutationObserver(function () {
			if (!btn || !btn.parentNode) schedule();
			else syncButtonState();
		});
		mo.observe(app.el || d.body, {childList: true, subtree: true});

		schedule();
		w.setTimeout(schedule, 250);
		w.setTimeout(schedule, 1200);
	}

	w.AMInstallClipRenameButton = install;
})(window, document);
