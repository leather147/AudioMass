import { AnalyserTool } from '@/components/tools/editor-tools';

export const metadata = { title: 'Frequency analyser' };

export default function FrequencyAnalyserPage() {
  return <AnalyserTool kind="frequency" />;
}
