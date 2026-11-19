import { formatMonthLabel } from '@/lib/dates';
import type { useMonthFilter } from '@/hooks/useMonthFilter';

type Filter = ReturnType<typeof useMonthFilter>;

export function MonthFilter({ f }: { f: Filter }) {
  const all = f.filter.mode === 'all';
  const label = f.filter.mode === 'all' ? 'Todos os meses' : formatMonthLabel(f.filter.key);
  const arrow =
    'h-[34px] w-[34px] rounded-full text-xl leading-none hover:bg-surface disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent';

  return (
    <div className="flex items-center justify-center gap-2.5 pb-4 pt-1.5">
      <button type="button" onClick={f.prev} disabled={!f.canPrev} aria-label="Mês anterior" className={arrow}>
        ‹
      </button>
      <b className="min-w-[150px] text-center font-semibold" aria-live="polite">
        {label}
      </b>
      <button type="button" onClick={f.next} disabled={!f.canNext} aria-label="Próximo mês" className={arrow}>
        ›
      </button>
      <button
        type="button"
        onClick={all ? f.backToCurrent : f.showAll}
        className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium leading-snug ${
          all ? 'border-fg bg-fg text-bg' : 'border-line hover:bg-surface'
        }`}
      >
        {all ? 'Voltar ao mês atual' : 'Ver todos'}
      </button>
    </div>
  );
}
