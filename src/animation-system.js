(function (w, d) {
	'use strict';

	var KEY = 'am_animation_settings_v1';
	var defaults = {
		enabled:true,
		preset:'smooth',
		speed:.82,
		distance:8,
		scroll:true,
		ui:true,
		surfaces:true,
		drag:true,
		numberFlow:true,
		ease:'cubic-bezier(.2,.8,.2,1)',
		pop:'cubic-bezier(.16,1,.3,1)'
	};

	var presets = {
		fast:{label:'Быстро', speed:.58, distance:5, ease:'cubic-bezier(.2,.8,.2,1)', pop:'cubic-bezier(.16,1,.3,1)'},
		smooth:{label:'Плавно', speed:.82, distance:8, ease:'cubic-bezier(.2,.8,.2,1)', pop:'cubic-bezier(.16,1,.3,1)'},
		cinema:{label:'Кинематографично', speed:1.26, distance:12, ease:'cubic-bezier(.22,1,.36,1)', pop:'cubic-bezier(.16,1,.3,1)'},
		minimal:{label:'Минимально', speed:.35, distance:3, ease:'linear', pop:'linear'}
	};

	function read () {
		try {
			var saved = JSON.parse(w.localStorage.getItem(KEY) || '{}');
			return Object.assign({}, defaults, saved || {});
		} catch (e) {
			return Object.assign({}, defaults);
		}
	}

	function write (settings) {
		try { w.localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) {}
	}

	var settings = read();
	var pop = null;
	var btn = null;

	function apply () {
		var root = d.documentElement;
		root.classList.toggle('pk_anim_on', !!settings.enabled);
		root.classList.toggle('pk_anim_off', !settings.enabled);
		root.classList.toggle('pk_anim_scroll', !!settings.scroll);
		root.classList.toggle('pk_anim_ui', !!settings.ui);
		root.classList.toggle('pk_anim_surfaces', !!settings.surfaces);
		root.classList.toggle('pk_anim_drag', !!settings.drag);
		root.classList.toggle('pk_nf_off', !settings.numberFlow);
		root.style.setProperty('--anim-speed', settings.speed);
		root.style.setProperty('--anim-distance', (settings.distance || 8) + 'px');
		root.style.setProperty('--anim-ease', settings.ease || defaults.ease);
		root.style.setProperty('--anim-ease-pop', settings.pop || defaults.pop);
		if (btn) btn.classList.toggle('pk_act', !!settings.enabled);
	}

	function saveApply () {
		write(settings);
		apply();
	}

	function sw (checked, onChange) {
		var label = d.createElement('label');
		label.className = 'pk_anim_switch';
		label.innerHTML = '<input type="checkbox"><i></i>';
		var input = label.firstChild;
		input.checked = !!checked;
		input.onchange = function () { onChange(!!input.checked); };
		return label;
	}

	function row (title, subtitle, control) {
		var r = d.createElement('div');
		r.className = 'pk_anim_row';
		var l = d.createElement('label');
		l.innerHTML = '<strong>' + title + '</strong>' + (subtitle ? '<span>' + subtitle + '</span>' : '');
		r.appendChild(l);
		r.appendChild(control);
		return r;
	}

	function selectPreset () {
		var s = d.createElement('select');
		Object.keys(presets).forEach(function (key) {
			var o = d.createElement('option');
			o.value = key;
			o.textContent = presets[key].label;
			s.appendChild(o);
		});
		s.value = settings.preset || 'smooth';
		s.onchange = function () {
			var p = presets[s.value] || presets.smooth;
			settings.preset = s.value;
			settings.speed = p.speed;
			settings.distance = p.distance;
			settings.ease = p.ease;
			settings.pop = p.pop;
			saveApply();
			closePopover();
			w.setTimeout(openPopover, 30);
		};
		return s;
	}

	function range (min, max, step, value, onInput) {
		var r = d.createElement('input');
		r.type = 'range';
		r.min = min;
		r.max = max;
		r.step = step;
		r.value = value;
		r.oninput = function () { onInput(+r.value); };
		return r;
	}

	function closePopover () {
		if (!pop) return;
		if (pop.parentNode) pop.parentNode.removeChild(pop);
		pop = null;
		d.removeEventListener('mousedown', outside, true);
		w.removeEventListener('resize', closePopover);
	}

	function outside (e) {
		if ((pop && pop.contains(e.target)) || (btn && btn.contains(e.target))) return;
		closePopover();
	}

	function place () {
		if (!pop || !btn) return;
		var r = btn.getBoundingClientRect();
		var wdt = 292;
		pop.style.left = Math.max(8, Math.min(w.innerWidth - wdt - 8, r.left + r.width / 2 - wdt / 2)) + 'px';
		pop.style.top = Math.min(w.innerHeight - 20, r.bottom + 8) + 'px';
	}

	function openPopover () {
		if (pop) return closePopover();
		pop = d.createElement('div');
		pop.className = 'pk_anim_popover';
		pop.innerHTML = '<h3>Анимации</h3>';

		pop.appendChild(row('Включить анимации', 'Отключает все transition и keyframes', sw(settings.enabled, function (v) {
			settings.enabled = v; saveApply();
		})));
		pop.appendChild(row('Пресет', 'Общий характер движения', selectPreset()));
		pop.appendChild(row('Скорость', 'Быстрее ← → медленнее', range(.25, 2, .05, settings.speed, function (v) {
			settings.speed = v; settings.preset = 'custom'; saveApply();
		})));
		pop.appendChild(row('Амплитуда', 'Дистанция появления окон', range(0, 20, 1, settings.distance, function (v) {
			settings.distance = v; settings.preset = 'custom'; saveApply();
		})));
		pop.appendChild(row('Плавный скролл', 'Прокрутка панелей и таймлайна', sw(settings.scroll, function (v) {
			settings.scroll = v; saveApply();
		})));
		pop.appendChild(row('Интерфейс', 'Hover, active, кнопки и поля', sw(settings.ui, function (v) {
			settings.ui = v; saveApply();
		})));
		pop.appendChild(row('Окна и меню', 'Диалоги, popover и панели', sw(settings.surfaces, function (v) {
			settings.surfaces = v; saveApply();
		})));
		pop.appendChild(row('Перетаскивание', 'Клипы, маркеры и перемещения', sw(settings.drag, function (v) {
			settings.drag = v; saveApply();
		})));
		pop.appendChild(row('Number Flow', 'Плавное перетекание цифр в динамическом тексте', sw(settings.numberFlow, function (v) {
			settings.numberFlow = v; saveApply();
		})));

		var actions = d.createElement('div');
		actions.className = 'pk_anim_actions';
		var reset = d.createElement('button');
		reset.textContent = 'Сбросить';
		reset.onclick = function () {
			settings = Object.assign({}, defaults);
			saveApply();
			closePopover();
			w.setTimeout(openPopover, 30);
		};
		var close = d.createElement('button');
		close.textContent = 'Готово';
		close.onclick = closePopover;
		actions.appendChild(reset);
		actions.appendChild(close);
		pop.appendChild(actions);

		d.body.appendChild(pop);
		place();
		w.setTimeout(function () { d.addEventListener('mousedown', outside, true); }, 0);
		w.addEventListener('resize', closePopover);
	}

	function attachButton () {
		if (btn && btn.parentNode) return true;
		var hdr = d.getElementsByClassName('pk_hdr')[0];
		if (!hdr) return false;
		btn = d.createElement('div');
		btn.className = 'pk_btn pk_anim_menu';
		btn.innerHTML = '<button type="button" tabindex="-1">Анимации</button>';
		btn.onclick = function (e) {
			e.preventDefault();
			e.stopPropagation();
			openPopover();
		};
		hdr.appendChild(btn);
		apply();
		return true;
	}

	function boot () {
		apply();
		if (!attachButton()) {
			var mo = new MutationObserver(function () {
				if (attachButton()) mo.disconnect();
			});
			mo.observe(d.documentElement, {childList:true, subtree:true});
		}
	}

	if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot, false);
	else boot();
})(window, document);
