const TZ = 'America/Sao_Paulo';

/** Mês atual no fuso de São Paulo, no formato 'YYYY-MM' (D10). */
export function todayMonthKey(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' })
    .format(new Date())
    .slice(0, 7);
}

/** Dia de hoje em São Paulo, 'YYYY-MM-DD'. */
export function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(),
  );
}

// Sem new Date(): evita erro de fuso.
export const monthKeyOf = (isoDate: string): string => isoDate.slice(0, 7);

export function addMonths(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** "Novembro de 2026" */
export function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const s = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "12 de novembro de 2026" a partir de 'YYYY-MM-DD'. */
export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}
