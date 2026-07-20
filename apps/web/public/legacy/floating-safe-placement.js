(function (w, d) {
	'use strict';

	var PAD = 8;
	var GAP = 8;
	var raf = 0;
	var lastPointer = {x: 0, y: 0};
	var FLOAT_SELECTOR = [
		'.pk_menu',
		'.pk_contextMenu',
		'.pk_ctx',
		'.pk_pgeq_freq',
		'.pk_anim_popover',
		'.pk_modal:not(.pk_modal_fullscreen):not(.pk_modal_big)'
	].join(',');

	function viewport () {
		return {
			w: w.innerWidth || d.documentElement.clientWidth || 1,
			h: w.innerHeight || d.documentElement.clientHeight || 1
		};
	}

	function visible (el) {
		if (!el || !el.getBoundingClientRect) return false;
		var st = w.getComputedStyle(el);
		if (st.display === 'none' || st.visibility === 'hidden' || +st.opacity === 0) return false;
		var r = el.getBoundingClientRect();
		return r.width > 2 && r.height > 2;
	}

	function isFixedLike (el) {
		var st = w.getComputedStyle(el);
		return st.position === 'fixed' || st.position === 'absolute';
	}

	function clamp (v, min, max) {
		return Math.max(min, Math.min(max, v));
	}

	function px (value) {
		var n = parseFloat(value);
		return n === n ? n : 0;
	}

	function hasOwnPlacement (el) {
		return !!el._pkSafePlacement;
	}

	function resetSafePlacement (el) {
		if (!hasOwnPlacement(el)) return;
		el.style.left = el._pkSafePlacement.left;
		el.style.top = el._pkSafePlacement.top;
		el.style.right = el._pkSafePlacement.right;
		el.style.bottom = el._pkSafePlacement.bottom;
		el.style.transform = el._pkSafePlacement.transform;
	}

	function rememberPlacement (el) {
		if (hasOwnPlacement(el)) return;
		el._pkSafePlacement = {
			left: el.style.left || '',
			top: el.style.top || '',
			right: el.style.right || '',
			bottom: el.style.bottom || '',
			transform: el.style.transform || ''
		};
	}

	function anchorFor (el) {
		var parent = el.parentElement;
		if (parent) {
			var pr = parent.getBoundingClientRect();
			if (pr.width && pr.height && pr.left >= -40 && pr.top >= -40) return pr;
		}
		return {
			left:lastPointer.x,
			right:lastPointer.x,
			top:lastPointer.y,
			bottom:lastPointer.y,
			width:0,
			height:0
		};
	}

	function bestHorizontal (el, rect, anchor, vp) {
		var wdt = Math.min(rect.width, vp.w - PAD * 2);
		var candidates = [
			anchor.right + GAP,
			anchor.left - wdt - GAP,
			anchor.left,
			anchor.right - wdt,
			lastPointer.x + GAP,
			lastPointer.x - wdt - GAP,
			rect.left
		];

		for (var i = 0; i < candidates.length; ++i) {
			var x = candidates[i];
			if (x >= PAD && x + wdt <= vp.w - PAD) return x;
		}
		return clamp(rect.left, PAD, vp.w - wdt - PAD);
	}

	function bestVertical (el, rect, anchor, vp) {
		var hgt = Math.min(rect.height, vp.h - PAD * 2);
		var candidates = [
			anchor.top,
			anchor.bottom + GAP,
			anchor.top - hgt - GAP,
			anchor.bottom - hgt,
			lastPointer.y + GAP,
			lastPointer.y - hgt - GAP,
			rect.top
		];

		for (var i = 0; i < candidates.length; ++i) {
			var y = candidates[i];
			if (y >= PAD && y + hgt <= vp.h - PAD) return y;
		}
		return clamp(rect.top, PAD, vp.h - hgt - PAD);
	}

	function safePlace (el) {
		if (!visible(el) || !isFixedLike(el)) return;
		rememberPlacement(el);

		var vp = viewport();
		var rect = el.getBoundingClientRect();
		var needsX = rect.left < PAD || rect.right > vp.w - PAD;
		var needsY = rect.top < PAD || rect.bottom > vp.h - PAD;
		if (!needsX && !needsY) return;

		var anchor = anchorFor(el);
		var parent = el.offsetParent && el.offsetParent !== d.body && el.offsetParent !== d.documentElement ?
			el.offsetParent.getBoundingClientRect() : {left:0, top:0};
		var nextX = needsX ? bestHorizontal(el, rect, anchor, vp) : rect.left;
		var nextY = needsY ? bestVertical(el, rect, anchor, vp) : rect.top;

		el.classList.add('pk_safe_float');
		el.style.right = 'auto';
		el.style.bottom = 'auto';
		el.style.left = Math.round(nextX - parent.left) + 'px';
		el.style.top = Math.round(nextY - parent.top) + 'px';
	}

	function scan () {
		raf = 0;
		var els = d.querySelectorAll(FLOAT_SELECTOR);
		for (var i = 0; i < els.length; ++i) safePlace(els[i]);
	}

	function schedule () {
		if (raf) return;
		raf = w.requestAnimationFrame(scan);
	}

	function boot () {
		d.addEventListener('pointerdown', function (ev) {
			lastPointer.x = ev.clientX;
			lastPointer.y = ev.clientY;
			schedule();
		}, true);
		d.addEventListener('pointermove', function (ev) {
			lastPointer.x = ev.clientX;
			lastPointer.y = ev.clientY;
		}, true);
		d.addEventListener('click', schedule, true);
		d.addEventListener('contextmenu', function (ev) {
			lastPointer.x = ev.clientX;
			lastPointer.y = ev.clientY;
			w.setTimeout(schedule, 0);
			w.setTimeout(schedule, 40);
		}, true);
		d.addEventListener('scroll', schedule, true);
		w.addEventListener('resize', schedule, false);

		new MutationObserver(schedule).observe(d.documentElement, {
			childList:true,
			subtree:true,
			attributes:true,
			attributeFilter:['class', 'style']
		});

		[0, 60, 180, 420].forEach(function (ms) { w.setTimeout(schedule, ms); });
	}

	if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot, false);
	else boot();
})(window, document);
