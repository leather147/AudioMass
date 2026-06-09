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
	 * timeline width as horizontal zoom changes. The actual grid now lives on
	 * .pk_mt_main as a full workspace background so it never stops after tracks.
	 */
	function clamp (min, val, max) {
		return Math.max(min, Math.min(max, val));
	}

	function setGridVars (el, values) {
		if (!el) return;
		for (var key in values) el.style.setProperty(key, values[key]);
	}

	function updateMultitrackGrid () {
		var lanes = d.getElementsByClassName('pk_mt_lanes')[0];
		var main = d.getElementsByClassName('pk_mt_main')[0];
		if (!lanes && !main) return;

		var wdt = Math.max(800,
			(lanes && (lanes.offsetWidth || lanes.scrollWidth)) ||
			(main && (main.scrollWidth || main.offsetWidth)) ||
			800);
		var hgt = Math.max(160,
			(lanes && (lanes.offsetHeight || lanes.scrollHeight)) ||
			(main && (main.scrollHeight || main.offsetHeight)) ||
			160);
		var major = clamp(96, wdt / 12, 520);
		var mid = major / 4;
		var minor = major / 16;
		var micro = major / 64;
		var ultra = major / 256;
		var left = main ? -(main.scrollLeft || 0) : 0;
		var top = main ? (24 - (main.scrollTop || 0)) : 24;
		var values = {
			'--mt-grid-major': major.toFixed(2) + 'px',
			'--mt-grid-mid': mid.toFixed(2) + 'px',
			'--mt-grid-minor': minor.toFixed(2) + 'px',
			'--mt-grid-micro': micro.toFixed(2) + 'px',
			'--mt-grid-ultra': Math.max(2, ultra).toFixed(2) + 'px',
			'--mt-grid-fade': clamp(.18, wdt / 30000, .38).toFixed(3),
			'--mt-grid-height': hgt + 'px',
			'--mt-grid-x': left + 'px',
			'--mt-grid-y': top + 'px'
		};

		setGridVars(lanes, values);
		setGridVars(main, values);
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
