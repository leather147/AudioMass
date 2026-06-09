(function (w) {
	'use strict';

	/*
	 * AudioMass used a Chrome-only canvas timer renderer. With the Geist Mono
	 * theme that cache can clip/widen glyphs and show inconsistent zeros.
	 * Force the normal DOM timer path so CSS can control the typography.
	 */
	try {
		Object.defineProperty(w, 'chrome', {
			value:null,
			configurable:true,
			writable:true
		});
	} catch (error) {
		try { w.chrome = null; } catch (_) {}
	}
})(window);
