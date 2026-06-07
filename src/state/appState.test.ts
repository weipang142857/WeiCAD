import { describe, it, expect } from 'vitest';
import { reducer, initialState } from './appState';
import { emptyMeta, type SceneModel } from '../contracts/sceneModel';

const model: SceneModel = {
  parts: [{ id: 'p0', name: 'Solid 1', positions: new Float32Array([0, 0, 0]) }],
  meta: emptyMeta(),
  source: { name: 'a.stl', format: 'stl', bytes: 1 },
};

describe('appState reducer', () => {
  it('loads a model and clears loading/error', () => {
    const s = reducer({ ...initialState, loading: true }, { type: 'loaded', model });
    expect(s.model).toBe(model);
    expect(s.loading).toBe(false);
    expect(s.partVisibility['p0']).toBe(true);
  });

  it('toggles part visibility', () => {
    const s1 = reducer({ ...initialState, model }, { type: 'loaded', model });
    const s2 = reducer(s1, { type: 'togglePart', id: 'p0' });
    expect(s2.partVisibility['p0']).toBe(false);
  });

  it('sets display mode and section', () => {
    const s = reducer(initialState, { type: 'setDisplayMode', mode: 'wireframe' });
    expect(s.displayMode).toBe('wireframe');
    const s2 = reducer(s, { type: 'setSection', section: { on: true, axis: 'x', offset: 2 } });
    expect(s2.section).toEqual({ on: true, axis: 'x', offset: 2 });
  });

  it('records errors', () => {
    const s = reducer({ ...initialState, loading: true }, { type: 'error', message: 'boom' });
    expect(s.error).toBe('boom');
    expect(s.loading).toBe(false);
  });

  it('clears the loaded model and returns to the picker state', () => {
    const loaded = reducer(initialState, { type: 'loaded', model });
    const measuring = reducer(loaded, { type: 'setMeasure', on: true });
    const sectioned = reducer(measuring, { type: 'setSection', section: { on: true, axis: 'x', offset: 2 } });
    const cleared = reducer(sectioned, { type: 'clearModel' });

    expect(cleared.model).toBeNull();
    expect(cleared.partVisibility).toEqual({});
    expect(cleared.selectedPartId).toBeNull();
    expect(cleared.section).toEqual(initialState.section);
    expect(cleared.measureMode).toBe(false);
    expect(cleared.loading).toBe(false);
    expect(cleared.error).toBeNull();
  });
});
