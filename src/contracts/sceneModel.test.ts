import { describe, it, expect } from 'vitest';
import { emptyMeta, type SceneModel } from './sceneModel';

describe('sceneModel', () => {
  it('emptyMeta has zeroed counts and an empty bbox', () => {
    const m = emptyMeta();
    expect(m.triangleCount).toBe(0);
    expect(m.solidCount).toBe(0);
    expect(m.bbox.min).toEqual([0, 0, 0]);
  });

  it('a SceneModel is structurally usable', () => {
    const model: SceneModel = {
      parts: [{ id: 'p0', name: 'Solid 1', positions: new Float32Array([0, 0, 0]) }],
      meta: emptyMeta(),
      source: { name: 'x.stl', format: 'stl', bytes: 3 },
    };
    expect(model.parts[0].positions.length).toBe(3);
  });
});
