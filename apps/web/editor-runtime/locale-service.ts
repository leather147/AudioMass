(() => {
  type Dictionary = Record<string, string>;
  type LocalizedValueState = { applied: string; original: string };
  type PhraseRule = [RegExp, string];
  type MenuItem = { children?: MenuItem[]; name?: string };
  type LocaleOptions = {
    attributes?: Dictionary;
    onApply?: () => void;
    phrases?: PhraseRule[];
  };

  type LocaleService = {
    apply(): void;
    getLocale(): string;
    is(locale: string): boolean;
    localizeMenu(items: MenuItem[]): MenuItem[];
    register(locale: string, messages: Dictionary, options?: LocaleOptions): void;
    setLocale(locale: string): boolean;
    t(value: string): string;
    translateTree(root: Node): void;
  };

  type LocaleWindow = Window & {
    AMI18n?: LocaleService;
    AMPreferences?: {
      get<Value>(key: string, fallback: Value): Value;
      set<Value>(key: string, value: Value): Value;
    };
  };

  const DEFAULT_LOCALE = 'ru';
  const TRANSLATABLE_ATTRIBUTES = [
    'title',
    'aria-label',
    'placeholder',
    'alt',
    'data-title',
    'data-label',
    'content',
  ] as const;
  const runtimeWindow = window as LocaleWindow;
  const dictionaries: Record<string, Dictionary> = { en: {} };
  const phrases: Record<string, PhraseRule[]> = { en: [] };
  const hooks: Record<string, Array<() => void>> = { en: [] };
  const attributeStates = new WeakMap<Element, Map<string, LocalizedValueState>>();
  const menuNames = new WeakMap<MenuItem, LocalizedValueState>();
  const textStates = new WeakMap<Text, LocalizedValueState>();
  const valueStates = new WeakMap<HTMLInputElement | HTMLButtonElement, LocalizedValueState>();
  let frame = 0;
  let started = false;

  function locale() {
    const value = runtimeWindow.AMPreferences?.get('locale', DEFAULT_LOCALE) ?? DEFAULT_LOCALE;
    return dictionaries[value] ? value : DEFAULT_LOCALE;
  }

  function clean(value: unknown) {
    return String(value ?? '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function translate(value: string) {
    const language = locale();
    if (language === 'en') return value;
    const exact = dictionaries[language]?.[clean(value)];
    if (exact) return exact;
    let result = value;
    for (const [pattern, replacement] of phrases[language] ?? []) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }

  function shouldSkip(node: Node) {
    let element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    while (element && element !== document.body) {
      if (/^(SCRIPT|STYLE|CODE|PRE|CANVAS|SVG)$/.test(element.tagName)) return true;
      if (element.classList.contains('notranslate')) return true;
      element = element.parentElement;
    }
    return false;
  }

  function translateElement(element: Element) {
    if (shouldSkip(element)) return;
    let states = attributeStates.get(element);
    if (!states) {
      states = new Map();
      attributeStates.set(element, states);
    }
    for (const attribute of TRANSLATABLE_ATTRIBUTES) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      let state = states.get(attribute);
      if (!state || value !== state.applied) {
        state = { applied: value, original: value };
        states.set(attribute, state);
      }
      const translated = translate(state.original);
      state.applied = translated;
      if (translated !== value) element.setAttribute(attribute, translated);
    }
    if (
      (element instanceof HTMLInputElement || element instanceof HTMLButtonElement) &&
      element.value
    ) {
      let state = valueStates.get(element);
      if (!state || element.value !== state.applied) {
        state = { applied: element.value, original: element.value };
        valueStates.set(element, state);
      }
      const translated = translate(state.original);
      state.applied = translated;
      if (translated !== element.value) element.value = translated;
    }
  }

  function translateText(node: Text) {
    if (shouldSkip(node)) return;
    const current = node.nodeValue ?? '';
    let state = textStates.get(node);
    if (!state || current !== state.applied) {
      state = { applied: current, original: current };
      textStates.set(node, state);
    }
    const key = clean(state.original);
    const translated = translate(key);
    const output = key ? state.original.replace(key, translated) : state.original;
    state.applied = output;
    if (output !== current) node.nodeValue = output;
  }

  function translateTree(root: Node) {
    if (root.nodeType === Node.TEXT_NODE) {
      translateText(root as Text);
      return;
    }
    if (root.nodeType === Node.ELEMENT_NODE) translateElement(root as Element);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) translateText(node as Text);
      else translateElement(node as Element);
    }
  }

  function applyHooks() {
    for (const hook of hooks[locale()] ?? []) hook();
  }

  function apply() {
    document.documentElement.lang = locale();
    applyHooks();
    translateTree(document.documentElement);
  }

  function schedule() {
    if (frame) return;
    frame = runtimeWindow.requestAnimationFrame(() => {
      frame = 0;
      translateTree(document.documentElement);
    });
  }

  function start() {
    if (started) return;
    started = true;
    apply();
    new MutationObserver(schedule).observe(document.documentElement, {
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  function setLocale(value: string) {
    if (!dictionaries[value]) return false;
    if (value === locale()) return true;
    runtimeWindow.AMPreferences?.set('locale', value);
    runtimeWindow.dispatchEvent(new CustomEvent('am:localechange', { detail: { locale: value } }));
    apply();
    return true;
  }

  function localizeMenu(items: MenuItem[]): MenuItem[] {
    if (!items) return items;
    for (const item of items) {
      if (!item) continue;
      if (item.name) {
        let state = menuNames.get(item);
        if (!state || item.name !== state.applied) {
          state = { applied: item.name, original: item.name };
          menuNames.set(item, state);
        }
        const key = clean(state.original.replace(/<[^>]*>/g, ''));
        const translated = translate(key);
        item.name = state.original.replace(key, translated);
        state.applied = item.name;
      }
      if (item.children) localizeMenu(item.children);
    }
    return items;
  }

  runtimeWindow.AMI18n = {
    register(language, messages, options) {
      dictionaries[language] ??= {};
      phrases[language] ??= [];
      hooks[language] ??= [];
      Object.assign(dictionaries[language], messages, options?.attributes);
      if (options?.phrases) phrases[language].push(...options.phrases);
      if (options?.onApply) hooks[language].push(options.onApply);
    },
    getLocale: locale,
    setLocale,
    t: translate,
    is: (language) => locale() === language,
    translateTree,
    localizeMenu,
    apply,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
