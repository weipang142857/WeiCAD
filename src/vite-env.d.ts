/// <reference types="vite/client" />

// occt-import-js ships no type declarations. It exports a factory that returns
// a Promise resolving to the WASM module (ReadStepFile / ReadBrepFile / ...).
declare module 'occt-import-js' {
  const factory: (config?: { locateFile?: (file: string) => string }) => Promise<any>;
  export default factory;
}

// Vite `?url` import for the OCCT WASM binary (used by the web worker).
declare module '*.wasm?url' {
  const url: string;
  export default url;
}
