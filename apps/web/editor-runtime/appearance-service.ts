(() => {
  type SettingsTab = 'language' | 'themes';
  type ThemeMode = 'dark' | 'light';
  type Theme = {
    accent: string;
    background: string;
    id: string;
    mode: ThemeMode;
    name: string;
    surface2: string;
    text: string;
    textMuted: string;
  };
  type AppearanceService = { close(): void; open(tab?: SettingsTab): void };
  type AppearanceWindow = Window & {
    AMAppearance?: AppearanceService;
    AMI18n?: {
      getLocale(): string;
      setLocale(locale: string): boolean;
      t(value: string): string;
      translateTree(root: Node): void;
    };
    AMTheme: {
      get(): Theme;
      list(): Theme[];
      set(id: string): Theme;
    };
    PKAudioEditor?: { fireEvent?(name: string): void };
  };

  const runtimeWindow = window as unknown as AppearanceWindow;
  let overlay: HTMLDivElement | null = null;
  let activeTab: SettingsTab = 'themes';
  let returnFocus: HTMLElement | null = null;

  // LocaleService keeps the original DOM copy so switching back to English is lossless.
  function sourceCopy(value: string) {
    return value;
  }

  function make<Tag extends keyof HTMLElementTagNameMap>(tag: Tag, className = '', text?: string) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function setPressed(element: Element, active: boolean) {
    element.classList.toggle('is-active', active);
    element.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  function updateThemeSelection(id: string) {
    for (const card of Array.from(overlay?.querySelectorAll<HTMLElement>('.am_theme_card') ?? [])) {
      setPressed(card, card.dataset.themeId === id);
    }
  }

  function updateLanguageSelection(locale: string) {
    for (const card of Array.from(
      overlay?.querySelectorAll<HTMLElement>('.am_language_card') ?? [],
    )) {
      setPressed(card, card.dataset.locale === locale);
    }
  }

  function themeCard(theme: Theme, current: string) {
    const card = make('button', `am_theme_card${theme.id === current ? ' is-active' : ''}`);
    card.type = 'button';
    card.dataset.themeId = theme.id;
    card.setAttribute('aria-pressed', theme.id === current ? 'true' : 'false');

    const preview = make('span', 'am_theme_preview');
    const previewTokens = {
      '--preview-bg': theme.background,
      '--preview-surface': theme.surface2,
      '--preview-text': theme.text,
      '--preview-muted': theme.textMuted,
      '--preview-accent': theme.accent,
    };
    for (const [name, value] of Object.entries(previewTokens))
      preview.style.setProperty(name, value);
    preview.innerHTML = '<i></i><b></b><em></em><span></span>';

    const copy = make('span', 'am_theme_copy');
    copy.append(make('strong', '', theme.name));
    copy.append(
      make('small', '', sourceCopy(theme.mode === 'light' ? 'Light theme' : 'Dark theme')),
    );
    card.append(preview, copy, make('i', 'am_theme_check', '✓'));
    card.addEventListener('click', () => {
      runtimeWindow.AMTheme.set(theme.id);
      updateThemeSelection(theme.id);
      runtimeWindow.PKAudioEditor?.fireEvent?.('RequestResize');
    });
    return card;
  }

  function languageCard(locale: string, label: string, detail: string) {
    const current = runtimeWindow.AMI18n?.getLocale() ?? 'ru';
    const card = make('button', `am_language_card${current === locale ? ' is-active' : ''}`);
    card.type = 'button';
    card.dataset.locale = locale;
    card.setAttribute('aria-pressed', current === locale ? 'true' : 'false');
    const copy = make('span', 'am_language_copy');
    copy.append(make('strong', '', label), make('small', '', detail));
    card.append(copy, make('i', 'am_theme_check', '✓'));
    card.addEventListener('click', () => {
      if (runtimeWindow.AMI18n?.setLocale(locale)) updateLanguageSelection(locale);
    });
    return card;
  }

  function selectTab(name: SettingsTab) {
    activeTab = name;
    if (!overlay) return;
    for (const tab of Array.from(overlay.querySelectorAll<HTMLElement>('[data-settings-tab]'))) {
      const active = tab.dataset.settingsTab === name;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    }
    for (const panel of Array.from(
      overlay.querySelectorAll<HTMLElement>('[data-settings-panel]'),
    )) {
      panel.hidden = panel.dataset.settingsPanel !== name;
    }
  }

  function close() {
    if (!overlay) return;
    const closing = overlay;
    overlay = null;
    closing.classList.add('is-closing');
    document.body.classList.remove('am_preferences_open');
    runtimeWindow.setTimeout(() => closing.remove(), 140);
    returnFocus?.focus();
    returnFocus = null;
  }

  function keydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' && event.keyCode !== 27) return;
    event.preventDefault();
    close();
  }

  function settingsPanel(name: SettingsTab, title: string, hint: string) {
    const panel = make('div', 'am_settings_panel');
    panel.dataset.settingsPanel = name;
    panel.setAttribute('role', 'tabpanel');
    panel.append(
      make('h3', '', sourceCopy(title)),
      make('p', 'am_settings_hint', sourceCopy(hint)),
    );
    return panel;
  }

  function open(tab: SettingsTab = activeTab) {
    if (overlay) {
      selectTab(tab);
      return;
    }
    activeTab = tab;
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    overlay = make('div', 'am_preferences_overlay');
    overlay.setAttribute('role', 'presentation');

    const dialog = make('section', 'am_preferences');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'am_preferences_title');

    const header = make('header', 'am_preferences_header');
    const heading = make('div', 'am_preferences_heading');
    const title = make('h2', '', sourceCopy('Settings'));
    title.id = 'am_preferences_title';
    heading.append(
      title,
      make('p', '', sourceCopy('Personalize the editor without interrupting your work.')),
    );
    const closeButton = make('button', 'am_preferences_close', '×');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', sourceCopy('Close'));
    closeButton.addEventListener('click', close);
    header.append(heading, closeButton);

    const body = make('div', 'am_preferences_body');
    const navigation = make('nav', 'am_preferences_tabs');
    navigation.setAttribute('role', 'tablist');
    const tabs: Array<[SettingsTab, string]> = [
      ['themes', 'Color themes'],
      ['language', 'Language'],
    ];
    for (const [name, label] of tabs) {
      const button = make('button', '', sourceCopy(label));
      button.type = 'button';
      button.setAttribute('role', 'tab');
      button.dataset.settingsTab = name;
      button.addEventListener('click', () => selectTab(name));
      navigation.append(button);
    }

    const content = make('div', 'am_preferences_content');
    const themesPanel = settingsPanel(
      'themes',
      'Color themes',
      'Choose a palette. Changes are applied instantly and saved on this device.',
    );
    const themeGrid = make('div', 'am_theme_grid');
    const currentTheme = runtimeWindow.AMTheme.get().id;
    for (const theme of runtimeWindow.AMTheme.list())
      themeGrid.append(themeCard(theme, currentTheme));
    themesPanel.append(themeGrid);

    const languagePanel = settingsPanel(
      'language',
      'Language',
      'Language changes are applied instantly without reloading the editor.',
    );
    const languageGrid = make('div', 'am_language_grid');
    languageGrid.append(
      languageCard('ru', 'Русский', 'Russian'),
      languageCard('en', 'English', 'English'),
    );
    languagePanel.append(languageGrid);

    content.append(themesPanel, languagePanel);
    body.append(navigation, content);
    dialog.append(header, body);
    overlay.append(dialog);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });
    overlay.addEventListener('keydown', keydown);
    document.body.append(overlay);
    document.body.classList.add('am_preferences_open');
    runtimeWindow.AMI18n?.translateTree(overlay);
    selectTab(activeTab);
    runtimeWindow.requestAnimationFrame(() => {
      if (!overlay) return;
      overlay.classList.add('is-visible');
      closeButton.focus();
    });
  }

  runtimeWindow.addEventListener('am:themechange', (event) => {
    const detail = (event as CustomEvent<{ id?: string }>).detail;
    if (detail?.id) updateThemeSelection(detail.id);
  });
  runtimeWindow.addEventListener('am:localechange', (event) => {
    const detail = (event as CustomEvent<{ locale?: string }>).detail;
    if (detail?.locale) updateLanguageSelection(detail.locale);
  });
  runtimeWindow.AMAppearance = { open, close };
})();
