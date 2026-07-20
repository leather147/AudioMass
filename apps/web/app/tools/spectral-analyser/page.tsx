import { AnalyserTool } from '@/components/tools/editor-tools';

export const metadata = { title: 'Spectral analyser' };

export default function SpectralAnalyserPage() {
  return <AnalyserTool kind="spectral" />;
}
