import occtImportSource from 'occt-import-js/dist/occt-import-js.js?raw';

let occtPromise: Promise<any> | null = null;
let occtFactory: ((config?: { locateFile?: (file: string) => string }) => Promise<any>) | null = null;

function getFactory(): (config?: { locateFile?: (file: string) => string }) => Promise<any> {
  if (!occtFactory) {
    const factory = new Function(`${occtImportSource}\nreturn occtimportjs;`)() as (
      config?: { locateFile?: (file: string) => string }
    ) => Promise<any>;
    occtFactory = factory;
    return factory;
  }
  return occtFactory;
}

export function initBrowserOcct(locateFile: (file: string) => string): Promise<any> {
  if (!occtPromise) {
    occtPromise = getFactory()({ locateFile });
  }
  return occtPromise;
}
