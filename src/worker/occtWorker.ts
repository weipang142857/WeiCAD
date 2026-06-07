/// <reference lib="webworker" />
import wasmUrl from 'occt-import-js/dist/occt-import-js.wasm?url';
import { initBrowserOcct } from './occtBrowserRuntime';
import { normalizeOcctResult, qualityToParams, type RawOcctResult } from './occtTypes';
import type { Quality } from '../contracts/sceneModel';

interface Req { id: number; kind: 'step' | 'brep'; buffer: ArrayBuffer; quality: Quality; }

self.onmessage = async (e: MessageEvent<Req>) => {
  const { id, kind, buffer, quality } = e.data;
  try {
    const occt = await initBrowserOcct(() => wasmUrl);
    const fn = kind === 'step' ? 'ReadStepFile' : 'ReadBrepFile';
    const raw = occt[fn](new Uint8Array(buffer), qualityToParams(quality)) as RawOcctResult;
    const result = normalizeOcctResult(raw);
    const transfers: ArrayBuffer[] = [];
    for (const m of result.meshes) {
      transfers.push(m.position.buffer as ArrayBuffer, m.index.buffer as ArrayBuffer);
      if (m.normal) transfers.push(m.normal.buffer as ArrayBuffer);
    }
    (self as unknown as Worker).postMessage({ id, ok: true, result }, transfers);
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, ok: false, error: String(err) });
  }
};
