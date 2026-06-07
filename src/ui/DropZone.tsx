import { useRef } from 'react';

interface Props {
  empty: boolean;
  onFile: (file: File) => void;
  onPickDemo: (file: string) => void;
}

const DEMOS: { label: string; file: string }[] = [
  { label: 'lego_brick (FCStd)', file: 'lego_brick.fcstd' },
  { label: 'lego_brick (STEP)', file: 'lego_brick.step' },
  { label: 'bolt_m16 (STL)', file: 'bolt_m16.stl' },
];

export function DropZone({ empty, onFile, onPickDemo }: Props) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div data-testid="dropzone"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      style={{ position: 'absolute', inset: 0, display: empty ? 'flex' : 'none',
               flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center',
               color: '#aaa', pointerEvents: empty ? 'auto' : 'none' }}>
      <p>Drop a .FCStd / .STEP / .STL file, or</p>
      <button onClick={() => input.current?.click()}>Choose file…</button>
      <input ref={input} type="file" accept=".stl,.step,.stp,.fcstd" style={{ display: 'none' }}
             onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <div style={{ display: 'flex', gap: 8 }}>
        {DEMOS.map((d) => (
          <button key={d.file} onClick={() => onPickDemo(d.file)}>{d.label}</button>
        ))}
      </div>
    </div>
  );
}
