/** 12400 -> "12,4 mil"; 1200000 -> "1,2 mi" (pt-BR). */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}
