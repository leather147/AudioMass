(function (w, d) {
	'use strict';

	function lang () {
		try { return (w.localStorage && w.localStorage.getItem('lang')) || 'ru'; }
		catch (e) { return 'ru'; }
	}

	function label () {
		return lang() === 'en' ? 'Add channel' : 'Добавить канал';
	}

	function attach () {
		var side = d.getElementsByClassName('pk_mt_side')[0];
		var wrap = d.getElementsByClassName('pk_mt_tracks_wrap')[0];
		if (!side || !wrap) return false;

		var existing = side.getElementsByClassName('pk_mt_add_bottom')[0];
		if (existing) {
			existing.querySelector('span').lastChild.nodeValue = label();
			return true;
		}

		var btn = d.createElement('button');
		btn.type = 'button';
		btn.tabIndex = -1;
		btn.className = 'pk_mt_add_bottom';
		btn.innerHTML = '<span><i>+</i>' + label() + '</span>';
		btn.setAttribute('aria-label', label());
		btn.title = label();
		btn.onclick = function (ev) {
			ev.preventDefault();
			ev.stopPropagation();
			var topAdd = d.querySelector('.pk_mt_head .pk_mt_add');
			if (topAdd) topAdd.click();
		};

		if (wrap.nextSibling) side.insertBefore(btn, wrap.nextSibling);
		else side.appendChild(btn);
		return true;
	}

	function boot () {
		if (attach()) return;
		var mo = new MutationObserver(function () { attach(); });
		mo.observe(d.documentElement, {childList:true, subtree:true});
	}

	if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot, false);
	else boot();
})(window, document);
