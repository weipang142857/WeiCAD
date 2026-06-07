interface Props {
  active: boolean;
  distance: number | null;
  units?: string;
}

export function MeasureReadout({ active, distance, units }: Props) {
  if (!active) return null;
  const text = distance == null
    ? 'Click two points'
    : `Distance: ${distance.toFixed(2)} ${units ?? ''}`.trim();
  return (
    <div
      style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.6)', color: '#ffcc00', padding: '6px 14px',
        borderRadius: 4, fontSize: 13, pointerEvents: 'none', whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
}
