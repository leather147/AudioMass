import { EditorShell } from '@/features/editor/components/editor-shell';
import { parseEditorPanel } from '@/features/editor/components/workspace/editor-panels';
import { readEditorPreferences } from '@/lib/editor-preference-cookies';

export const metadata = {
  description: 'Framework-native AudioMass editor migration preview',
  title: 'AudioMass native editor',
};

interface NativeEditorPageProps {
  searchParams: Promise<{ panel?: string }>;
}

export default async function NativeEditorPage({ searchParams }: NativeEditorPageProps) {
  const { panel } = await searchParams;
  const preferences = await readEditorPreferences();
  return <EditorShell initialPanel={parseEditorPanel(panel)} preferences={preferences} />;
}
