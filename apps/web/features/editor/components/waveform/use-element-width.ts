'use client';

import { useEffect, useRef, useState } from 'react';

export function useElementWidth<T extends HTMLElement>() {
  const reference = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = reference.current;
    if (!element) return;
    const update = () => setWidth(Math.max(0, Math.round(element.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { reference, width } as const;
}
