import type { EditorLocale } from '@/lib/editor-preferences';

const EDITOR_COPY = {
  en: {
    cancel: 'Cancel',
    close: 'Close',
    colorTheme: 'Color theme',
    dock: 'DOCK',
    dragPanel: 'Drag panel',
    editorDescription: 'Browser-first multitrack audio editor and waveform workstation.',
    editorTitle: 'Editor',
    frequencyAnalyser: 'FREQUENCY ANALYSER',
    language: 'Language',
    loadingEditor: 'Loading audio editor…',
    multitrackMixer: 'Multitrack mixer',
    openMultitrack: 'OPEN MULTITRACK',
    preferencesDescription: 'Changes are applied to the production editor workspace.',
    return: 'RETURN',
    save: 'Save',
    settingsTitle: 'Editor settings',
    spectralAnalyser: 'SPECTRAL ANALYSER',
    window: 'WINDOW',
  },
  ru: {
    cancel: 'Отмена',
    close: 'Закрыть',
    colorTheme: 'Цветовая тема',
    dock: 'ОКНО',
    dragPanel: 'Перетащить панель',
    editorDescription: 'Мультитрековый аудиоредактор и рабочая станция для звуковой волны.',
    editorTitle: 'Редактор',
    frequencyAnalyser: 'ЧАСТОТНЫЙ АНАЛИЗАТОР',
    language: 'Язык',
    loadingEditor: 'Загрузка аудиоредактора…',
    multitrackMixer: 'Мультитрековый микшер',
    openMultitrack: 'ОТКРОЙТЕ МУЛЬТИТРЕК',
    preferencesDescription: 'Параметры применяются к рабочей области production-редактора.',
    return: 'ВЕРНУТЬ',
    save: 'Сохранить',
    settingsTitle: 'Настройки редактора',
    spectralAnalyser: 'СПЕКТРАЛЬНЫЙ АНАЛИЗАТОР',
    window: 'ОКНО',
  },
} as const;

export type EditorCopyKey = keyof (typeof EDITOR_COPY)['en'];

export function editorCopy(locale: EditorLocale, key: EditorCopyKey) {
  return EDITOR_COPY[locale][key];
}
