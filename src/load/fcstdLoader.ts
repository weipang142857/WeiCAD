import JSZip from 'jszip';
import type { SceneModel, Quality, Part } from '../contracts/sceneModel';
import type { Tessellator } from '../worker/occtTypes';
import { parseFcstdObjects } from './fcstdXml';
import { tessToParts } from './tessToParts';
import { computeMeta } from '../meta/metadata';

export async function loadFcstd(
  name: string, buffer: ArrayBuffer, tess: Tessellator, quality: Quality,
): Promise<SceneModel> {
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file('Document.xml')?.async('string');
  const guiXml = await zip.file('GuiDocument.xml')?.async('string');
  if (!docXml || !guiXml) throw new Error('Not a valid FCStd document');

  // Render only visible objects. FreeCAD also stores a .brp for every consumed/intermediate
  // feature (e.g. the base & tool of a Cut); drawing those would overlap solids and inflate
  // the bounding box. (lego_brick has 10 objects but only Cut001 is visible.)
  const objects = parseFcstdObjects(docXml, guiXml).filter((o) => o.visible && o.brep);
  if (objects.length === 0) throw new Error('No visible geometry in FCStd file');

  // FreeCAD Part::Feature shapes are saved in WORLD space: the object's Placement is already
  // baked into the .brp at save time, so the tessellated geometry is used as-is. Applying the
  // Placement again would double-transform it. (Proven by the triplet oracle: bolt_m16 has
  // Pz=-2.5 and the raw BREP bbox matches the STL export to <0.01 mm.) Out of scope for v1:
  // App::Part / App::Link assemblies whose child bodies are stored in a local frame and would
  // need the container placement applied — `FcObject.placement` is parsed and available for that.
  const parts: Part[] = [];
  for (const obj of objects) {
    const brpFile = zip.file(obj.brep!);
    if (!brpFile) continue;
    const brp = await brpFile.async('uint8array');
    const ab = brp.buffer.slice(brp.byteOffset, brp.byteOffset + brp.byteLength) as ArrayBuffer;
    const res = await tess.brep(ab, quality);
    if (!res.success) continue;
    // Keep tessToParts' per-solid names; only disambiguate when one object yields >1 solid.
    const objParts = tessToParts(res, obj.name);
    objParts.forEach((part, k) => {
      parts.push({
        ...part,
        id: `${obj.name}-${parts.length}`,
        name: objParts.length > 1 ? `${obj.name} (${k + 1})` : obj.name,
      });
    });
  }
  if (parts.length === 0) throw new Error('No displayable geometry in FCStd file');

  const flags = quality !== 'normal' ? [`${quality}-quality`] : undefined;
  return {
    parts,
    meta: computeMeta(parts, { format: 'fcstd', units: 'mm', flags }),
    source: { name, format: 'fcstd', bytes: buffer.byteLength },
  };
}
