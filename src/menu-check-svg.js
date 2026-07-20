(function (w, d) {
	'use strict';

	var SVG_NS = 'http://www.w3.org/2000/svg';

	function makeIndicator () {
		var indicator = d.createElement ('span');
		var svg = d.createElementNS (SVG_NS, 'svg');
		var path = d.createElementNS (SVG_NS, 'path');
		indicator.className = 'pk_menu_check_svg';
		indicator.setAttribute ('aria-hidden', 'true');
		svg.setAttribute ('viewBox', '0 0 16 16');
		svg.setAttribute ('focusable', 'false');
		path.setAttribute ('d', 'M3.25 8.25L6.65 11.55L12.85 4.45');
		svg.appendChild (path);
		indicator.appendChild (svg);
		return indicator;
	}

	function setChecked (button, checked) {
		if (!button) return ;
		button.classList.toggle ('pk_menu_checked', !!checked);
		button.setAttribute ('aria-checked', checked ? 'true' : 'false');
	}

	function prepare (button, label, checked) {
		if (!button) return ;
		button.textContent = '';
		button.classList.add ('pk_menu_checkable');
		button.setAttribute ('role', 'menuitemcheckbox');
		var text = d.createElement ('span');
		text.className = 'pk_menu_label';
		text.textContent = label || '';
		button.appendChild (text);
		button.appendChild (makeIndicator ());
		setChecked (button, checked);
	}

	w.AMMenuChecks = {
		prepare:prepare,
		set:setChecked
	};
})(window, document);
