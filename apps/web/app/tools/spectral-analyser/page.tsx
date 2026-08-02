import { redirect } from 'next/navigation';

export default function SpectralAnalyserPage() {
  redirect('/editor?panel=spectral');
}
