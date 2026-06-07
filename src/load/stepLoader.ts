import type { SceneModel, Quality } from '../contracts/sceneModel';
import type { Tessellator } from '../worker/occtTypes';
import { tessToParts } from './tessToParts';
import { parseStepHeader } from './stepHeader';
import { computeMeta } from '../meta/metadata';

export async function loadStep(
  name: string, buffer: ArrayBuffer, tess: Tessellator, quality: Quality,
): Promise<SceneModel> {
  const sourceBytes = buffer.byteLength;
  const headerText = new TextDecoder('latin1').decode(new Uint8Array(buffer, 0, Math.min(4000, sourceBytes)));
  const header = parseStepHeader(headerText);
  const res = await tess.step(buffer, quality);
  if (!res.success) throw new Error(`Failed to read STEP: ${name}`);
  const parts = tessToParts(res);
  if (parts.length === 0) throw new Error('No displayable geometry in STEP file');

  const flags = quality !== 'normal' ? [`${quality}-quality`] : undefined;

  return {
    parts,
    meta: computeMeta(parts, { format: 'step', header, flags }),
    source: { name, format: 'step', bytes: sourceBytes },
  };
}
