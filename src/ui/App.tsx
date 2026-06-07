import { useReducer, useRef, useState } from 'react';
import { reducer, initialState, type SectionState } from '../state/appState';
import { Viewer } from '../viewer/Viewer';
import { createWorkerTessellator } from '../worker/workerTessellator';
import { loadFile } from '../load/fileRouter';
import { ViewportCanvas } from './ViewportCanvas';
import { Toolbar } from './Toolbar';
import { ModelTree } from './ModelTree';
import { InfoPanel } from './InfoPanel';
import { DropZone } from './DropZone';
import { LoadingOverlay } from './overlays/LoadingOverlay';
import { ErrorToast } from './overlays/ErrorToast';
import { MeasureReadout } from './overlays/MeasureReadout';

const LARGE = 40 * 1024 * 1024;

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [measureDistance, setMeasureDistance] = useState<number | null>(null);
  const viewer = useRef<Viewer | null>(null);
  const tess = useRef(createWorkerTessellator());

  // Offset range for the section slider, derived from the model bbox on the active axis.
  const axisIndex = { x: 0, y: 1, z: 2 } as const;
  const sectionRange = (axis: 'x' | 'y' | 'z'): [number, number] => {
    const bbox = state.model?.meta.bbox;
    if (!bbox) return [0, 1];
    const i = axisIndex[axis];
    return [bbox.min[i], bbox.max[i]];
  };
  const midpoint = (axis: 'x' | 'y' | 'z'): number => {
    const [min, max] = sectionRange(axis);
    return (min + max) / 2;
  };

  function applySection(next: SectionState) {
    viewer.current?.setSection(next.on, next.axis, next.offset);
    dispatch({ type: 'setSection', section: next });
  }

  async function open(name: string, buffer: ArrayBuffer) {
    if (buffer.byteLength > LARGE && !confirm('Large file — tessellation may take a while. Continue?')) return;
    dispatch({ type: 'loadStart' });
    try {
      const model = await loadFile(name, buffer, tess.current, state.quality);
      dispatch({ type: 'loaded', model });
      viewer.current?.loadModel(model);
      viewer.current?.setDisplayMode(state.displayMode);
    } catch (e) {
      dispatch({ type: 'error', message: (e as Error).message });
    }
  }

  const onFile = async (file: File) => open(file.name, await file.arrayBuffer());
  const onPickDemo = async (file: string) => {
    const res = await fetch(`${import.meta.env.BASE_URL}demo/${file}`);
    open(file, await res.arrayBuffer());
  };

  function onToggleMeasure() {
    const on = !state.measureMode;
    dispatch({ type: 'setMeasure', on });
    setMeasureDistance(null);
    viewer.current?.setMeasureMode(on, (mm) => setMeasureDistance(mm));
  }

  function onToggleSection() {
    const on = !state.section.on;
    // When turning on, default the offset to the axis midpoint of the current model.
    const offset = on ? midpoint(state.section.axis) : state.section.offset;
    applySection({ ...state.section, on, offset });
  }

  function onSectionAxis(axis: 'x' | 'y' | 'z') {
    // Recompute range and reset offset to the new axis midpoint.
    applySection({ ...state.section, axis, offset: midpoint(axis) });
  }

  function onSectionOffset(offset: number) {
    applySection({ ...state.section, offset });
  }

  function onClearModel() {
    viewer.current?.clearModel();
    setMeasureDistance(null);
    dispatch({ type: 'clearModel' });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid',
                  gridTemplateColumns: '220px 1fr 260px', gridTemplateRows: 'auto 1fr',
                  fontFamily: 'system-ui', color: '#ddd', background: '#202024' }}>
      <div style={{ gridColumn: '1 / 4' }}>
        <Toolbar
          displayMode={state.displayMode} quality={state.quality}
          hasModel={!!state.model}
          section={state.section.on} measure={state.measureMode}
          sectionAxis={state.section.axis} sectionOffset={state.section.offset}
          sectionRange={sectionRange(state.section.axis)}
          onView={(v) => viewer.current?.standardView(v)}
          onFit={() => viewer.current?.fitView()}
          onDisplayMode={(m) => { dispatch({ type: 'setDisplayMode', mode: m }); viewer.current?.setDisplayMode(m); }}
          onToggleSection={onToggleSection}
          onSectionAxis={onSectionAxis}
          onSectionOffset={onSectionOffset}
          onToggleMeasure={onToggleMeasure}
          onQuality={(q) => dispatch({ type: 'setQuality', quality: q })}
          onClearModel={onClearModel}
          onScreenshot={() => { const url = viewer.current?.screenshot(); if (url) { const a = document.createElement('a'); a.href = url; a.download = 'view.png'; a.click(); } }}
        />
      </div>
      <div style={{ overflow: 'auto', borderRight: '1px solid #333' }}>
        {state.model && <ModelTree parts={state.model.parts} visibility={state.partVisibility}
          selectedId={state.selectedPartId}
          onToggle={(id) => { dispatch({ type: 'togglePart', id }); viewer.current?.setPartVisibility(id, !state.partVisibility[id]); }}
          onSelect={(id) => dispatch({ type: 'selectPart', id })} />}
      </div>
      <div style={{ position: 'relative' }}>
        <ViewportCanvas onReady={(v) => (viewer.current = v)} />
        <DropZone empty={!state.model} onFile={onFile} onPickDemo={onPickDemo} />
        <LoadingOverlay show={state.loading} />
        <MeasureReadout active={state.measureMode} distance={measureDistance} units={state.model?.meta.units} />
        <ErrorToast message={state.error} onDismiss={() => dispatch({ type: 'error', message: '' })} />
      </div>
      <div style={{ overflow: 'auto', borderLeft: '1px solid #333' }}>
        <InfoPanel model={state.model} />
      </div>
    </div>
  );
}
