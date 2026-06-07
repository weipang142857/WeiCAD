import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadStep } from './stepLoader';
import { directTessellator } from './directTessellator';
import type { Tessellator, TessResult } from '../worker/occtTypes';

function buf(path: string): ArrayBuffer {
  const b = readFileSync(path);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

describe('loadStep (occt integration)', () => {
  it('tessellates bolt_m16.step into >=1 solid with triangles', async () => {
    const model = await loadStep('bolt_m16.step', buf('test/fixtures/bolt_m16.step'), directTessellator, 'normal');
    expect(model.source.format).toBe('step');
    expect(model.meta.solidCount).toBeGreaterThanOrEqual(1);
    expect(model.meta.triangleCount).toBeGreaterThan(0);
    expect(model.meta.header?.schema).toContain('214');
  }, 30000);

  it('keeps STEP header metadata when the tessellator transfers the input buffer', async () => {
    const text = "ISO-10303-21;\nHEADER;\nFILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 3 1 1 }'));\nENDSEC;\nDATA;\nENDSEC;\nEND-ISO-10303-21;";
    const input = new TextEncoder().encode(text).buffer;
    const tessResult: TessResult = {
      success: true,
      root: { name: '', meshes: [0], children: [] },
      meshes: [{
        position: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        index: new Uint32Array([0, 1, 2]),
      }],
    };
    const transferringTessellator: Tessellator = {
      async step(buffer) {
        structuredClone(buffer, { transfer: [buffer] });
        return tessResult;
      },
      async brep() {
        return tessResult;
      },
    };

    const model = await loadStep('transferred.step', input, transferringTessellator, 'normal');

    expect(model.source.bytes).toBe(text.length);
    expect(model.meta.header?.schema).toContain('214');
    expect(model.meta.triangleCount).toBe(1);
  });
});
