import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import occtimportjs from 'occt-import-js';

// occt-import-js default-export interop varies by bundler; resolve robustly.
const resolveOcct = () => ((occtimportjs as any).default ?? occtimportjs)();

describe('SPIKE: occt-import-js reads raw .brp from an FCStd', () => {
  it('tessellates PartShape.brp from bolt_m16.fcstd', async () => {
    const zip = await JSZip.loadAsync(readFileSync('test/fixtures/bolt_m16.fcstd'));
    const brp = await zip.file('PartShape.brp')!.async('uint8array');
    expect(brp.byteLength).toBeGreaterThan(0);

    const occt = await resolveOcct();
    expect(typeof occt.ReadBrepFile).toBe('function'); // GATE: API exists

    const result = occt.ReadBrepFile(brp, null);
    expect(result.success).toBe(true);
    expect(result.meshes.length).toBeGreaterThan(0);
    const tris = result.meshes.reduce(
      (n: number, m: any) => n + m.index.array.length / 3, 0);
    expect(tris).toBeGreaterThan(0);
  });

  it('accepts a deflection params object without throwing', async () => {
    const zip = await JSZip.loadAsync(readFileSync('test/fixtures/bolt_m16.fcstd'));
    const brp = await zip.file('PartShape.brp')!.async('uint8array');
    const occt = await resolveOcct();
    const r = occt.ReadBrepFile(brp, {
      linearDeflectionType: 'bounding_box_ratio',
      linearDeflection: 0.001,
      angularDeflection: 0.5,
    });
    expect(r.success).toBe(true); // confirms qualityToParams field names
  });
});
