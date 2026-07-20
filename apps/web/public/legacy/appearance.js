(function (w, d) {
	'use strict';

	var overlay = null;
	var activeTab = 'themes';
	var returnFocus = null;

	function t (value) {
		return w.AMI18n ? w.AMI18n.t(value) : value;
	}

	function make (tag, className, text) {
		var el = d.createElement(tag);
		if (className) el.className = className;
		if (text !== undefined) el.textContent = text;
		return el;
	}

	function themeCard (theme, current) {
		var card = make('button', 'am_theme_card' + (theme.id === current ? ' is-active' : ''));
		card.type = 'button';
		card.setAttribute('data-theme-id', theme.id);
		card.setAttribute('aria-pressed', theme.id === current ? 'true' : 'false');

		var preview = make('span', 'am_theme_preview');
		preview.style.setProperty('--preview-bg', theme.background);
		preview.style.setProperty('--preview-surface', theme.surface2);
		preview.style.setProperty('--preview-text', theme.text);
		preview.style.setProperty('--preview-muted', theme.textMuted);
		preview.style.setProperty('--preview-accent', theme.accent);
		preview.innerHTML = '<i></i><b></b><em></em><span></span>';

		var copy = make('span', 'am_theme_copy');
		copy.appendChild(make('strong', '', theme.name));
		copy.appendChild(make('small', '', t(theme.mode === 'light' ? 'Light theme' : 'Dark theme')));
		card.appendChild(preview);
		card.appendChild(copy);
		card.appendChild(make('i', 'am_theme_check', '✓'));
		card.onclick = function () {
			w.AMTheme.set(theme.id);
			updateThemeSelection(theme.id);
			if (w.PKAudioEditor && w.PKAudioEditor.fireEvent) w.PKAudioEditor.fireEvent('RequestResize');
		};
		return card;
	}

	function updateThemeSelection (id) {
		if (!overlay) return;
		var cards = overlay.querySelectorAll('.am_theme_card');
		for (var i = 0; i < cards.length; ++i) {
			var active = cards[i].getAttribute('data-theme-id') === id;
			cards[i].classList.toggle('is-active', active);
			cards[i].setAttribute('aria-pressed', active ? 'true' : 'false');
		}
	}

	function languageCard (locale, label, detail) {
		var current = w.AMI18n ? w.AMI18n.getLocale() : 'ru';
		var card = make('button', 'am_language_card' + (current === locale ? ' is-active' : ''));
		card.type = 'button';
		card.setAttribute('aria-pressed', current === locale ? 'true' : 'false');
		var copy = make('span', 'am_language_copy');
		copy.appendChild(make('strong', '', label));
		copy.appendChild(make('small', '', detail));
		card.appendChild(copy);
		card.appendChild(make('i', 'am_theme_check', '✓'));
		card.onclick = function () {
			if (w.AMI18n) w.AMI18n.setLocale(locale);
		};
		return card;
	}

	function selectTab (name) {
		activeTab = name;
		if (!overlay) return;
		var tabs = overlay.querySelectorAll('[data-settings-tab]');
		var panels = overlay.querySelectorAll('[data-settings-panel]');
		for (var i = 0; i < tabs.length; ++i) {
			var active = tabs[i].getAttribute('data-settings-tab') === name;
			tabs[i].classList.toggle('is-active', active);
			tabs[i].setAttribute('aria-selected', active ? 'true' : 'false');
			tabs[i].tabIndex = active ? 0 : -1;
		}
		for (i = 0; i < panels.length; ++i) {
			panels[i].hidden = panels[i].getAttribute('data-settings-panel') !== name;
		}
	}

	function close () {
		if (!overlay) return;
		var closing = overlay;
		overlay = null;
		closing.classList.add('is-closing');
		d.body.classList.remove('am_preferences_open');
		w.setTimeout(function () {
			if (closing.parentNode) closing.parentNode.removeChild(closing);
		}, 140);
		if (returnFocus && returnFocus.focus) returnFocus.focus();
		returnFocus = null;
	}

	function keydown (event) {
		if (event.key === 'Escape' || event.keyCode === 27) {
			event.preventDefault();
			close();
		}
	}

	function open (tab) {
		if (overlay) {
			selectTab(tab || activeTab);
			return;
		}
		activeTab = tab || 'themes';
		returnFocus = d.activeElement;
		overlay = make('div', 'am_preferences_overlay');
		overlay.setAttribute('role', 'presentation');

		var dialog = make('section', 'am_preferences');
		dialog.setAttribute('role', 'dialog');
		dialog.setAttribute('aria-modal', 'true');
		dialog.setAttribute('aria-labelledby', 'am_preferences_title');

		var header = make('header', 'am_preferences_header');
		var heading = make('div', 'am_preferences_heading');
		var title = make('h2', '', t('Settings'));
		title.id = 'am_preferences_title';
		heading.appendChild(title);
		heading.appendChild(make('p', '', t('Personalize the editor without interrupting your work.')));
		var closeButton = make('button', 'am_preferences_close', '×');
		closeButton.type = 'button';
		closeButton.setAttribute('aria-label', t('Close'));
		closeButton.onclick = close;
		header.appendChild(heading);
		header.appendChild(closeButton);

		var body = make('div', 'am_preferences_body');
		var nav = make('nav', 'am_preferences_tabs');
		nav.setAttribute('role', 'tablist');
		[['themes', 'Color themes'], ['language', 'Language']].forEach(function (item) {
			var button = make('button', '', t(item[1]));
			button.type = 'button';
			button.setAttribute('role', 'tab');
			button.setAttribute('data-settings-tab', item[0]);
			button.onclick = function () { selectTab(item[0]); };
			nav.appendChild(button);
		});

		var content = make('div', 'am_preferences_content');
		var themesPanel = make('div', 'am_settings_panel');
		themesPanel.setAttribute('data-settings-panel', 'themes');
		themesPanel.setAttribute('role', 'tabpanel');
		themesPanel.appendChild(make('h3', '', t('Color themes')));
		themesPanel.appendChild(make('p', 'am_settings_hint', t('Choose a palette. Changes are applied instantly and saved on this device.')));
		var grid = make('div', 'am_theme_grid');
		var themes = w.AMTheme.list();
		var current = w.AMTheme.get().id;
		for (var i = 0; i < themes.length; ++i) grid.appendChild(themeCard(themes[i], current));
		themesPanel.appendChild(grid);

		var languagePanel = make('div', 'am_settings_panel');
		languagePanel.setAttribute('data-settings-panel', 'language');
		languagePanel.setAttribute('role', 'tabpanel');
		languagePanel.appendChild(make('h3', '', t('Language')));
		languagePanel.appendChild(make('p', 'am_settings_hint', t('The editor reloads once when you change the interface language.')));
		var languages = make('div', 'am_language_grid');
		languages.appendChild(languageCard('ru', 'Русский', 'Russian'));
		languages.appendChild(languageCard('en', 'English', 'English'));
		languagePanel.appendChild(languages);

		content.appendChild(themesPanel);
		content.appendChild(languagePanel);
		body.appendChild(nav);
		body.appendChild(content);
		dialog.appendChild(header);
		dialog.appendChild(body);
		overlay.appendChild(dialog);
		overlay.onclick = function (event) { if (event.target === overlay) close(); };
		overlay.onkeydown = keydown;
		d.body.appendChild(overlay);
		d.body.classList.add('am_preferences_open');
		selectTab(activeTab);
		w.requestAnimationFrame(function () {
			if (!overlay) return;
			overlay.classList.add('is-visible');
			closeButton.focus();
		});
	}

	w.addEventListener('am:themechange', function (event) {
		if (event.detail) updateThemeSelection(event.detail.id);
	});

	w.AMAppearance = {open:open, close:close};
})(window, document);
