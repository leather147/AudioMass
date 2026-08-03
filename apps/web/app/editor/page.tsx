import { EditorShell } from '@/features/editor/components/editor-shell';
import { ClassicEditorStyles } from '@/features/editor/components/chrome/classic-editor-styles';
import { parseEditorPanel } from '@/features/editor/components/workspace/editor-panels';
import { editorCopy } from '@/lib/editor-copy';
import { readEditorPreferences } from '@/lib/editor-preference-cookies';

export async function generateMetadata() {
  const { locale } = await readEditorPreferences();
  return {
    description: editorCopy(locale, 'editorDescription'),
    title: editorCopy(locale, 'editorTitle'),
  };
}

interface EditorPageProps {
  searchParams: Promise<{ panel?: string }>;
}

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const [preferences, { panel }] = await Promise.all([readEditorPreferences(), searchParams]);
  return (
    <>
      <ClassicEditorStyles />
      <EditorShell initialPanel={parseEditorPanel(panel)} preferences={preferences} />
    </>
  );
}
