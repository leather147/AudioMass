import { redirect } from 'next/navigation';

export default function MultitrackMixerPage() {
  redirect('/editor?panel=mixer');
}
