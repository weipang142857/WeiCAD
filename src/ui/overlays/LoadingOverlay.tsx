export function LoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: 'rgba(0,0,0,0.4)', color: '#fff' }}>
      Tessellating…
    </div>
  );
}
