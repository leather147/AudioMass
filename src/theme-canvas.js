(function (w, d) {
	'use strict';

	/*
	 * Canvas does not understand CSS custom properties.  This adapter keeps the
	 * old drawing code compatible while translating its finite legacy palette to
	 * the active semantic theme at paint time.  New renderers should call
	 * AMThemePaint.color()/alpha() directly.
	 */

	function color (name, fallback) {
		return w.AMTheme ? w.AMTheme.color(name, fallback) : fallback;
	}

	function alpha (value, opacity) {
		var hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value || '');
		if (hex) {
			var raw = hex[1];
			if (raw.length === 3) raw = raw.replace(/(.)/g, '$1$1');
			var number = parseInt(raw, 16);
			return 'rgba(' + ((number >> 16) & 255) + ',' + ((number >> 8) & 255) + ',' + (number & 255) + ',' + opacity + ')';
		}
		var rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(value || '');
		if (rgb) return 'rgba(' + rgb[1] + ',' + rgb[2] + ',' + rgb[3] + ',' + opacity + ')';
		return value;
	}

	function themedAlpha (name, opacity, fallback) {
		return alpha(color(name, fallback), opacity);
	}

	function normalise (value) {
		return String(value).toLowerCase().replace(/\s+/g, '');
	}

	function palette () {
		var values = Object.create(null);
		function add (legacy, themed) {
			for (var i = 0; i < legacy.length; ++i) values[normalise(legacy[i])] = themed;
		}

		add(['#000', '#000000', '#050607', '#040506', '#09090b', '#101008'], color('wave-bg', '#050607'));
		add(['#111', '#111111'], color('timeline-bg', '#080a0d'));
		add(['#fff', '#ffffff', '#f6f7f8'], color('foreground', '#f6f7f8'));
		add(['#aaa', '#aaaaaa', '#ccc', '#cccccc', '#99c2c6', '#95c6c6'], color('muted-foreground', '#b2bcc8'));
		add(['#686868', '#555', '#555555'], color('fg-2', '#7b8694'));
		add(['#43e4dc', '#5af2ff', '#56dbe3', '#5be1de'], color('ring', '#43e4dc'));
		add(['#d9d955', '#ffd15c', '#ffb35c'], color('warn', '#facc15'));
		add(['#ff0000', '#ff2222', '#ff3355', '#e13030', '#ad2b2b'], color('rec', '#ff4d5e'));
		add(['#365457', '#2f7b75', '#336e70', '#3d6c62', '#5d6543', '#665164', '#4d6277'], color('accent-strong', 'rgba(67,228,220,.42)'));
		add(['#071010', '#0b1013', '#0d100d', '#100f0b', '#100d10', '#0d0f13'], color('card', '#080a0d'));
		add(['#88c7c1'], color('marker-1', '#34d399'));
		add(['#7fb5b6'], color('marker-2', '#43e4dc'));
		add(['#83b0a4'], color('marker-3', '#b993ff'));
		add(['#9aa47e'], color('marker-4', '#facc15'));
		add(['#a48aa0'], color('marker-5', '#ff4d5e'));
		add(['#879db1'], color('marker-6', '#8ef1ec'));
		add(['#9dff6a'], color('marker-1', '#34d399'));
		add(['#f557d2'], color('marker-3', '#b993ff'));
		add(['#ff8c35'], color('marker-5', '#ff4d5e'));
		add(['#b9c6ff'], color('marker-6', '#8ef1ec'));

		return values;
	}

	var currentPalette = palette();

	function remapFunctionalColor (value) {
		var match = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(value);
		if (!match) return value;
		var r = +match[1], g = +match[2], b = +match[3];
		var opacity = match[4] === undefined ? 1 : +match[4];
		if (r < 40 && g < 40 && b < 40) return themedAlpha('background', opacity, '#050607');
		if (Math.max(r, g, b) - Math.min(r, g, b) < 18) return themedAlpha('foreground', opacity, '#f6f7f8');
		if (g > 175 && b > 170 && r < 175) return themedAlpha('ring', opacity, '#43e4dc');
		if (r > 180 && g > 135 && b < 155) return themedAlpha('warn', opacity, '#facc15');
		if (r > 175 && g < 145 && b < 150) return themedAlpha('rec', opacity, '#ff4d5e');
		return value;
	}

	function remap (value) {
		if (typeof value !== 'string') return value;
		var mapped = currentPalette[normalise(value)];
		return mapped || remapFunctionalColor(value);
	}

	function patchProperty (prototype, name) {
		var descriptor = Object.getOwnPropertyDescriptor(prototype, name);
		if (!descriptor || !descriptor.get || !descriptor.set || descriptor.set.__amThemePaint) return;
		var setter = function (value) { descriptor.set.call(this, remap(value)); };
		setter.__amThemePaint = true;
		Object.defineProperty(prototype, name, {
			configurable:descriptor.configurable,
			enumerable:descriptor.enumerable,
			get:descriptor.get,
			set:setter
		});
	}

	if (w.CanvasRenderingContext2D) {
		patchProperty(w.CanvasRenderingContext2D.prototype, 'fillStyle');
		patchProperty(w.CanvasRenderingContext2D.prototype, 'strokeStyle');
		patchProperty(w.CanvasRenderingContext2D.prototype, 'shadowColor');
	}

	if (w.CanvasGradient && w.CanvasGradient.prototype.addColorStop) {
		var addColorStop = w.CanvasGradient.prototype.addColorStop;
		if (!addColorStop.__amThemePaint) {
			var themedColorStop = function (offset, value) { return addColorStop.call(this, offset, remap(value)); };
			themedColorStop.__amThemePaint = true;
			w.CanvasGradient.prototype.addColorStop = themedColorStop;
		}
	}

	w.AMThemePaint = {
		color:color,
		alpha:function (name, opacity, fallback) { return themedAlpha(name, opacity, fallback); },
		remap:remap,
		refresh:function () { currentPalette = palette(); }
	};

	w.addEventListener('am:themechange', function () {
		currentPalette = palette();
	});
})(window, document);
