import { redirect } from 'next/navigation';

export default function FrequencyAnalyserPage() {
  redirect('/editor?panel=frequency');
}
