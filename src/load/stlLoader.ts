import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import type { SceneModel } from '../contracts/sceneModel';
import { computeMeta } from '../meta/metadata';

export async function loadStl(name: string, buffer: ArrayBuffer): Promise<SceneModel> {
  const geom = new STLLoader().parse(buffer);
  if (!geom.attributes.normal) geom.computeVertexNormals();
  const positions = geom.attributes.position.array as Float32Array;
  const normals = geom.attributes.normal.array as Float32Array;

  const part = {
    id: 'p0',
    name: 'Solid 1',
    positions: Float32Array.from(positions),
    normals: Float32Array.from(normals),
  };
  return {
    parts: [part],
    meta: computeMeta([part], { format: 'stl' }),
    source: { name, format: 'stl', bytes: buffer.byteLength },
  };
}
