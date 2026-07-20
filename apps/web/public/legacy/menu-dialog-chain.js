(function (w, d) {
	'use strict';

	var pinned = null;
	var checkTimer = 0;

	function hasDialog () {
		return !!d.querySelector('.pk_modal,.pk_modal_back,.pk_modal_cnt');
	}

	function removePinned () {
		if (!pinned) return;
		var old = pinned;
		pinned = null;
		old.classList.add('pk_fade_out');
		w.setTimeout(function () {
			old.parentNode && old.parentNode.removeChild(old);
		}, 160);
	}

	function markChain (root, target) {
		var node = target;
		while (node && node !== root) {
			if (node.classList && node.classList.contains('pk_menu_el')) {
				node.classList.add('pk_chain_active');
				var opt = node.querySelector(':scope > button');
				if (opt) opt.classList.add('pk_act');
			}
			node = node.parentNode;
		}
	}

	function clearIds (root) {
		var els = root.querySelectorAll('[id]');
		for (var i = 0; i < els.length; ++i) els[i].removeAttribute('id');
	}

	function makePinned (clicked) {
		var hdr = d.querySelector('.pk_hdr');
		var top = clicked && clicked.closest && clicked.closest('.pk_hdr > .pk_btn');
		if (!hdr || !top) return null;

		var hr = hdr.getBoundingClientRect();
		var tr = top.getBoundingClientRect();
		var clone = hdr.cloneNode(true);
		clearIds(clone);
		clone.querySelectorAll('.pk_act').forEach(function (el) {
			if (!el.classList.contains('pk_opt')) el.classList.remove('pk_act');
		});
		clone.querySelectorAll('.pk_vis').forEach(function (el) { el.classList.remove('pk_vis'); });
		var buttons = clone.children;
		var index = Array.prototype.indexOf.call(hdr.children, top);
		if (buttons[index]) buttons[index].classList.add('pk_vis', 'pk_act');
		markChain(clone, clone.querySelectorAll('.pk_opt')[Array.prototype.indexOf.call(hdr.querySelectorAll('.pk_opt'), clicked)] || null);

		var pin = d.createElement('div');
		pin.className = 'pk_menu_chain_pin';
		pin.style.left = Math.round(tr.left) + 'px';
		pin.style.top = Math.round(hr.top) + 'px';
		pin.appendChild(clone);
		return pin;
	}

	function startWatcher () {
		w.clearInterval(checkTimer);
		checkTimer = w.setInterval(function () {
			if (!hasDialog()) {
				w.clearInterval(checkTimer);
				checkTimer = 0;
				removePinned();
			}
		}, 120);
	}

	function captureMenuClick (ev) {
		var opt = ev.target && ev.target.closest && ev.target.closest('.pk_hdr .pk_opt');
		if (!opt || opt.classList.contains('pk_inact')) return;

		var pin = makePinned(opt);
		if (!pin) return;

		w.setTimeout(function () {
			if (!hasDialog()) return;
			removePinned();
			pinned = pin;
			d.body.appendChild(pinned);
			startWatcher();
		}, 24);
	}

	function boot () {
		d.addEventListener('pointerdown', captureMenuClick, true);
		d.addEventListener('click', captureMenuClick, true);
		d.addEventListener('keydown', function (ev) {
			if (ev.key === 'Escape' && pinned) removePinned();
		}, true);
	}

	if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot, false);
	else boot();
})(window, document);
