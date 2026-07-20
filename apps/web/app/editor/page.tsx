import { cookies } from 'next/headers';

import { LegacyEditor } from '@/components/editor/legacy-editor';
import { DEFAULT_EDITOR_PREFERENCES, parseEditorPreferences } from '@/lib/editor-preferences';

export const metadata = { title: 'Редактор' };

export default async function EditorPage() {
  const cookieStore = await cookies();
  const preferences = parseEditorPreferences({
    locale: cookieStore.get('am-locale')?.value ?? DEFAULT_EDITOR_PREFERENCES.locale,
    theme: cookieStore.get('am-theme')?.value ?? DEFAULT_EDITOR_PREFERENCES.theme,
  });

  return (
    <main className="editor-page">
      <LegacyEditor initialPreferences={preferences} />
    </main>
  );
}
