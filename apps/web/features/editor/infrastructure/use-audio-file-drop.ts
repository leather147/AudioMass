'use client';

import { type DragEvent, useState } from 'react';

export function useAudioFileDrop(onFile: (file: File) => void | Promise<void>) {
  const [dragDepth, setDragDepth] = useState(0);

  const onDragEnter = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragDepth((value) => value + 1);
  };
  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragDepth((value) => Math.max(0, value - 1));
  };
  const onDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };
  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragDepth(0);
    const file = Array.from(event.dataTransfer.files).find((candidate) =>
      candidate.type.startsWith('audio/'),
    );
    if (file) void onFile(file);
  };

  return {
    active: dragDepth > 0,
    handlers: { onDragEnter, onDragLeave, onDragOver, onDrop },
  };
}
