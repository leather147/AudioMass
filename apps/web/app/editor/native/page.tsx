import { EditorShell } from '@/features/editor/components/editor-shell';
import { readEditorPreferences } from '@/lib/editor-preference-cookies';

export const metadata = {
  description: 'Framework-native AudioMass editor migration preview',
  title: 'AudioMass native editor',
};

export default async function NativeEditorPage() {
  const preferences = await readEditorPreferences();
  return <EditorShell preferences={preferences} />;
}
