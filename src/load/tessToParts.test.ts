import { describe, it, expect } from 'vitest';
import { tessToParts } from './tessToParts';
import type { TessResult } from '../worker/occtTypes';

const res: TessResult = {
  success: true,
  root: { name: 'Assembly', meshes: [], children: [
    { name: 'WidgetA', meshes: [0], children: [] },
    { name: 'WidgetB', meshes: [1], children: [] },
  ] },
  meshes: [
    { name: 'm0', color: [1, 0, 0], position: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), index: new Uint32Array([0, 1, 2]) },
    { name: 'm1', position: new Float32Array([0, 0, 0, 2, 0, 0, 0, 2, 0]), index: new Uint32Array([0, 1, 2]) },
  ],
};

describe('tessToParts', () => {
  it('maps each mesh to a Part, carrying color and index', () => {
    const parts = tessToParts(res);
    expect(parts.length).toBe(2);
    expect(parts[0].color).toEqual([1, 0, 0]);
    expect(parts[0].indices).toEqual(new Uint32Array([0, 1, 2]));
  });

  it('names parts from the root hierarchy when available', () => {
    const parts = tessToParts(res);
    expect(parts[0].name).toBe('WidgetA');
    expect(parts[1].name).toBe('WidgetB');
  });

  it('falls back to indexed names with no hierarchy', () => {
    const flat: TessResult = { success: true, root: { name: '', meshes: [0], children: [] }, meshes: [res.meshes[0]] };
    expect(tessToParts(flat, 'Solid')[0].name).toBe('Solid 1');
  });
});
