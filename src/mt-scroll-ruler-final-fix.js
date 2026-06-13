(function (w, d) {
	'use strict';

	function install(editor) {
		if (!editor || !editor.ui || editor.ui.__mtScrollRulerFinalFix) return;
		editor.ui.__mtScrollRulerFinalFix = true;

		var originalDraw = editor.ui.drawTimelineRuler;
		if (typeof originalDraw === 'function') {
			editor.ui.drawTimelineRuler = function (ctx, total, width, left, visible) {
				var info = extendTimeline(width, left, visible);
				if (total && width && info.visualWidth > width) {
					var visualTotal = total * (info.visualWidth / width);
					return originalDraw.call(editor.ui, ctx, visualTotal, info.visualWidth, left, visible);
				}
				return originalDraw.call(editor.ui, ctx, total, width, left, visible);
			};
		}

		function nodes() {
			var root = editor.el || d;
			return {
				main: root.querySelector('.pk_mt_main'),
				lanes: root.querySelector('.pk_mt_lanes'),
				ruler: root.querySelector('.pk_mt_ruler')
			};
		}

		function numericCss(value) {
			var n = parseFloat(value || 0);
			return isFinite(n) ? n : 0;
		}

		function clipContentWidth(n, fallback) {
			var clips = n.lanes ? n.lanes.querySelectorAll('.pk_mt_clip') : [];
			var end = 0;
			for (var i = 0; i < clips.length; ++i) {
				var clip = clips[i];
				var left = numericCss(clip.style.left);
				var width = numericCss(clip.style.width) || clip.offsetWidth || clip.clientWidth || 0;
				end = Math.max(end, left + width);
			}

			/* If no clip has been rendered yet, use the value passed by multitrack.js.
			   Never use lanes.style.width as the base here, because this script writes
			   that property itself and that caused unbounded growth on every sync. */
			return Math.max(800, fallback || 0, end + 180);
		}

		function targetWidths(baseWidth, left, visible) {
			var n = nodes();
			if (!n.main || !n.lanes || !n.ruler) {
				return {baseWidth: baseWidth || 1, visualWidth: baseWidth || 1};
			}

			var viewport = Math.max(1, visible || n.main.clientWidth || 1);
			var scrollLeft = Math.max(0, left === undefined ? n.main.scrollLeft : left);
			var base = clipContentWidth(n, baseWidth || viewport);

			/* Bounded empty room after the final clip. This is intentionally finite:
			   enough for comfortable scrolling/editing, but not an infinite canvas. */
			var extra = Math.min(1200, Math.max(420, viewport * 0.65));
			var visual = Math.ceil(Math.max(base + extra, scrollLeft + viewport + 80));
			var hardCap = Math.ceil(base + Math.max(extra, viewport));
			visual = Math.min(visual, hardCap);

			return {baseWidth: base, visualWidth: visual};
		}

		function extendTimeline(baseWidth, left, visible) {
			var n = nodes();
			var info = targetWidths(baseWidth, left, visible);
			if (!n.main || !n.lanes || !n.ruler) return info;

			if (Math.abs((numericCss(n.lanes.style.width)) - info.visualWidth) > 1) {
				n.lanes.style.width = info.visualWidth + 'px';
			}
			if (Math.abs((numericCss(n.ruler.style.width)) - info.visualWidth) > 1) {
				n.ruler.style.width = info.visualWidth + 'px';
			}

			n.main.classList.add('pk_mt_scroll_unified');
			return info;
		}

		function syncExisting() {
			var n = nodes();
			if (!n.main || !n.lanes || !n.ruler) return;
			var base = clipContentWidth(n, n.main.clientWidth || 800);
			extendTimeline(base, n.main.scrollLeft, n.main.clientWidth);
		}

		var raf = 0;
		function schedule() {
			if (raf) return;
			raf = w.requestAnimationFrame(function () {
				raf = 0;
				syncExisting();
			});
		}

		var observer = new MutationObserver(schedule);
		observer.observe(editor.el || d.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['class', 'style']
		});

		d.addEventListener('scroll', schedule, true);
		w.addEventListener('resize', schedule);
		schedule();
	}

	w.AMInstallMtScrollRulerFinalFix = install;
})(window, document);
