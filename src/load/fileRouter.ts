import type { SceneModel, Quality } from '../contracts/sceneModel';
import type { Tessellator } from '../worker/occtTypes';
import { loadStl } from './stlLoader';
import { loadStep } from './stepLoader';
import { loadFcstd } from './fcstdLoader';

export type Format = 'stl' | 'step' | 'fcstd';

export function detectFormat(name: string, buffer: ArrayBuffer): Format | null {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  const head = new TextDecoder('latin1').decode(new Uint8Array(buffer, 0, Math.min(64, buffer.byteLength)));
  if (head.startsWith('ISO-10303-21')) return 'step';
  if (ext === 'step' || ext === 'stp') return 'step';
  const bytes = new Uint8Array(buffer);
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (ext === 'fcstd' && isZip) return 'fcstd';
  if (ext === 'stl') return 'stl';
  return null;
}

export async function loadFile(
  name: string,
  buffer: ArrayBuffer,
  tess: Tessellator,
  quality: Quality = 'normal',
): Promise<SceneModel> {
  const fmt = detectFormat(name, buffer);
  if (fmt === 'stl') return loadStl(name, buffer);
  if (fmt === 'step') return loadStep(name, buffer, tess, quality);
  if (fmt === 'fcstd') return loadFcstd(name, buffer, tess, quality);
  throw new Error(`Unsupported file: ${name}`);
}
