import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadFcstd } from './fcstdLoader';
import { loadStl } from './stlLoader';
import { directTessellator } from './directTessellator';

function buf(path: string): ArrayBuffer {
  const b = readFileSync(path);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}
const span = (m: { bbox: { min: number[]; max: number[] } }) =>
  [0, 1, 2].map((i) => m.bbox.max[i] - m.bbox.min[i]);

describe('loadFcstd', () => {
  it('loads bolt_m16.fcstd (single visible object)', async () => {
    const model = await loadFcstd('bolt_m16.fcstd', buf('test/fixtures/bolt_m16.fcstd'), directTessellator, 'normal');
    expect(model.source.format).toBe('fcstd');
    expect(model.meta.triangleCount).toBeGreaterThan(0);
  }, 30000);

  it('lego_brick.fcstd renders only the visible object (not all 10 .brp)', async () => {
    const model = await loadFcstd('lego_brick.fcstd', buf('test/fixtures/lego_brick.fcstd'), directTessellator, 'normal');
    // Only Cut001 is visible; bbox must match the STL, not a union of 10 consumed solids.
    const stl = await loadStl('lego_brick.stl', buf('test/fixtures/lego_brick.stl'));
    const a = span(model.meta), b = span(stl.meta);
    for (let i = 0; i < 3; i++) expect(Math.abs(a[i] - b[i])).toBeLessThan(0.5); // mm, tessellation-noise tolerant
  }, 30000);

  it('★ ORACLE: bolt_m16 fcstd bbox ≈ stl bbox (proves placement Pz=-2.5 applied)', async () => {
    const fc = await loadFcstd('bolt_m16.fcstd', buf('test/fixtures/bolt_m16.fcstd'), directTessellator, 'normal');
    const stl = await loadStl('bolt_m16.stl', buf('test/fixtures/bolt_m16.stl'));
    for (let i = 0; i < 3; i++) {
      // 0.2 mm absolute: catches the 2.5 mm placement shift, tolerates tessellation noise.
      expect(Math.abs(fc.meta.bbox.min[i] - stl.meta.bbox.min[i])).toBeLessThan(0.2);
      expect(Math.abs(fc.meta.bbox.max[i] - stl.meta.bbox.max[i])).toBeLessThan(0.2);
    }
  }, 30000);
});
