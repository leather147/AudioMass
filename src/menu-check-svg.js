(function (w, d) {
	'use strict';

	var CHECK_RE = /[\u2713\u2714\u2717✔✓]/g;
	var raf = 0;
	var SVG = '' +
		'<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">' +
			'<path d="M3.25 8.25L6.65 11.55L12.85 4.45"></path>' +
		'</svg>';

	function injectStyle () {
		if (d.getElementById ('pk-menu-svg-check-style')) return ;
		var st = d.createElement ('style');
		st.id = 'pk-menu-svg-check-style';
		st.textContent = [
			'.pk_hdr .pk_menu .pk_opt.pk_menu_has_check{',
				'display:flex!important;',
				'align-items:center!important;',
				'justify-content:space-between!important;',
				'gap:14px!important;',
				'white-space:nowrap!important;',
			'}',
			'.pk_hdr .pk_menu .pk_menu_check_svg{',
				'width:15px!important;',
				'height:15px!important;',
				'min-width:15px!important;',
				'margin-left:auto!important;',
				'display:inline-flex!important;',
				'align-items:center!important;',
				'justify-content:center!important;',
				'border-radius:999px!important;',
				'background:rgba(91,225,222,.12)!important;',
				'border:1px solid rgba(91,225,222,.38)!important;',
				'box-shadow:0 0 12px rgba(91,225,222,.18)!important;',
				'pointer-events:none!important;',
			'}',
			'.pk_hdr .pk_menu .pk_menu_check_svg svg{',
				'width:11px!important;',
				'height:11px!important;',
				'display:block!important;',
			'}',
			'.pk_hdr .pk_menu .pk_menu_check_svg path{',
				'fill:none!important;',
				'stroke:#5be1de!important;',
				'stroke-width:2.25!important;',
				'stroke-linecap:round!important;',
				'stroke-linejoin:round!important;',
			'}'
		].join ('');
		d.head.appendChild (st);
	}

	function stripTextCheckmarks (el) {
		var walker = d.createTreeWalker (el, NodeFilter.SHOW_TEXT, null);
		var nodes = [];
		var node;
		while ((node = walker.nextNode ())) {
			if (node.parentNode && node.parentNode.classList && node.parentNode.classList.contains ('pk_menu_check_svg')) continue ;
			nodes.push (node);
		}
		for (var i = 0; i < nodes.length; i++) {
			nodes[i].nodeValue = nodes[i].nodeValue.replace (CHECK_RE, '').replace (/\s+$/g, '');
		}
	}

	function replaceCheckmark (btn) {
		if (!btn || !btn.textContent) return ;
		CHECK_RE.lastIndex = 0;
		if (!CHECK_RE.test (btn.textContent)) return ;
		CHECK_RE.lastIndex = 0;
		stripTextCheckmarks (btn);
		if (!btn.querySelector ('.pk_menu_check_svg')) {
			var icon = d.createElement ('span');
			icon.className = 'pk_menu_check_svg';
			icon.innerHTML = SVG;
			btn.appendChild (icon);
		}
		btn.classList.add ('pk_menu_has_check');
	}

	function scan () {
		raf = 0;
		injectStyle ();
		var buttons = d.querySelectorAll ('.pk_hdr .pk_menu .pk_opt');
		for (var i = 0; i < buttons.length; i++) {
			replaceCheckmark (buttons[i]);
		}
	}

	function scheduleScan () {
		if (raf) return ;
		raf = w.requestAnimationFrame ? w.requestAnimationFrame (scan) : setTimeout (scan, 16);
	}

	function init () {
		scan ();
		if (!w.MutationObserver) return ;
		var obs = new MutationObserver (scheduleScan);
		obs.observe (d.body || d.documentElement, {
			childList: true,
			characterData: true,
			subtree: true
		});
	}

	if (d.readyState === 'loading') d.addEventListener ('DOMContentLoaded', init);
	else init ();
})(window, document);
