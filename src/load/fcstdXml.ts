export interface FcObject {
  name: string;
  brep?: string;            // referenced .brp file, if the object stores a Part shape
  visible: boolean;
  placement: { position: [number, number, number]; quaternion: [number, number, number, number] };
}

const IDENTITY = (): FcObject['placement'] => ({ position: [0, 0, 0], quaternion: [0, 0, 0, 1] });

// DOMParser exists in the browser and in jsdom; in Node (Vitest default env) we
// fall back to regex extraction, which is sufficient for FreeCAD's flat XML.
export function parseFcstdObjects(documentXml: string, guiXml: string): FcObject[] {
  const visible = parseVisibility(guiXml);
  const objects: FcObject[] = [];

  // Each <Object name="..."> ... </Object> inside <ObjectData>.
  const objRe = /<Object\s+name="([^"]+)"[\s\S]*?<\/Object>/g;
  let m: RegExpExecArray | null;
  while ((m = objRe.exec(documentXml))) {
    const name = m[1];
    const block = m[0];
    const brepM = /<Property name="Shape"[\s\S]*?<Part\s+file="([^"]+\.brp)"/.exec(block);
    const placement = parsePlacement(block);
    objects.push({
      name,
      brep: brepM ? brepM[1] : undefined,
      visible: visible.get(name) ?? false,
      placement,
    });
  }
  return objects;
}

function parseVisibility(guiXml: string): Map<string, boolean> {
  const map = new Map<string, boolean>();
  const vpRe = /<ViewProvider\s+name="([^"]+)"[\s\S]*?<\/ViewProvider>/g;
  let m: RegExpExecArray | null;
  while ((m = vpRe.exec(guiXml))) {
    const name = m[1];
    const vis = /<Property name="Visibility"[\s\S]*?<Bool value="(\w+)"/.exec(m[0]);
    map.set(name, vis ? vis[1] === 'true' : false);
  }
  return map;
}

function parsePlacement(block: string): FcObject['placement'] {
  // The object's own Placement property (not AttachmentOffset).
  const pm = /<Property name="Placement"[\s\S]*?<PropertyPlacement\s+([^/>]+)\/>/.exec(block);
  if (!pm) return IDENTITY();
  const attrs = pm[1];
  const num = (k: string, d = 0) => {
    const a = new RegExp(`${k}="([^"]+)"`).exec(attrs);
    return a ? parseFloat(a[1]) : d;
  };
  return {
    position: [num('Px'), num('Py'), num('Pz')],
    quaternion: [num('Q0'), num('Q1'), num('Q2'), num('Q3', 1)],
  };
}
