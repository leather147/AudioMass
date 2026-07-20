import Link from 'next/link';

export const metadata = {
  description: 'AudioMass is a browser-first audio and waveform editor.',
  title: 'About',
};

const FEATURES = [
  'Waveform editing, markers, tempo grid and beat snapping',
  'Recording, MP3 export and non-destructive undo history',
  'Compression, equalization, reverb, delay, repair and pitch tools',
  'Multitrack clips, crossfades, mixer controls and session files',
  'Frequency and spectral analysers that can be docked or opened separately',
  'Local browser processing with an installable offline cache',
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <article className="about-card">
        <p className="about-kicker">AudioMass</p>
        <h1>Browser-first audio editing without a desktop install</h1>
        <p className="about-lead">
          AudioMass records, edits, processes and mixes audio directly in the browser. Audio data
          stays on the device unless you explicitly use a connected server feature.
        </p>
        <h2>What is included</h2>
        <ul>
          {FEATURES.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <p>
          The application combines a modern Next.js shell and tool routes with the proven Web Audio
          editing runtime while that runtime is migrated module by module.
        </p>
        <div className="about-actions">
          <Link href="/editor">Open editor</Link>
          <a href="https://github.com/leather147/AudioMass" rel="noreferrer" target="_blank">
            Source code
          </a>
        </div>
      </article>
    </main>
  );
}
