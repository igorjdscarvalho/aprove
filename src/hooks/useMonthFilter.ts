import { useSearchParams } from 'react-router-dom';
import { addMonths, todayMonthKey } from '@/lib/dates';

export type MonthFilterState = { mode: 'month'; key: string } | { mode: 'all' };

const LIMIT = 36; // só evita cliques infinitos (seção 11.3)

/** Filtro de mês guardado na URL (`#/c/slug?m=2026-11` ou `?m=all`): sobrevive ao recarregar. */
export function useMonthFilter() {
  const [params, setParams] = useSearchParams();
  const current = todayMonthKey();
  const raw = params.get('m');

  const filter: MonthFilterState =
    raw === 'all'
      ? { mode: 'all' }
      : raw && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw)
        ? { mode: 'month', key: raw }
        : { mode: 'month', key: current };

  const apply = (next: MonthFilterState) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set('m', next.mode === 'all' ? 'all' : next.key);
        return p;
      },
      { replace: true },
    );

  const min = addMonths(current, -LIMIT);
  const max = addMonths(current, LIMIT);
  const key = filter.mode === 'month' ? filter.key : current;

  return {
    filter,
    current,
    canPrev: filter.mode === 'month' && key > min,
    canNext: filter.mode === 'month' && key < max,
    prev: () => apply({ mode: 'month', key: addMonths(key, -1) }),
    next: () => apply({ mode: 'month', key: addMonths(key, 1) }),
    showAll: () => apply({ mode: 'all' }),
    backToCurrent: () => apply({ mode: 'month', key: current }),
  };
}
