import type { ModelMeta, Part } from '../contracts/sceneModel';

export interface MetaExtra {
  format: 'stl' | 'step' | 'fcstd';
  units?: string;
  header?: Record<string, string>;
  flags?: string[];
}

export function computeMeta(parts: Part[], extra: MetaExtra): ModelMeta {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let triangleCount = 0;

  for (const p of parts) {
    const pos = p.positions;
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i], y = pos[i + 1], z = pos[i + 2];
      if (x < minX) minX = x; if (y < minY) minY = y; if (z < minZ) minZ = z;
      if (x > maxX) maxX = x; if (y > maxY) maxY = y; if (z > maxZ) maxZ = z;
    }
    triangleCount += p.indices ? p.indices.length / 3 : pos.length / 9;
  }

  const empty = !isFinite(minX);
  return {
    bbox: empty
      ? { min: [0, 0, 0], max: [0, 0, 0] }
      : { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] },
    triangleCount,
    solidCount: parts.length,
    units: extra.units,
    header: extra.header,
    flags: extra.flags,
  };
}
