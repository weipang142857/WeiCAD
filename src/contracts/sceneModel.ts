export type Quality = 'draft' | 'normal' | 'fine';
export type RGB = [number, number, number];

export interface Part {
  id: string;
  name: string;
  positions: Float32Array;
  normals?: Float32Array;
  indices?: Uint32Array;
  color?: RGB;
  colorGroups?: { color: RGB; triStart: number; triCount: number }[]; // reserved (per-face)
}

export interface ModelMeta {
  bbox: { min: [number, number, number]; max: [number, number, number] };
  units?: string;
  triangleCount: number;
  solidCount: number;
  header?: Record<string, string>;
  flags?: string[];
}

export interface SceneModel {
  parts: Part[];
  meta: ModelMeta;
  source: { name: string; format: 'stl' | 'step' | 'fcstd'; bytes: number };
}

export function emptyMeta(): ModelMeta {
  return {
    bbox: { min: [0, 0, 0], max: [0, 0, 0] },
    triangleCount: 0,
    solidCount: 0,
  };
}
