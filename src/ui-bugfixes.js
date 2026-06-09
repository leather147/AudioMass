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

	var trackPalette = [
		{bg:'rgba(56,216,255,.15)', bg2:'rgba(56,216,255,.075)', hi:'rgba(56,216,255,.24)', br:'rgba(56,216,255,.58)', br2:'rgba(115,237,255,.88)', glow:'rgba(56,216,255,.20)', txt:'#c9f7ff'},
		{bg:'rgba(52,211,153,.15)', bg2:'rgba(52,211,153,.075)', hi:'rgba(52,211,153,.23)', br:'rgba(52,211,153,.56)', br2:'rgba(125,246,194,.86)', glow:'rgba(52,211,153,.19)', txt:'#c9ffe9'},
		{bg:'rgba(167,139,250,.16)', bg2:'rgba(167,139,250,.078)', hi:'rgba(167,139,250,.25)', br:'rgba(167,139,250,.58)', br2:'rgba(205,190,255,.88)', glow:'rgba(167,139,250,.20)', txt:'#eee9ff'},
		{bg:'rgba(250,204,21,.14)', bg2:'rgba(250,204,21,.070)', hi:'rgba(250,204,21,.22)', br:'rgba(250,204,21,.52)', br2:'rgba(255,230,112,.82)', glow:'rgba(250,204,21,.16)', txt:'#fff4bf'},
		{bg:'rgba(244,114,182,.16)', bg2:'rgba(244,114,182,.075)', hi:'rgba(244,114,182,.25)', br:'rgba(244,114,182,.58)', br2:'rgba(255,181,218,.88)', glow:'rgba(244,114,182,.20)', txt:'#ffe1f0'},
		{bg:'rgba(96,165,250,.16)', bg2:'rgba(96,165,250,.078)', hi:'rgba(96,165,250,.25)', br:'rgba(96,165,250,.58)', br2:'rgba(166,207,255,.88)', glow:'rgba(96,165,250,.20)', txt:'#dcecff'},
		{bg:'rgba(251,146,60,.15)', bg2:'rgba(251,146,60,.072)', hi:'rgba(251,146,60,.23)', br:'rgba(251,146,60,.55)', br2:'rgba(255,190,128,.85)', glow:'rgba(251,146,60,.18)', txt:'#ffe5cf'},
		{bg:'rgba(45,212,191,.15)', bg2:'rgba(45,212,191,.075)', hi:'rgba(45,212,191,.23)', br:'rgba(45,212,191,.56)', br2:'rgba(130,246,234,.86)', glow:'rgba(45,212,191,.19)', txt:'#d4fffb'}
	];

	function setColorVars (el, color) {
		if (!el || !color) return;
		el.style.setProperty('--trk-bg', color.bg);
		el.style.setProperty('--trk-bg-2', color.bg2);
		el.style.setProperty('--trk-hi', color.hi);
		el.style.setProperty('--trk-br', color.br);
		el.style.setProperty('--trk-br-strong', color.br2);
		el.style.setProperty('--trk-glow', color.glow);
		el.style.setProperty('--trk-text', color.txt);
		el.style.setProperty('--mt-bg', color.bg);
		el.style.setProperty('--mt-br', color.br);
	}

	function syncTrackClipColors () {
		var rows = Array.prototype.slice.call(d.querySelectorAll('.pk_mt_tracks .pk_mt_track[data-track]'));
		if (!rows.length) return;

		var byTrack = {};
		rows.forEach(function (row, index) {
			var id = row.getAttribute('data-track');
			var color = trackPalette[index % trackPalette.length];
			byTrack[id] = color;
			row.setAttribute('data-track-color', index % trackPalette.length);
			setColorVars(row, color);
		});

		var lanes = d.querySelectorAll('.pk_mt_lane[data-track]');
		for (var i = 0; i < lanes.length; ++i) {
			var tid = lanes[i].getAttribute('data-track');
			setColorVars(lanes[i], byTrack[tid] || trackPalette[i % trackPalette.length]);
		}

		var clips = d.querySelectorAll('.pk_mt_lane[data-track] .pk_mt_clip');
		for (i = 0; i < clips.length; ++i) {
			var lane = clips[i].closest('.pk_mt_lane[data-track]');
			if (!lane) continue;
			tid = lane.getAttribute('data-track');
			clips[i].setAttribute('data-track', tid);
			setColorVars(clips[i], byTrack[tid] || trackPalette[0]);
		}
	}

	var colorRaf = 0;
	function scheduleTrackColorSync () {
		if (colorRaf) return;
		colorRaf = w.requestAnimationFrame(function () {
			colorRaf = 0;
			syncTrackClipColors();
		});
	}

	function attachGridWatchers () {
		updateMultitrackGrid();
		syncTrackClipColors();

		if (w.ResizeObserver) {
			var ro = new ResizeObserver(function () {
				scheduleGridUpdate();
				scheduleTrackColorSync();
			});
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
				scheduleTrackColorSync();
			}).observe(d.documentElement, {childList:true, subtree:true});
		}
		else {
			w.setInterval(function () {
				updateMultitrackGrid();
				syncTrackClipColors();
			}, 350);
		}

		d.addEventListener('scroll', scheduleGridUpdate, true);
		w.addEventListener('resize', function () {
			scheduleGridUpdate();
			scheduleTrackColorSync();
		}, false);
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