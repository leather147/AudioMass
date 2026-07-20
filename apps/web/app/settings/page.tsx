import Link from 'next/link';

import { saveEditorPreferences } from '@/app/settings/actions';
import { editorCopy } from '@/lib/editor-copy';
import { readEditorPreferences } from '@/lib/editor-preference-cookies';
import { EDITOR_LOCALES, EDITOR_THEMES } from '@/lib/editor-preferences';

export async function generateMetadata() {
  const { locale } = await readEditorPreferences();
  return { title: editorCopy(locale, 'settingsTitle') };
}

export default async function SettingsPage() {
  const preferences = await readEditorPreferences();
  const copy = (key: Parameters<typeof editorCopy>[1]) => editorCopy(preferences.locale, key);

  return (
    <main className="settings-page">
      <section className="settings-card">
        <h1>{copy('settingsTitle')}</h1>
        <p>{copy('preferencesDescription')}</p>
        <form action={saveEditorPreferences} className="settings-form">
          <label>
            {copy('language')}
            <select defaultValue={preferences.locale} name="locale">
              {EDITOR_LOCALES.map((locale) => (
                <option key={locale.id} value={locale.id}>
                  {locale.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {copy('colorTheme')}
            <select defaultValue={preferences.theme} name="theme">
              {EDITOR_THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
          </label>
          <div className="settings-actions">
            <Link href="/editor">{copy('cancel')}</Link>
            <button type="submit">{copy('save')}</button>
          </div>
        </form>
      </section>
    </main>
  );
}
