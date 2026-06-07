import type { Tessellator, RawOcctResult } from '../worker/occtTypes';
import { normalizeOcctResult, qualityToParams } from '../worker/occtTypes';
import { getOcct } from '../worker/occtRuntime';

// Tessellator that runs occt-import-js in-process (used by tests; the app uses the worker).
export const directTessellator: Tessellator = {
  async step(buffer, quality) {
    const occt = await getOcct();
    const raw = occt.ReadStepFile(new Uint8Array(buffer), qualityToParams(quality)) as RawOcctResult;
    return normalizeOcctResult(raw);
  },
  async brep(buffer, quality) {
    const occt = await getOcct();
    const raw = occt.ReadBrepFile(new Uint8Array(buffer), qualityToParams(quality)) as RawOcctResult;
    return normalizeOcctResult(raw);
  },
};
