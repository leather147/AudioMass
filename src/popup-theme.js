(function (w, d) {
	'use strict';

	var STORAGE_KEY = 'audiomass.preferences.v1';
	var host = null;

	function resolveHost () {
		try {
			if (w.parent && w.parent !== w && w.parent.AMThemeRegistry) return w.parent;
		} catch (error) {}
		try {
			if (w.opener && !w.opener.closed && w.opener.AMThemeRegistry) return w.opener;
		} catch (error) {}
		return null;
	}

	function selectedTheme () {
		try {
			var stored = w.localStorage && w.localStorage.getItem(STORAGE_KEY);
			var preferences = stored ? JSON.parse(stored) : null;
			return preferences && preferences.theme;
		} catch (error) {
			return null;
		}
	}

	function registry () {
		return (host && host.AMThemeRegistry) || w.AMThemeRegistry;
	}

	function currentId () {
		try {
			if (host && host.AMTheme) return host.AMTheme.get().id;
		} catch (error) {}
		var active = selectedTheme();
		var source = registry();
		return active || (source && source.defaultId) || 'replicate';
	}

	function apply (detail) {
		var source = registry();
		if (!source) return null;
		var id = detail && detail.id || currentId();
		var theme = detail && detail.theme || source.get(id);
		var values = detail && detail.tokens || source.tokens(theme.id);
		var root = d.documentElement;
		for (var key in values) {
			if (Object.prototype.hasOwnProperty.call(values, key)) root.style.setProperty('--' + key, values[key]);
		}
		root.setAttribute('data-theme', theme.id);
		root.setAttribute('data-theme-mode', theme.mode);
		root.style.colorScheme = theme.mode;
		if (d.createEvent) {
			var event = d.createEvent('CustomEvent');
			event.initCustomEvent('am:popupthemechange', false, false, {id:theme.id, theme:theme, tokens:values});
			w.dispatchEvent(event);
		}
		return theme;
	}

	function color (name, fallback) {
		var value = w.getComputedStyle(d.documentElement).getPropertyValue('--' + name).trim();
		return value || fallback || '';
	}

	host = resolveHost();
	if (host && host.addEventListener) {
		try {
			host.addEventListener('am:themechange', function (event) {
				apply(event && event.detail);
			});
		} catch (error) {}
	}
	w.addEventListener('storage', function (event) {
		if (event.key === STORAGE_KEY) apply();
	});

	w.AMPopupTheme = {apply:apply, color:color};
	apply();
})(window, document);
