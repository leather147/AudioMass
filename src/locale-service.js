(function (w, d) {
	'use strict';

	var DEFAULT_LOCALE = 'ru';
	var dictionaries = {en:{}};
	var phrases = {en:[]};
	var hooks = {en:[]};
	var frame = 0;
	var started = false;

	function locale () {
		var value = w.AMPreferences ? w.AMPreferences.get('locale', DEFAULT_LOCALE) : DEFAULT_LOCALE;
		return dictionaries[value] ? value : DEFAULT_LOCALE;
	}

	function clean (value) {
		return String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
	}

	function translate (value) {
		if (value === null || value === undefined) return value;
		var lang = locale();
		if (lang === 'en') return String(value);
		var original = String(value);
		var exact = dictionaries[lang] && dictionaries[lang][clean(original)];
		if (exact) return exact;
		var result = original;
		var rules = phrases[lang] || [];
		for (var i = 0; i < rules.length; ++i) result = result.replace(rules[i][0], rules[i][1]);
		return result;
	}

	function skip (node) {
		var el = node && (node.nodeType === 1 ? node : node.parentNode);
		while (el && el !== d.body) {
			if (/^(SCRIPT|STYLE|CODE|PRE|CANVAS|SVG)$/.test(el.tagName || '')) return true;
			if (el.classList && el.classList.contains('notranslate')) return true;
			el = el.parentNode;
		}
		return false;
	}

	function translateElement (el) {
		if (!el || el.nodeType !== 1 || skip(el)) return;
		var attrs = ['title', 'aria-label', 'placeholder', 'alt', 'data-title'];
		for (var i = 0; i < attrs.length; ++i) {
			var value = el.getAttribute && el.getAttribute(attrs[i]);
			if (!value) continue;
			var next = translate(value);
			if (next !== value) el.setAttribute(attrs[i], next);
		}
		if ((el.tagName === 'INPUT' || el.tagName === 'BUTTON') && typeof el.value === 'string') {
			var nextValue = translate(el.value);
			if (nextValue !== el.value) el.value = nextValue;
		}
	}

	function translateText (node) {
		if (!node || node.nodeType !== 3 || skip(node)) return;
		var original = node.nodeValue;
		var key = clean(original);
		var next = translate(key);
		if (key && next !== key) node.nodeValue = original.replace(key, next);
	}

	function translateTree (root) {
		if (!root || locale() === 'en') return;
		if (root.nodeType === 3) return translateText(root);
		if (root.nodeType === 1) translateElement(root);
		var walker = d.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null, false);
		var node;
		while ((node = walker.nextNode())) {
			if (node.nodeType === 3) translateText(node);
			else translateElement(node);
		}
	}

	function applyHooks () {
		var list = hooks[locale()] || [];
		for (var i = 0; i < list.length; ++i) list[i]();
	}

	function apply () {
		d.documentElement.lang = locale();
		applyHooks();
		translateTree(d.body || d.documentElement);
	}

	function schedule () {
		if (frame || locale() === 'en') return;
		frame = w.requestAnimationFrame(function () {
			frame = 0;
			translateTree(d.body || d.documentElement);
		});
	}

	function start () {
		if (started) return;
		started = true;
		apply();
		new MutationObserver(schedule).observe(d.documentElement, {
			childList:true,
			subtree:true,
			characterData:true,
			attributes:true,
			attributeFilter:['title', 'aria-label', 'placeholder', 'alt', 'data-title']
		});
	}

	function setLocale (value) {
		if (!dictionaries[value]) return false;
		if (value === locale()) return true;
		if (w.AMPreferences) w.AMPreferences.set('locale', value);
		try { if (w.localStorage) w.localStorage.setItem('lang', value); } catch (error) {}
		w.location.reload();
		return true;
	}

	w.AMI18n = {
		register: function (lang, messages, options) {
			dictionaries[lang] = dictionaries[lang] || {};
			phrases[lang] = phrases[lang] || [];
			hooks[lang] = hooks[lang] || [];
			var key;
			for (key in messages) if (Object.prototype.hasOwnProperty.call(messages, key)) dictionaries[lang][key] = messages[key];
			if (options && options.attributes) {
				for (key in options.attributes) if (Object.prototype.hasOwnProperty.call(options.attributes, key)) dictionaries[lang][key] = options.attributes[key];
			}
			if (options && options.phrases) phrases[lang] = phrases[lang].concat(options.phrases);
			if (options && typeof options.onApply === 'function') hooks[lang].push(options.onApply);
		},
		getLocale:locale,
		setLocale:setLocale,
		t:translate,
		is:function (lang) { return locale() === lang; },
		translateTree:translateTree,
		localizeMenu:function localizeMenu (items) {
			if (!items || locale() === 'en') return items;
			for (var i = 0; i < items.length; ++i) {
				var item = items[i];
				if (!item) continue;
				if (item.name) {
					var key = clean(item.name.replace(/<[^>]*>/g, ''));
					var next = translate(key);
					if (next !== key) item.name = item.name.replace(key, next);
				}
				if (item.children) localizeMenu(item.children);
			}
			return items;
		},
		apply:apply
	};

	if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start, false);
	else start();
})(window, document);
