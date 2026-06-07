import { useEffect, useRef } from 'react';
import { Viewer } from '../viewer/Viewer';

export function ViewportCanvas({ onReady }: { onReady: (v: Viewer) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const v = new Viewer(ref.current);
    viewer.current = v;
    onReady(v);
    return () => v.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={ref} style={{ position: 'absolute', inset: 0 }} />;
}
