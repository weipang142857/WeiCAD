# WeiCAD

A fully client-side web viewer for **`.FCStd`**, **`.STEP`/`.stp`**, and **`.STL`** files.
Drag a file in (or open a bundled demo) and inspect it in 3D — orbit/zoom/pan, a parts tree
with per-part visibility, a metadata panel, display modes (shaded / shaded+edges / wireframe),
a section plane, and PNG screenshot. **No server required.**

STL is a raw mesh (rendered directly). STEP and the BREP solids inside FCStd are tessellated
**in the browser** by `occt-import-js` (a WASM build of OpenCASCADE) running in a **Web Worker**,
then displayed with three.js.

## Architecture

```
React UI ──▶ Viewer (imperative three.js) ──▶ SceneModel ◀── loaders (stl | step | fcstd)
                                                              fcstd/step ─▶ OCCT Web Worker (WASM)
```

Every format loader emits one normalized `SceneModel`; the Viewer and UI never touch
format-specific code.

Two correctness notes worth knowing:
- **FCStd visibility:** FreeCAD stores a `.brp` for every object including consumed/intermediate
  features; only `Visibility=true` objects are rendered (e.g. `lego_brick` has 10 objects but
  only `Cut001` is shown).
- **FCStd world-space:** FreeCAD `Part::Feature` `.brp` geometry is already world-space (the
  Placement is baked at save time), so it is rendered as-is. This is verified by a **triplet
  oracle** test that compares the FCStd bounding box to the matching `.stl` export.

## Develop

```bash
npm ci
npm run dev      # local dev server
npm test         # unit + loader tests (Vitest, incl. the OCCT triplet oracle)
npm run e2e      # Playwright end-to-end (real browser → worker → WASM → WebGL)
npm run e2e:chrome # same e2e suite using an installed Google Chrome channel
npm run build    # static output in dist/
```

Toolchain note: this project targets **Node 20.7**, which constrains some dev dependencies —
`vite@5`, `vitest@2`, and `happy-dom` (instead of `jsdom`) for component tests. The app code is
unaffected.

## Deploy

`dist/` is fully static — host it on GitHub Pages / Netlify / S3. `occt-import-js` is
single-threaded WASM, so **no COOP/COEP headers and no `SharedArrayBuffer`** are required. For a
GitHub Pages subpath, set Vite's `base` accordingly.

## Known limitations (v1)

The core viewer is complete — load all three formats, a parts tree with per-part visibility,
metadata, display modes (shaded / shaded+edges / wireframe), a **steerable** section plane
(axis + offset), point-to-point **measure**, fit, standard views, and PNG screenshot. The
following are intentionally deferred and are **not** presented as working controls:

- **Units** are shown only for FCStd (`mm`); STEP/STL dimensions are unit-less.
- **No per-part colour editing** and **no 3D selection highlight** — selecting a tree row
  highlights the row only, not the geometry.
- **No OCCT worker auto-restart** — if a tessellation crashes the worker, reload the page.
- **Loading overlay** is a simple spinner (no progress bar / cancel); very large files
  (>40 MB) use a blocking confirm prompt rather than a styled dialog.
- The section cross-section is **uncapped** (open), and **per-face colours** from STEP/FCStd are
  reserved in the `SceneModel` contract (`Part.colorGroups`) but not yet rendered.

## Demo files & attribution

`public/demo/*` (`lego_brick.*`, `bolt_m16.*`) are derived from the
[FreeCAD-library](https://github.com/FreeCAD/FreeCAD-library) (LGPL-2.1). They double as the test
fixtures in `test/fixtures/`.

Additional manually-loadable test fixtures live in `public/adopted/`, with source paths and
intended use recorded in `public/adopted/manifest.json`. They include a small/medium/hard STEP
sample pack from MFCAD-VLM and matched `.FCStd` / `.STEP` / `.STL` examples from FreeCAD-library.
See `THIRD_PARTY_NOTICES.md` for attribution and license notes.
