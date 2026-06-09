(function (w, d) {
	'use strict';

	function extraWidth (main) {
		return Math.max(0, (main && main.clientWidth ? main.clientWidth : w.innerWidth || 0) * 2);
	}

	function numericWidth (el) {
		var raw = el && el.style && el.style.width;
		var n = raw ? parseFloat(raw) : 0;
		return n === n ? n : 0;
	}

	function apply () {
		var main = d.getElementsByClassName('pk_mt_main')[0];
		var lanes = d.getElementsByClassName('pk_mt_lanes')[0];
		var ruler = d.getElementsByClassName('pk_mt_ruler')[0];
		if (!main || !lanes || !ruler) return;

		var base = Math.max(
			numericWidth(lanes),
			numericWidth(ruler),
			lanes.scrollWidth || 0,
			ruler.scrollWidth || 0,
			main.clientWidth || 0
		);
		if (!base) return;
		var extra = extraWidth(main);
		var target = Math.round(base + extra);

		main.style.setProperty('--timeline-extra-scroll', Math.round(extra) + 'px');
		if (lanes.style.width !== target + 'px') lanes.style.width = target + 'px';
		if (ruler.style.width !== target + 'px') ruler.style.width = target + 'px';
	}

	var raf = 0;
	function schedule () {
		if (raf) return;
		raf = w.requestAnimationFrame(function () {
			raf = 0;
			apply();
		});
	}

	function boot () {
		apply();
		new MutationObserver(schedule).observe(d.documentElement, {
			childList:true,
			subtree:true,
			attributes:true,
			attributeFilter:['style', 'class']
		});
		d.addEventListener('scroll', schedule, true);
		w.addEventListener('resize', schedule, false);
		[60, 180, 420, 900].forEach(function (ms) { w.setTimeout(schedule, ms); });
	}

	if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot, false);
	else boot();
})(window, document);
