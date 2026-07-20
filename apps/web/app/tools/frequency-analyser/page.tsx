import { AnalyserTool } from '@/components/tools/editor-tools';
import { editorCopy } from '@/lib/editor-copy';
import { readEditorPreferences } from '@/lib/editor-preference-cookies';

export async function generateMetadata() {
  const { locale } = await readEditorPreferences();
  return { title: editorCopy(locale, 'frequencyAnalyser') };
}

export default async function FrequencyAnalyserPage() {
  const { locale } = await readEditorPreferences();
  return <AnalyserTool initialLocale={locale} kind="frequency" />;
}
