import { describe, it, expect } from 'vitest';
import { computeMeta } from './metadata';
import type { Part } from '../contracts/sceneModel';

const parts: Part[] = [
  {
    id: 'a', name: 'A',
    // a single triangle from (0,0,0)-(2,0,0)-(0,4,0)
    positions: new Float32Array([0, 0, 0, 2, 0, 0, 0, 4, 0]),
  },
  {
    id: 'b', name: 'B',
    // one triangle reaching z = -1 and x = 3
    positions: new Float32Array([3, 0, 0, 0, 0, -1, 0, 1, 0]),
  },
];

describe('computeMeta', () => {
  it('computes bbox over all parts', () => {
    const m = computeMeta(parts, { format: 'stl' });
    expect(m.bbox.min).toEqual([0, 0, -1]);
    expect(m.bbox.max).toEqual([3, 4, 0]);
  });

  it('counts triangles (non-indexed) and solids', () => {
    const m = computeMeta(parts, { format: 'stl' });
    expect(m.triangleCount).toBe(2);
    expect(m.solidCount).toBe(2);
  });

  it('counts triangles from indices when present', () => {
    const indexed: Part[] = [{
      id: 'c', name: 'C',
      positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0]),
      indices: new Uint32Array([0, 1, 2, 1, 3, 2]),
    }];
    expect(computeMeta(indexed, { format: 'step' }).triangleCount).toBe(2);
  });

  it('passes through units/header/flags', () => {
    const m = computeMeta(parts, { format: 'step', units: 'mm', header: { author: 'x' }, flags: ['draft-quality'] });
    expect(m.units).toBe('mm');
    expect(m.header).toEqual({ author: 'x' });
    expect(m.flags).toEqual(['draft-quality']);
  });
});
