(function (w, d) {
	'use strict';

	var registry = w.AMThemeRegistry;
	var current = null;

	function selected () {
		return w.AMPreferences ? w.AMPreferences.get('theme', registry.defaultId) : registry.defaultId;
	}

	function apply (id, persist) {
		var theme = registry.get(id);
		var values = registry.tokens(theme.id);
		var root = d.documentElement;
		for (var key in values) {
			if (Object.prototype.hasOwnProperty.call(values, key)) root.style.setProperty('--' + key, values[key]);
		}
		root.setAttribute('data-theme', theme.id);
		root.setAttribute('data-theme-mode', theme.mode);
		root.style.colorScheme = theme.mode;
		current = theme.id;
		if (persist !== false && w.AMPreferences) w.AMPreferences.set('theme', theme.id);
		var meta = d.querySelector('meta[name="theme-color"]');
		if (!meta) {
			meta = d.createElement('meta');
			meta.name = 'theme-color';
			d.head.appendChild(meta);
		}
		meta.content = theme.background;
		if (d.createEvent) {
			var event = d.createEvent('CustomEvent');
			event.initCustomEvent('am:themechange', false, false, {id:theme.id, theme:theme, tokens:values});
			w.dispatchEvent(event);
		}
		return theme;
	}

	w.AMTheme = {
		get:function () { return registry.get(current || selected()); },
		list:registry.list,
		set:function (id) { return apply(id, true); },
		apply:function () { return apply(selected(), false); },
		color:function (name, fallback) {
			var value = w.getComputedStyle(d.documentElement).getPropertyValue('--' + name).trim();
			return value || fallback || '';
		}
	};

	apply(selected(), false);
})(window, document);
