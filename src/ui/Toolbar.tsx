import type { DisplayMode } from '../viewer/Viewer';
import type { Quality } from '../contracts/sceneModel';
import type { StandardView } from '../viewer/viewerMath';

interface Props {
  displayMode: DisplayMode;
  quality: Quality;
  hasModel: boolean;
  section: boolean;
  measure: boolean;
  sectionAxis: 'x' | 'y' | 'z';
  sectionOffset: number;
  sectionRange: [number, number];
  onView: (v: StandardView) => void;
  onFit: () => void;
  onDisplayMode: (m: DisplayMode) => void;
  onToggleSection: () => void;
  onSectionAxis: (a: 'x' | 'y' | 'z') => void;
  onSectionOffset: (o: number) => void;
  onToggleMeasure: () => void;
  onQuality: (q: Quality) => void;
  onClearModel: () => void;
  onScreenshot: () => void;
}

export function Toolbar(p: Props) {
  const views: StandardView[] = ['iso', 'top', 'front', 'right'];
  const modes: DisplayMode[] = ['shaded', 'shaded-edges', 'wireframe'];
  const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
  const [min, max] = p.sectionRange;
  const step = (max - min) / 200 || 0.01;
  return (
    <div style={{ display: 'flex', gap: 8, padding: 6, alignItems: 'center', background: '#1a1a1e', color: '#ddd' }}>
      {views.map((v) => <button key={v} onClick={() => p.onView(v)}>{v}</button>)}
      <button onClick={p.onFit}>Fit</button>
      <span style={{ width: 1, height: 18, background: '#444' }} />
      <select aria-label="display mode" value={p.displayMode} onChange={(e) => p.onDisplayMode(e.target.value as DisplayMode)}>
        {modes.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <button onClick={p.onToggleSection} aria-pressed={p.section}>Section{p.section ? ' ✓' : ''}</button>
      {p.section && (
        <>
          <select aria-label="section axis" value={p.sectionAxis} onChange={(e) => p.onSectionAxis(e.target.value as 'x' | 'y' | 'z')}>
            {axes.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <input aria-label="section offset" type="range" min={min} max={max} step={step}
                 value={p.sectionOffset} onChange={(e) => p.onSectionOffset(Number(e.target.value))} />
        </>
      )}
      <button onClick={p.onToggleMeasure} aria-pressed={p.measure}>Measure{p.measure ? ' ✓' : ''}</button>
      <select aria-label="quality" value={p.quality} onChange={(e) => p.onQuality(e.target.value as Quality)}>
        {(['draft', 'normal', 'fine'] as Quality[]).map((q) => <option key={q} value={q}>{q}</option>)}
      </select>
      <span style={{ flex: 1 }} />
      <button onClick={p.onClearModel} disabled={!p.hasModel}>Open another</button>
      <button onClick={p.onScreenshot}>Screenshot</button>
    </div>
  );
}
