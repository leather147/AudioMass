(function (w, d) {
	'use strict';

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

	function install(editor) {
		if (!editor || editor.__amTouchClipSelectFix) return;
		editor.__amTouchClipSelectFix = true;

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
