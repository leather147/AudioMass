'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { parseEditorPreferences } from '@/lib/editor-preferences';

export async function saveEditorPreferences(formData: FormData) {
  const preferences = parseEditorPreferences({
    locale: formData.get('locale'),
    theme: formData.get('theme'),
  });
  const cookieStore = await cookies();
  const options = {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax' as const,
  };

  cookieStore.set('am-locale', preferences.locale, options);
  cookieStore.set('am-theme', preferences.theme, options);
  redirect('/editor');
}
