import { EditorFrame } from '@/components/editor/editor-frame';
import { editorCopy } from '@/lib/editor-copy';
import { readEditorPreferences } from '@/lib/editor-preference-cookies';

export async function generateMetadata() {
  const { locale } = await readEditorPreferences();
  return { title: editorCopy(locale, 'editorTitle') };
}

export default async function EditorPage() {
  const preferences = await readEditorPreferences();

  return (
    <main className="editor-page">
      <EditorFrame initialPreferences={preferences} />
    </main>
  );
}
