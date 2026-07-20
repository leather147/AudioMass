import { MixerTool } from '@/components/tools/editor-tools';
import { editorCopy } from '@/lib/editor-copy';
import { readEditorPreferences } from '@/lib/editor-preference-cookies';

export async function generateMetadata() {
  const { locale } = await readEditorPreferences();
  return { title: editorCopy(locale, 'multitrackMixer') };
}

export default async function MultitrackMixerPage() {
  const { locale } = await readEditorPreferences();
  return <MixerTool initialLocale={locale} />;
}
