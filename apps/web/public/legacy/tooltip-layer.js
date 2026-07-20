(function (w, d) {
	'use strict';

	var PAD = 8;
	var GAP = 8;
	var layer = null;
	var current = null;
	var lastEvent = null;
	var hideTimer = 0;

	function getLayer () {
		if (layer) return layer;
		layer = d.createElement('div');
		layer.className = 'pk_safe_tooltip';
		layer.setAttribute('aria-hidden', 'true');
		d.body.appendChild(layer);
		return layer;
	}

	function textFrom (el) {
		if (!el) return '';
		var span = el.querySelector && el.querySelector(':scope > span');
		var text = span ? span.textContent : '';
		if (!text) text = el.getAttribute('aria-label') || el.getAttribute('title') || '';
		return (text || '').replace(/\s+/g, ' ').trim();
	}

	function tooltipTarget (node) {
		if (!node || !node.closest) return null;
		return node.closest('.pk_btn,.pk_mt_head button,.pk_mt_track button,.pk_mt_knob,.pk_sel_edt,.pk_modal_a_top');
	}

	function clamp (value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function place (target) {
		var tip = getLayer();
		var rect = target.getBoundingClientRect();
		var tr = tip.getBoundingClientRect();
		var vw = w.innerWidth || d.documentElement.clientWidth;
		var vh = w.innerHeight || d.documentElement.clientHeight;

		var x = rect.left + rect.width / 2 - tr.width / 2;
		var y = rect.bottom + GAP;

		if (y + tr.height + PAD > vh) y = rect.top - tr.height - GAP;
		if (y < PAD) y = clamp((lastEvent && lastEvent.clientY ? lastEvent.clientY : rect.bottom) + GAP, PAD, vh - tr.height - PAD);

		x = clamp(x, PAD, vw - tr.width - PAD);
		tip.style.left = Math.round(x) + 'px';
		tip.style.top = Math.round(y) + 'px';
	}

	function show (target) {
		var text = textFrom(target);
		if (!text || target.classList.contains('pk_inact') || target.disabled) return hide();
		current = target;
		var tip = getLayer();
		tip.textContent = text;
		tip.classList.add('pk_act');
		w.clearTimeout(hideTimer);
		w.requestAnimationFrame(function () { if (current === target) place(target); });
	}

	function hide () {
		current = null;
		w.clearTimeout(hideTimer);
		hideTimer = w.setTimeout(function () {
			if (!current && layer) layer.classList.remove('pk_act');
		}, 40);
	}

	function neutralizeNativeSpans () {
		var css = d.getElementById('pk-tooltip-native-hide');
		if (css) return;
		css = d.createElement('style');
		css.id = 'pk-tooltip-native-hide';
		css.textContent = '.pk_tb .pk_btn>span,.pk_ftr .pk_btn>span,.pk_mt_head button>span,.pk_mt_track button>span,.pk_mt_knob>span,.pk_sel_edt>span,.pk_modal_a_top>span{visibility:hidden!important;opacity:0!important;display:none!important}';
		d.head.appendChild(css);
	}

	function boot () {
		neutralizeNativeSpans();
		d.addEventListener('pointermove', function (ev) {
			lastEvent = ev;
			var target = tooltipTarget(ev.target);
			if (!target) return hide();
			if (target !== current) show(target);
			else place(target);
		}, true);

		d.addEventListener('pointerleave', function (ev) {
			if (!ev.relatedTarget) hide();
		}, true);

		d.addEventListener('pointerdown', function (ev) {
			lastEvent = ev;
			var target = tooltipTarget(ev.target);
			if (target) {
				show(target);
				w.clearTimeout(target._pkTooltipTouchTimer);
				target._pkTooltipTouchTimer = w.setTimeout(hide, 1600);
			}
		}, true);

		d.addEventListener('scroll', function () { if (current) place(current); }, true);
		w.addEventListener('resize', function () { if (current) place(current); }, false);
	}

	if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot, false);
	else boot();
})(window, document);
