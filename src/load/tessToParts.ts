import type { Part } from '../contracts/sceneModel';
import type { OcctNode, TessResult } from '../worker/occtTypes';

// Build meshIndex -> node name from the hierarchy (first owner wins).
function nameByMesh(root: OcctNode, out = new Map<number, string>()): Map<number, string> {
  for (const mi of root.meshes) if (!out.has(mi)) out.set(mi, root.name);
  for (const c of root.children) nameByMesh(c, out);
  return out;
}

export function tessToParts(res: TessResult, fallbackPrefix = 'Solid'): Part[] {
  const names = nameByMesh(res.root);
  return res.meshes.map((m, i) => {
    const named = names.get(i);
    return {
      id: `p${i}`,
      name: named && named.length ? named : `${fallbackPrefix} ${i + 1}`,
      positions: m.position,
      normals: m.normal,
      indices: m.index,
      color: m.color,
    };
  });
}
