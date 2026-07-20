import { cookies } from 'next/headers';

import { EditorFrame } from '@/components/editor/editor-frame';
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
      <EditorFrame initialPreferences={preferences} />
    </main>
  );
}
