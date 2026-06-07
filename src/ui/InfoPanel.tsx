import type { SceneModel } from '../contracts/sceneModel';

export function InfoPanel({ model }: { model: SceneModel | null }) {
  if (!model) return <div style={{ padding: 8, opacity: 0.6 }}>No model loaded</div>;
  const { meta, source } = model;
  const dim = (i: number) => (meta.bbox.max[i] - meta.bbox.min[i]).toFixed(2);
  const rows: [string, string][] = [
    ['File', source.name],
    ['Format', source.format.toUpperCase()],
    ['Size', `${(source.bytes / 1024).toFixed(1)} KB`],
    ['Dimensions', `${dim(0)} × ${dim(1)} × ${dim(2)} ${meta.units ?? ''}`],
    ['Triangles', meta.triangleCount.toLocaleString()],
    ['Solids', String(meta.solidCount)],
    ...(meta.header ? Object.entries(meta.header) : []),
    ...(meta.flags?.length ? [['Flags', meta.flags.join(', ')] as [string, string]] : []),
  ];
  return (
    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}><td style={{ opacity: 0.6, padding: '2px 6px', verticalAlign: 'top' }}>{k}</td>
            <td style={{ padding: '2px 6px', wordBreak: 'break-all' }}>{v}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
