import { redirect } from 'next/navigation';

import { parseEditorPanel } from '@/features/editor/components/workspace/editor-panels';

interface NativeEditorPageProps {
  searchParams: Promise<{ panel?: string }>;
}

export default async function NativeEditorPage({ searchParams }: NativeEditorPageProps) {
  const { panel } = await searchParams;
  const selectedPanel = parseEditorPanel(panel);
  redirect(selectedPanel === 'waveform' ? '/editor' : `/editor?panel=${selectedPanel}`);
}
