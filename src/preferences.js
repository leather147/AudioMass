(function (w) {
	'use strict';

	var STORAGE_KEY = 'audiomass.preferences.v1';
	var cache = null;
	var listeners = [];

	function read () {
		if (cache) return cache;
		cache = {};
		try {
			var value = w.localStorage && w.localStorage.getItem(STORAGE_KEY);
			if (value) cache = JSON.parse(value) || {};
			if (!cache.locale && w.localStorage) {
				cache.locale = w.localStorage.getItem('lang') || undefined;
			}
		} catch (error) {
			cache = {};
		}
		return cache;
	}

	function write () {
		try {
			if (w.localStorage) w.localStorage.setItem(STORAGE_KEY, JSON.stringify(read()));
		} catch (error) {}
	}

	function notify (key, value, previous) {
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i](key, value, previous);
		}
	}

	w.AMPreferences = {
		get: function (key, fallback) {
			var value = read()[key];
			return value === undefined ? fallback : value;
		},
		set: function (key, value) {
			var values = read();
			var previous = values[key];
			if (previous === value) return value;
			values[key] = value;
			write();
			notify(key, value, previous);
			return value;
		},
		remove: function (key) {
			var values = read();
			var previous = values[key];
			if (previous === undefined) return;
			delete values[key];
			write();
			notify(key, undefined, previous);
		},
		onChange: function (callback) {
			if (typeof callback !== 'function') return function () {};
			listeners.push(callback);
			return function () {
				var index = listeners.indexOf(callback);
				if (index !== -1) listeners.splice(index, 1);
			};
		}
	};
})(window);
