import 'server-only';

import { cookies } from 'next/headers';
import { cache } from 'react';

import { DEFAULT_EDITOR_PREFERENCES, parseEditorPreferences } from '@/lib/editor-preferences';

export const readEditorPreferences = cache(async () => {
  const cookieStore = await cookies();
  return parseEditorPreferences({
    locale: cookieStore.get('am-locale')?.value ?? DEFAULT_EDITOR_PREFERENCES.locale,
    theme: cookieStore.get('am-theme')?.value ?? DEFAULT_EDITOR_PREFERENCES.theme,
  });
});
