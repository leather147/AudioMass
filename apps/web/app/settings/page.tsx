import { cookies } from 'next/headers';
import Link from 'next/link';

import { saveEditorPreferences } from '@/app/settings/actions';
import {
  DEFAULT_EDITOR_PREFERENCES,
  EDITOR_LOCALES,
  EDITOR_THEMES,
  parseEditorPreferences,
} from '@/lib/editor-preferences';

export const metadata = { title: 'Настройки' };

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const preferences = parseEditorPreferences({
    locale: cookieStore.get('am-locale')?.value ?? DEFAULT_EDITOR_PREFERENCES.locale,
    theme: cookieStore.get('am-theme')?.value ?? DEFAULT_EDITOR_PREFERENCES.theme,
  });

  return (
    <main className="settings-page">
      <section className="settings-card">
        <h1>Настройки редактора</h1>
        <p>Параметры применяются к production-редактору при открытии рабочей области.</p>
        <form action={saveEditorPreferences} className="settings-form">
          <label>
            Язык
            <select defaultValue={preferences.locale} name="locale">
              {EDITOR_LOCALES.map((locale) => (
                <option key={locale.id} value={locale.id}>
                  {locale.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Цветовая тема
            <select defaultValue={preferences.theme} name="theme">
              {EDITOR_THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
          </label>
          <div className="settings-actions">
            <Link href="/editor">Отмена</Link>
            <button type="submit">Сохранить</button>
          </div>
        </form>
      </section>
    </main>
  );
}
