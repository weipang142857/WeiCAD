import type { Part } from '../contracts/sceneModel';

interface Props {
  parts: Part[];
  visibility: Record<string, boolean>;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

export function ModelTree({ parts, visibility, selectedId, onToggle, onSelect }: Props) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 8 }}>
      {parts.map((p) => (
        <li key={p.id}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px',
                     background: p.id === selectedId ? '#33405a' : 'transparent', cursor: 'pointer' }}
            onClick={() => onSelect(p.id)}>
          <input type="checkbox" aria-label={`toggle ${p.id}`} checked={visibility[p.id] ?? true}
                 onChange={(e) => { e.stopPropagation(); onToggle(p.id); }} />
          <span style={{ width: 12, height: 12, borderRadius: 2,
                         background: p.color ? `rgb(${p.color.map((c) => Math.round(c * 255)).join(',')})` : '#ccc' }} />
          <span>{p.name}</span>
        </li>
      ))}
    </ul>
  );
}
