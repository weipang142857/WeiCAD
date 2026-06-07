import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import { parseFcstdObjects } from './fcstdXml';

async function xmlsOf(file: string) {
  const zip = await JSZip.loadAsync(readFileSync(file));
  return {
    doc: await zip.file('Document.xml')!.async('string'),
    gui: await zip.file('GuiDocument.xml')!.async('string'),
  };
}

describe('parseFcstdObjects', () => {
  it('bolt_m16: one visible object with brp ref and Pz=-2.5 placement', async () => {
    const { doc, gui } = await xmlsOf('test/fixtures/bolt_m16.fcstd');
    const objs = parseFcstdObjects(doc, gui);
    const cyl = objs.find((o) => o.name === 'Cylinder')!;
    expect(cyl.visible).toBe(true);
    expect(cyl.brep).toBe('PartShape.brp');
    expect(cyl.placement.position[2]).toBeCloseTo(-2.5, 6);
    expect(cyl.placement.quaternion).toEqual([0, 0, 0, 1]); // identity
  });

  it('lego_brick: exactly ONE visible object (Cut001), 10 objects total', async () => {
    const { doc, gui } = await xmlsOf('test/fixtures/lego_brick.fcstd');
    const objs = parseFcstdObjects(doc, gui);
    const visible = objs.filter((o) => o.visible && o.brep);
    expect(objs.length).toBe(10);
    expect(visible.map((o) => o.name)).toEqual(['Cut001']);
  });
});
