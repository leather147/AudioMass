/* =============================================================
   Composition waveform badge for the toolbar.
   Adds a compact FL Studio-like overview of the whole multitrack
   composition without touching the editor boot sequence.
   ============================================================= */
(function (w, d) {
	'use strict';

	var badge = null;
	var canvas = null;
	var ctx = null;
	var raf = 0;
	var lastSig = '';
	var lastCursor = -1;
	var lastReady = false;

	function qs(sel, root) {
		return (root || d).querySelector(sel);
	}

	function qsa(sel, root) {
		return Array.prototype.slice.call((root || d).querySelectorAll(sel));
	}

	function makeBadge() {
		if (badge && badge.parentNode) return badge;

		var toolbar = qs('.pk_tb');
		if (!toolbar) return null;

		badge = d.createElement('div');
		badge.className = 'pk_comp_wave_badge';
		badge.setAttribute('title', 'Composition waveform overview');
		badge.setAttribute('aria-label', 'Composition waveform overview');

		canvas = d.createElement('canvas');
		canvas.width = 180;
		canvas.height = 38;
		ctx = canvas.getContext('2d');

		var label = d.createElement('span');
		label.className = 'pk_comp_wave_label';
		label.textContent = 'waveform';

		var eye = d.createElement('span');
		eye.className = 'pk_comp_wave_eye';

		badge.appendChild(canvas);
		badge.appendChild(label);
		badge.appendChild(eye);

		var selection = qs('.pk_selection', toolbar);
		var ctns = qs('.pk_ctns', toolbar);
		if (selection) toolbar.insertBefore(badge, selection);
		else if (ctns && ctns.nextSibling) toolbar.insertBefore(badge, ctns.nextSibling);
		else toolbar.appendChild(badge);

		badge.addEventListener('click', function () {
			var app = w.PKAudioEditor;
			if (app && app.multitrack && app.multitrack.IsOn && app.multitrack.IsOn()) {
				app.fireEvent && app.fireEvent('RequestViewCenterToCursor');
			}
		}, false);

		return badge;
	}

	function resizeCanvas() {
		if (!badge || !canvas) return false;
		var rect = badge.getBoundingClientRect();
		var ratio = Math.min(2, w.devicePixelRatio || 1);
		var width = Math.max(80, Math.round(rect.width * ratio));
		var height = Math.max(24, Math.round(rect.height * ratio));
		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
			return true;
		}
		return false;
	}

	function drawEmpty(width, height) {
		ctx.clearRect(0, 0, width, height);
		var g = ctx.createLinearGradient(0, 0, width, height);
		g.addColorStop(0, 'rgba(12,18,20,.92)');
		g.addColorStop(1, 'rgba(6,8,10,.96)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, width, height);

		ctx.strokeStyle = 'rgba(255,255,255,.055)';
		ctx.lineWidth = Math.max(1, (w.devicePixelRatio || 1));
		for (var x = 8; x < width; x += 16) {
			ctx.beginPath();
			ctx.moveTo(x + .5, 4);
			ctx.lineTo(x + .5, height - 4);
			ctx.stroke();
		}

		ctx.fillStyle = 'rgba(150,165,170,.25)';
		ctx.font = Math.round(height * .22) + 'px monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('overview', width * .43, height * .5);
	}

	function drawRightMeter(width, height) {
		var meterX = Math.round(width * .75);
		var pad = Math.max(3, Math.round(height * .14));
		var meterW = width - meterX - pad;
		var meterH = height - pad * 2;
		if (meterW < 12) return;

		var g = ctx.createLinearGradient(meterX, pad, width - pad, height - pad);
		g.addColorStop(0, 'rgba(224,236,196,.28)');
		g.addColorStop(.52, 'rgba(246,218,130,.55)');
		g.addColorStop(1, 'rgba(242,135,106,.38)');
		ctx.fillStyle = g;
		ctx.fillRect(meterX, pad, meterW, meterH);

		ctx.fillStyle = 'rgba(5,8,10,.42)';
		for (var i = 1; i < 5; ++i) {
			var y = pad + Math.round(i * meterH / 5);
			ctx.fillRect(meterX, y, meterW, Math.max(1, Math.round(height * .035)));
		}

		ctx.strokeStyle = 'rgba(255,255,255,.12)';
		ctx.strokeRect(meterX + .5, pad + .5, meterW - 1, meterH - 1);
	}

	function clipSignature(clips, lanes, lanesWidth, cursor) {
		var sig = [clips.length, lanes.length, lanesWidth, Math.round(cursor * 20)].join(':');
		for (var i = 0; i < clips.length; ++i) {
			var c = clips[i];
			sig += '|' + c.offsetLeft + ',' + c.offsetWidth + ',' + c.offsetTop + ',' + c.offsetHeight + ',' + c.className;
		}
		return sig;
	}

	function currentCursorPx(lanesWidth) {
		var app = w.PKAudioEditor;
		var mt = app && app.multitrack;
		if (!mt || !mt.IsOn || !mt.IsOn() || !mt.GetDuration || !mt.GetCursor) return -1;
		var dur = mt.GetDuration() || 0;
		if (!(dur > 0)) return -1;
		return (mt.GetCursor() / dur) * lanesWidth;
	}

	function drawFromMultitrack(width, height) {
		var lanes = qs('.pk_mt_lanes');
		var main = qs('.pk_mt_main');
		if (!lanes || !main) return false;

		var clips = qsa('.pk_mt_clip', lanes);
		var lanesWidth = lanes.scrollWidth || lanes.offsetWidth || 0;
		if (!clips.length || !lanesWidth) return false;

		var cursorPx = currentCursorPx(lanesWidth);
		var sig = clipSignature(clips, qsa('.pk_mt_lane', lanes), lanesWidth, cursorPx);
		if (sig === lastSig && lastReady && Math.abs(cursorPx - lastCursor) < 1) return true;
		lastSig = sig;
		lastCursor = cursorPx;
		lastReady = true;

		drawEmpty(width, height);

		var waveRight = Math.max(10, Math.round(width * .74));
		var mid = Math.round(height * .52);
		var ampMax = Math.max(6, Math.round(height * .33));

		// Thin FL-like middle lane.
		ctx.fillStyle = 'rgba(255,255,255,.05)';
		ctx.fillRect(5, mid - 1, waveRight - 12, 2);

		for (var i = 0; i < clips.length; ++i) {
			var el = clips[i];
			var cnv = qs('canvas', el);
			var sx = Math.max(4, Math.round((el.offsetLeft / lanesWidth) * (waveRight - 10)) + 4);
			var sw = Math.max(2, Math.round((el.offsetWidth / lanesWidth) * (waveRight - 10)));
			var color = getComputedStyle(el).getPropertyValue('--mt-br').trim() || '#56dbe3';

			ctx.save();
			ctx.beginPath();
			ctx.rect(4, 4, waveRight - 8, height - 8);
			ctx.clip();

			// Draw the real clip canvas if available; otherwise draw a tiny pulse.
			ctx.globalAlpha = el.classList.contains('pk_mt_clip_muted') ? .22 : .82;
			if (cnv && cnv.width && cnv.height) {
				ctx.drawImage(cnv, sx, mid - ampMax, sw, ampMax * 2);
			} else {
				ctx.strokeStyle = color;
				ctx.beginPath();
				for (var x = 0; x < sw; ++x) {
					var a = Math.sin((x + i * 17) * .42) * Math.sin((x + 5) * .09);
					var y0 = mid - Math.abs(a) * ampMax;
					var y1 = mid + Math.abs(a) * ampMax;
					ctx.moveTo(sx + x + .5, y0);
					ctx.lineTo(sx + x + .5, y1);
				}
				ctx.stroke();
			}
			ctx.globalAlpha = .75;
			ctx.strokeStyle = color;
			ctx.strokeRect(sx + .5, mid - ampMax + .5, Math.max(1, sw - 1), ampMax * 2 - 1);
			ctx.restore();
		}

		if (cursorPx >= 0) {
			var cx = Math.round((cursorPx / lanesWidth) * (waveRight - 10)) + 4;
			ctx.strokeStyle = 'rgba(94,242,255,.95)';
			ctx.shadowColor = 'rgba(94,242,255,.45)';
			ctx.shadowBlur = Math.max(2, height * .08);
			ctx.beginPath();
			ctx.moveTo(cx + .5, 4);
			ctx.lineTo(cx + .5, height - 5);
			ctx.stroke();
			ctx.shadowBlur = 0;
		}

		drawRightMeter(width, height);
		return true;
	}

	function drawFromEditor(width, height) {
		var app = w.PKAudioEditor;
		var wv = app && app.engine && app.engine.wavesurfer;
		var buffer = wv && wv.backend && wv.backend.buffer;
		if (!buffer || !buffer.length || !buffer.getChannelData) return false;

		drawEmpty(width, height);
		var waveRight = Math.max(10, Math.round(width * .74));
		var data = buffer.getChannelData(0);
		var mid = Math.round(height * .52);
		var ampMax = Math.max(6, Math.round(height * .34));
		var usable = waveRight - 12;
		ctx.strokeStyle = 'rgba(148,226,220,.86)';
		ctx.beginPath();
		for (var x = 0; x < usable; ++x) {
			var from = Math.floor(x * data.length / usable);
			var to = Math.max(from + 1, Math.floor((x + 1) * data.length / usable));
			var mn = 0, mx = 0;
			var step = Math.max(1, Math.floor((to - from) / 24));
			for (var i = from; i < to; i += step) {
				var v = data[i];
				if (v < mn) mn = v;
				if (v > mx) mx = v;
			}
			ctx.moveTo(6 + x + .5, mid + mn * ampMax);
			ctx.lineTo(6 + x + .5, mid + mx * ampMax);
		}
		ctx.stroke();

		var cursor = wv.getCurrentTime ? wv.getCurrentTime() : 0;
		var dur = wv.getDuration ? wv.getDuration() : 0;
		if (dur > 0) {
			var cx = 6 + Math.round((cursor / dur) * usable);
			ctx.strokeStyle = 'rgba(94,242,255,.95)';
			ctx.beginPath();
			ctx.moveTo(cx + .5, 4);
			ctx.lineTo(cx + .5, height - 5);
			ctx.stroke();
		}

		drawRightMeter(width, height);
		return true;
	}

	function draw() {
		raf = 0;
		if (!makeBadge() || !ctx) {
			schedule();
			return;
		}
		resizeCanvas();
		var width = canvas.width;
		var height = canvas.height;
		if (!drawFromMultitrack(width, height) && !drawFromEditor(width, height)) {
			lastReady = false;
			drawEmpty(width, height);
			drawRightMeter(width, height);
		}
		schedule();
	}

	function schedule() {
		if (raf) return;
		raf = w.requestAnimationFrame(draw);
	}

	function boot() {
		makeBadge();
		schedule();
	}

	if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot, {once:true});
	else boot();
})(window, document);
