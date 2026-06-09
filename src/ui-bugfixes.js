(function (w, d) {
	'use strict';

	/*
	 * AudioMass used a Chrome-only canvas timer renderer. With the Geist Mono
	 * theme that cache can clip/widen glyphs and show inconsistent zeros.
	 * Force the normal DOM timer path so CSS can control the typography.
	 */
	try {
		Object.defineProperty(w, 'chrome', {
			value:null,
			configurable:true,
			writable:true
		});
	} catch (error) {
		try { w.chrome = null; } catch (_) {}
	}

	/*
	 * Map-like multitrack grid.
	 * The grid is CSS-only visually, but these variables make it scale with the
	 * timeline width as horizontal zoom changes. Several nested grid layers then
	 * create the “square inside square” effect without becoming loud.
	 */
	function clamp (min, val, max) {
		return Math.max(min, Math.min(max, val));
	}

	function updateMultitrackGrid () {
		var lanes = d.getElementsByClassName('pk_mt_lanes')[0];
		if (!lanes) return;

		var wdt = Math.max(800, lanes.offsetWidth || lanes.scrollWidth || 800);
		var hgt = Math.max(160, lanes.offsetHeight || lanes.scrollHeight || 160);
		var major = clamp(96, wdt / 12, 520);
		var mid = major / 4;
		var minor = major / 16;
		var micro = major / 64;
		var ultra = major / 256;

		lanes.style.setProperty('--mt-grid-major', major.toFixed(2) + 'px');
		lanes.style.setProperty('--mt-grid-mid', mid.toFixed(2) + 'px');
		lanes.style.setProperty('--mt-grid-minor', minor.toFixed(2) + 'px');
		lanes.style.setProperty('--mt-grid-micro', micro.toFixed(2) + 'px');
		lanes.style.setProperty('--mt-grid-ultra', Math.max(2, ultra).toFixed(2) + 'px');
		lanes.style.setProperty('--mt-grid-fade', clamp(.22, wdt / 26000, .52).toFixed(3));
		lanes.style.setProperty('--mt-grid-height', hgt + 'px');
	}

	var raf = 0;
	function scheduleGridUpdate () {
		if (raf) return;
		raf = w.requestAnimationFrame(function () {
			raf = 0;
			updateMultitrackGrid();
		});
	}

	function attachGridWatchers () {
		updateMultitrackGrid();

		if (w.ResizeObserver) {
			var ro = new ResizeObserver(scheduleGridUpdate);
			var bind = function () {
				var lanes = d.getElementsByClassName('pk_mt_lanes')[0];
				var main = d.getElementsByClassName('pk_mt_main')[0];
				if (lanes && !lanes._mtGridObserved) {
					lanes._mtGridObserved = 1;
					ro.observe(lanes);
				}
				if (main && !main._mtGridObserved) {
					main._mtGridObserved = 1;
					ro.observe(main);
				}
			};
			bind();
			new MutationObserver(function () {
				bind();
				scheduleGridUpdate();
			}).observe(d.documentElement, {childList:true, subtree:true});
		}
		else {
			w.setInterval(updateMultitrackGrid, 350);
		}

		d.addEventListener('scroll', scheduleGridUpdate, true);
		w.addEventListener('resize', scheduleGridUpdate, false);
	}

	function clearTouchMarkerLabels (except) {
		var active = d.getElementsByClassName('pk_touch_label');
		for (var i = active.length - 1; i >= 0; --i) {
			if (active[i] !== except) active[i].classList.remove('pk_touch_label');
		}
	}

	function nearestMarker (x, y) {
		var markers = d.getElementsByClassName('pk_mrkr');
		var best = null;
		var bestDist = Infinity;
		for (var i = 0; i < markers.length; ++i) {
			var r = markers[i].getBoundingClientRect();
			var cx = Math.max(r.left - 16, Math.min(x, r.right + 18));
			var cy = Math.max(r.top - 12, Math.min(y, r.top + 34));
			var dx = x - cx;
			var dy = y - cy;
			var dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < bestDist && dist <= 22) {
				bestDist = dist;
				best = markers[i];
			}
		}
		return best;
	}

	function attachMarkerTouchLabels () {
		d.addEventListener('pointerdown', function (ev) {
			var noHover = w.matchMedia && w.matchMedia('(hover:none)').matches;
			if (!noHover) return;
			var marker = ev.target && ev.target.closest && ev.target.closest('.pk_mrkr');
			if (!marker) marker = nearestMarker(ev.clientX, ev.clientY);
			if (marker) {
				clearTouchMarkerLabels(marker);
				marker.classList.add('pk_touch_label');
				w.clearTimeout(marker._pkTouchLabelTimer);
				marker._pkTouchLabelTimer = w.setTimeout(function () {
					marker.classList.remove('pk_touch_label');
				}, 2200);
			}
			else {
				clearTouchMarkerLabels();
			}
		}, true);
	}

	function boot () {
		attachGridWatchers();
		attachMarkerTouchLabels();
	}

	if (d.readyState === 'loading') {
		d.addEventListener('DOMContentLoaded', boot, false);
	}
	else {
		boot();
	}
})(window, document);
