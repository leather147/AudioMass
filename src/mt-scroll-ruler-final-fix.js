(function (w, d) {
	'use strict';

	function install(editor) {
		if (!editor || !editor.ui || editor.ui.__mtScrollRulerFinalFix) return;
		editor.ui.__mtScrollRulerFinalFix = true;

		var originalDraw = editor.ui.drawTimelineRuler;
		if (typeof originalDraw === 'function') {
			editor.ui.drawTimelineRuler = function (ctx, total, width, left, visible) {
				var visualWidth = extendTimeline(width, total, left, visible);
				if (total && width && visualWidth > width) {
					var visualTotal = total * (visualWidth / width);
					return originalDraw.call(editor.ui, ctx, visualTotal, visualWidth, left, visible);
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

		function extendTimeline(baseWidth, total, left, visible) {
			var n = nodes();
			if (!n.main || !n.lanes || !n.ruler) return baseWidth || 1;

			var viewport = Math.max(1, visible || n.main.clientWidth || 1);
			var scrollLeft = Math.max(0, left === undefined ? n.main.scrollLeft : left);
			var base = Math.max(800, baseWidth || parseFloat(n.lanes.style.width) || n.lanes.scrollWidth || viewport);

			/* Add real editable/scrollable space after the last clip. This keeps the
			   ruler and grid continuing to the right instead of ending at the clip
			   boundary. Use actual element width, not a pseudo-element. */
			var extra = Math.max(900, viewport * 1.25);
			var visual = Math.ceil(Math.max(base + extra, scrollLeft + viewport + 160));

			if (Math.abs((parseFloat(n.lanes.style.width) || 0) - visual) > 1) {
				n.lanes.style.width = visual + 'px';
			}
			if (Math.abs((parseFloat(n.ruler.style.width) || 0) - visual) > 1) {
				n.ruler.style.width = visual + 'px';
			}

			n.main.classList.add('pk_mt_scroll_unified');
			return visual;
		}

		function syncExisting() {
			var n = nodes();
			if (!n.main || !n.lanes || !n.ruler) return;
			var base = Math.max(800, parseFloat(n.lanes.style.width) || n.lanes.scrollWidth || n.main.clientWidth || 1);
			extendTimeline(base, 0, n.main.scrollLeft, n.main.clientWidth);
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
		w.setInterval(schedule, 900);
		schedule();
	}

	w.AMInstallMtScrollRulerFinalFix = install;
})(window, document);
