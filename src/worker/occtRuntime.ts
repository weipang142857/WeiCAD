import occtimportjs from 'occt-import-js';

let occtPromise: Promise<any> | null = null;

// In Node (tests) occt-import-js locates its wasm itself. In a browser worker,
// pass a locateFile via initOcct(url) BEFORE first use (see occtWorker.ts).
export function initOcct(locateFile?: (f: string) => string): Promise<any> {
  if (!occtPromise) {
    const factory = (occtimportjs as any).default ?? occtimportjs; // bundler interop
    occtPromise = factory(locateFile ? { locateFile } : undefined);
  }
  return occtPromise!;
}
export const getOcct = () => initOcct();
