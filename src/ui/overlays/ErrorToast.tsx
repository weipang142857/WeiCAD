export function ErrorToast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  if (!message) return null;
  return (
    <div role="alert" onClick={onDismiss}
      style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
               background: '#a33', color: '#fff', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>
      {message}
    </div>
  );
}
