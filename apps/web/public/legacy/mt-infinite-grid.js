(function (w, d) {
	'use strict';

	var raf = 0;
	var last = '';
	var resizeObserver = null;
	var mutationObserver = null;

	function niceMajorSeconds (pxPerSecond) {
		var step = 1;
		while (pxPerSecond * step < 96) step *= 2;
		return step;
	}

	function px (value) {
		return Math.max(1, Math.round(value * 100) / 100) + 'px';
	}

	function alpha (size, min, max) {
		if (size <= min) return 0;
		if (size >= max) return 1;
		return (size - min) / (max - min);
	}

	function findParts () {
		var app = w.PKAudioEditor;
		var root = app && app.el;
		if (!root || !root.classList || !root.classList.contains('pk_mt_on')) return null;

		var lanes = root.getElementsByClassName('pk_mt_lanes')[0];
		var main = root.getElementsByClassName('pk_mt_main')[0];
		var mt = app.multitrack;
		if (!lanes || !main || !mt || !mt.GetDuration) return null;

		return {app:app, root:root, lanes:lanes, main:main, mt:mt};
	}

	function updateGrid () {
		raf = 0;

		var parts = findParts();
		if (!parts) return;

		var duration = Math.max(0.001, parts.mt.GetDuration());
		var contentWidth = Math.max(
			1,
			parts.lanes.scrollWidth || 0,
			parts.lanes.offsetWidth || 0,
			parseFloat(parts.lanes.style.width) || 0
		);
		var pxPerSecond = contentWidth / duration;
		var majorSeconds = niceMajorSeconds(pxPerSecond);
		var major = Math.max(32, pxPerSecond * majorSeconds);
		var mid = major / 4;
		var minor = major / 16;
		var micro = major / 64;

		var midA = 0.08 + alpha(mid, 10, 44) * 0.08;
		var minorA = alpha(minor, 7, 22) * 0.085;
		var microA = alpha(micro, 8, 18) * 0.045;
		var majorA = 0.20 + alpha(major, 96, 360) * 0.10;

		var state = [
			px(major), px(mid), px(minor), px(micro),
			majorA.toFixed(3), midA.toFixed(3), minorA.toFixed(3), microA.toFixed(3)
		].join('|');

		if (state === last) return;
		last = state;

		parts.lanes.style.setProperty('--mt-grid-major', px(major));
		parts.lanes.style.setProperty('--mt-grid-mid', px(mid));
		parts.lanes.style.setProperty('--mt-grid-minor', px(minor));
		parts.lanes.style.setProperty('--mt-grid-micro', px(micro));
		parts.lanes.style.setProperty('--mt-grid-major-a', majorA.toFixed(3));
		parts.lanes.style.setProperty('--mt-grid-mid-a', midA.toFixed(3));
		parts.lanes.style.setProperty('--mt-grid-minor-a', minorA.toFixed(3));
		parts.lanes.style.setProperty('--mt-grid-micro-a', microA.toFixed(3));
		parts.lanes.setAttribute('data-grid-pps', pxPerSecond.toFixed(2));
	}

	function scheduleGrid () {
		if (raf) return;
		raf = w.requestAnimationFrame(updateGrid);
	}

	function attachObservers () {
		var parts = findParts();
		if (!parts) return;

		if (!resizeObserver && w.ResizeObserver) {
			resizeObserver = new ResizeObserver(scheduleGrid);
			resizeObserver.observe(parts.lanes);
			resizeObserver.observe(parts.main);
		}

		if (!mutationObserver) {
			mutationObserver = new MutationObserver(scheduleGrid);
			mutationObserver.observe(parts.lanes, {
				attributes:true,
				attributeFilter:['style', 'class'],
				childList:false,
				subtree:false
			});
		}
	}

	function boot () {
		var app = w.PKAudioEditor;
		if (!app || !app.listenFor) {
			w.setTimeout(boot, 80);
			return;
		}

		app.listenFor('DidZoom', function () {
			attachObservers();
			scheduleGrid();
		});
		app.listenFor('DidUpdateMultitrack', function () {
			attachObservers();
			scheduleGrid();
		});
		app.listenFor('RequestResize', function () {
			attachObservers();
			scheduleGrid();
		});

		w.addEventListener('resize', function () {
			last = '';
			attachObservers();
			scheduleGrid();
		}, false);

		w.setInterval(function () {
			attachObservers();
			scheduleGrid();
		}, 650);
	}

	boot();
})(window, document);
