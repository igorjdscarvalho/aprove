export function Spinner({ label = 'Carregando' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 py-10 text-muted">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-fg"
      />
      <span className="text-sm">{label}…</span>
    </div>
  );
}
