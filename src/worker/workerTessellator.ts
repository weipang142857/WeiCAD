import type { Quality } from '../contracts/sceneModel';
import type { Tessellator, TessResult } from './occtTypes';

export function createWorkerTessellator(): Tessellator {
  const worker = new Worker(new URL('./occtWorker.ts', import.meta.url), { type: 'module' });
  let nextId = 1;
  const pending = new Map<number, { resolve: (r: TessResult) => void; reject: (e: Error) => void }>();

  worker.onmessage = (e: MessageEvent) => {
    const { id, ok, result, error } = e.data;
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    ok ? p.resolve(result) : p.reject(new Error(error));
  };

  const send = (kind: 'step' | 'brep', buffer: ArrayBuffer, quality: Quality): Promise<TessResult> =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      worker.postMessage({ id, kind, buffer, quality }, [buffer]);
    });

  return {
    step: (b, q) => send('step', b, q),
    brep: (b, q) => send('brep', b, q),
  };
}
