(function (w, d) {
	'use strict';

	var SELECTOR = [
		'.pk_timing',
		'.pk_total_dur',
		'.pk_hover_dur',
		'.pk_dat',
		'.pk_mt_tick',
		'.pk_mtbeat_bpm',
		'.pk_bpm',
		'.pk_val',
		'.pk_sloop_meta',
		'.pk_tmpMsg2',
		'.pk_prc span',
		'.pk_modal .pk_row',
		'.pk_modal label'
	].join(',');

	var NUMERIC_RE = /\d/;
	var MAX_LEN = 80;
	var raf = 0;
	var locked = false;
	var lastValues = w.WeakMap ? new WeakMap() : null;
	var lastAttr = w.WeakMap ? new WeakMap() : null;

	function clean (value) {
		return (value || '').replace(/\u00a0/g, ' ');
	}

	function hasNumber (value) {
		return value && value.length <= MAX_LEN && NUMERIC_RE.test(value);
	}

	function isTarget (el) {
		if (!el || el.nodeType !== 1) return false;
		if (!el.matches || !el.matches(SELECTOR)) return false;
		if (/^(INPUT|TEXTAREA|SELECT|CANVAS|SVG|SCRIPT|STYLE|CODE|PRE)$/.test(el.tagName || '')) return false;
		return true;
	}

	function dirFor (oldValue, nextValue) {
		var oldNums = (oldValue || '').match(/-?\d+(?:[.,]\d+)?/g);
		var newNums = (nextValue || '').match(/-?\d+(?:[.,]\d+)?/g);
		if (!oldNums || !newNums) return 1;
		var a = parseFloat(oldNums[oldNums.length - 1].replace(',', '.'));
		var b = parseFloat(newNums[newNums.length - 1].replace(',', '.'));
		if (a === a && b === b && b < a) return -1;
		return 1;
	}

	function charSpan (ch, oldCh, dir) {
		var span = d.createElement('span');
		var inner = d.createElement('span');
		var isDigit = /\d/.test(ch);
		span.className = 'pk_nf_char' + (isDigit ? ' pk_nf_digit' : '') + (ch === oldCh ? ' pk_nf_same' : '');
		span.style.setProperty('--nf-dir', dir);
		inner.className = isDigit ? 'pk_nf_digit_inner' : 'pk_nf_char_inner';
		inner.textContent = ch;
		span.appendChild(inner);
		return span;
	}

	function render (el, value, oldValue) {
		if (!hasNumber(value)) return false;
		var dir = dirFor(oldValue, value);
		var frag = d.createDocumentFragment();
		var old = oldValue || '';
		for (var i = 0; i < value.length; ++i) frag.appendChild(charSpan(value.charAt(i), old.charAt(i), dir));
		locked = true;
		el.classList.add('pk_nf', 'pk_nf_target');
		el.setAttribute('data-nf-value', value);
		el.textContent = '';
		el.appendChild(frag);
		locked = false;
		return true;
	}

	function enhanceElement (el) {
		if (!isTarget(el)) return;
		var value = clean(el.textContent);
		if (!hasNumber(value)) return;
		var old = lastValues ? lastValues.get(el) : el._pk_nf_value;
		if (value === old && el.classList.contains('pk_nf')) return;
		if (lastValues) lastValues.set(el, value);
		else el._pk_nf_value = value;
		render(el, value, old);
	}

	function enhanceKnob (el) {
		if (!el || !el.classList || !el.classList.contains('pk_mt_knob')) return;
		var value = el.getAttribute('data-val');
		if (!hasNumber(value || '')) return;
		var old = lastAttr ? lastAttr.get(el) : el._pk_nf_attr;
		if (old === value && el.classList.contains('pk_nf_knob')) return;
		if (lastAttr) lastAttr.set(el, value);
		else el._pk_nf_attr = value;

		var target = el.getElementsByClassName('pk_nf_attr')[0];
		if (!target) {
			target = d.createElement('span');
			target.className = 'pk_nf_attr pk_nf';
			el.appendChild(target);
		}
		el.classList.add('pk_nf_knob');
		render(target, value, old);
	}

	function scan (root) {
		if (locked) return;
		root = root || d;
		if (root.nodeType === 1) {
			enhanceElement(root);
			enhanceKnob(root);
		}
		var els = root.querySelectorAll ? root.querySelectorAll(SELECTOR + ',.pk_mt_knob[data-val]') : [];
		for (var i = 0; i < els.length; ++i) {
			enhanceElement(els[i]);
			enhanceKnob(els[i]);
		}
	}

	function schedule () {
		if (locked || raf) return;
		raf = w.requestAnimationFrame(function () {
			raf = 0;
			scan(d.body || d.documentElement);
		});
	}

	function defineComponent () {
		if (!w.customElements || w.customElements.get('number-flow')) return;
		try {
			w.customElements.define('number-flow', class NumberFlow extends HTMLElement {
				static get observedAttributes () { return ['value']; }
				connectedCallback () { this.update(); }
				attributeChangedCallback () { this.update(); }
				update () {
					var value = this.getAttribute('value');
					if (value === null) value = this.textContent;
					render(this, clean(value), this.getAttribute('data-nf-value') || '');
				}
			});
		} catch (e) {}
	}

	function boot () {
		defineComponent();
		scan(d.body || d.documentElement);
		new MutationObserver(function (mutations) {
			if (locked) return;
			for (var i = 0; i < mutations.length; ++i) {
				var m = mutations[i];
				if (m.type === 'attributes') {
					if (m.attributeName === 'data-val') enhanceKnob(m.target);
					else schedule();
					continue;
				}
				if (m.type === 'characterData' || (m.addedNodes && m.addedNodes.length)) {
					schedule();
					return;
				}
			}
		}).observe(d.documentElement, {
			childList:true,
			subtree:true,
			characterData:true,
			attributes:true,
			attributeFilter:['data-val', 'class']
		});
		['click', 'input', 'change', 'mouseup', 'keyup', 'wheel'].forEach(function (ev) {
			d.addEventListener(ev, schedule, true);
		});
		[60, 180, 420, 900, 1600].forEach(function (ms) { w.setTimeout(schedule, ms); });
	}

	if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot, false);
	else boot();
})(window, document);
