import type { Quality, RGB } from '../contracts/sceneModel';

// ---- Raw occt-import-js output (subset we consume) ----
export interface RawOcctMesh {
  name?: string;
  color?: RGB;
  attributes: { position: { array: number[] }; normal?: { array: number[] } };
  index: { array: number[] };
}
export interface OcctNode { name: string; meshes: number[]; children: OcctNode[]; }
export interface RawOcctResult { success: boolean; root: OcctNode; meshes: RawOcctMesh[]; }

// ---- Normalized (typed arrays, transferable) ----
export interface NormalizedMesh {
  name?: string;
  color?: RGB;
  position: Float32Array;
  normal?: Float32Array;
  index: Uint32Array;
}
export interface TessResult { success: boolean; root: OcctNode; meshes: NormalizedMesh[]; }

export interface Tessellator {
  step(buffer: ArrayBuffer, quality: Quality): Promise<TessResult>;
  brep(buffer: ArrayBuffer, quality: Quality): Promise<TessResult>;
}

export function qualityToParams(q: Quality): Record<string, unknown> | null {
  // Confirmed acceptable by the Task 0.3 spike.
  if (q === 'normal') return null;
  if (q === 'draft') return { linearDeflectionType: 'bounding_box_ratio', linearDeflection: 0.01, angularDeflection: 1.0 };
  return { linearDeflectionType: 'bounding_box_ratio', linearDeflection: 0.001, angularDeflection: 0.2 };
}

export function normalizeOcctResult(raw: RawOcctResult): TessResult {
  return {
    success: raw.success,
    root: raw.root,
    meshes: raw.meshes.map((m) => ({
      name: m.name,
      color: m.color,
      position: Float32Array.from(m.attributes.position.array),
      normal: m.attributes.normal ? Float32Array.from(m.attributes.normal.array) : undefined,
      index: Uint32Array.from(m.index.array),
    })),
  };
}
