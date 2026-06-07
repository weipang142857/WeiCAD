import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadStl } from './stlLoader';

function buf(path: string): ArrayBuffer {
  const b = readFileSync(path);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

describe('loadStl', () => {
  it('loads a binary STL into one part with triangles and a finite bbox', async () => {
    const model = await loadStl('bolt_m16.stl', buf('test/fixtures/bolt_m16.stl'));
    expect(model.source.format).toBe('stl');
    expect(model.parts.length).toBe(1);
    expect(model.meta.triangleCount).toBeGreaterThan(0);
    expect(model.parts[0].positions.length % 9).toBe(0);
    const { min, max } = model.meta.bbox;
    expect(max[2]).toBeGreaterThan(min[2]);
    expect(Number.isFinite(min[0])).toBe(true);
  });
});
