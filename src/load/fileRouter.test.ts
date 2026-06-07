import { describe, it, expect } from 'vitest';
import { detectFormat } from './fileRouter';

const enc = (s: string) => new TextEncoder().encode(s).buffer;

describe('detectFormat', () => {
  it('detects STEP by magic regardless of extension', () => {
    expect(detectFormat('part.stp', enc('ISO-10303-21;\nHEADER;'))).toBe('step');
    expect(detectFormat('PART.STEP', enc('ISO-10303-21;'))).toBe('step');
  });

  it('detects FCStd by zip magic (PK) + extension', () => {
    const pk = new Uint8Array([0x50, 0x4b, 0x03, 0x04]).buffer;
    expect(detectFormat('thing.FCStd', pk)).toBe('fcstd');
  });

  it('detects STL by extension (case-insensitive)', () => {
    expect(detectFormat('mesh.STL', enc('MESH binary header...'))).toBe('stl');
    expect(detectFormat('mesh.stl', enc('solid foo'))).toBe('stl');
  });

  it('ignores .fcstd1 backups and unknown types', () => {
    expect(detectFormat('thing.fcstd1', enc('PK'))).toBeNull();
    expect(detectFormat('notes.txt', enc('hello'))).toBeNull();
  });
});
