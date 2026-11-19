export interface UploadTaskState {
  id: string;
  label: string;
  percent: number;
  status: 'uploading' | 'failed';
  error?: string;
}

export function MediaUploader({ tasks, onCancel }: { tasks: UploadTaskState[]; onCancel: (id: string) => void }) {
  if (!tasks.length) return null;
  return (
    <section className="rounded-xl border border-line bg-surface p-4" aria-live="polite">
      <h3 className="font-semibold">Enviando mídias</h3>
      <ul className="mt-3 space-y-3">
        {tasks.map((task) => (
          <li key={task.id} className="text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate">{task.label}</span>
              {task.status === 'uploading' ? (
                <button type="button" onClick={() => onCancel(task.id)} className="shrink-0 font-semibold text-bad">Cancelar</button>
              ) : (
                <span className="shrink-0 text-bad">Falhou</span>
              )}
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded bg-line">
              <div className="h-full bg-accent transition-[width]" style={{ width: `${task.percent}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">{task.error ?? `${task.percent}%`}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">Se um envio for cancelado ou falhar, tente salvar novamente para continuar o upload.</p>
    </section>
  );
}
