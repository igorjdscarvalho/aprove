import { calculateClientMetrics } from '@/lib/adminMetrics';
import type { AdminPost } from '@/providers/admin/SupabasePostProvider';
import type { PostType } from '@/types/domain';

interface Props {
  posts: AdminPost[];
}

const TYPES: { id: PostType; label: string }[] = [
  { id: 'image', label: 'Imagem' },
  { id: 'carousel', label: 'Carrossel' },
  { id: 'reel', label: 'Reels' },
  { id: 'story', label: 'Story' },
];

const count = (value: number) => new Intl.NumberFormat('pt-BR').format(value);
const average = (adjustments: number, rejected: number) =>
  rejected ? (adjustments / rejected).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—';

export function ClientMetrics({ posts }: Props) {
  const metrics = calculateClientMetrics(posts);
  const cards = [
    { label: 'Conteúdos avaliados', value: count(metrics.evaluated), detail: 'Publicações visíveis com ao menos um retorno' },
    { label: 'Aprovados na 1ª avaliação', value: count(metrics.approvedFirst), detail: 'A primeira resposta foi uma aprovação' },
    { label: 'Reprovados', value: count(metrics.rejected), detail: 'Com ao menos um pedido de ajuste no histórico' },
    { label: 'Ajustes por reprovado', value: average(metrics.adjustments, metrics.rejected), detail: `${count(metrics.adjustments)} pedidos ÷ ${count(metrics.rejected)} conteúdos` },
    { label: 'Reenvios', value: count(metrics.resends), detail: 'Soma das revisões acima da primeira' },
  ];

  return (
    <section className="pt-5">
      <div>
        <h3 className="text-lg font-bold">Métricas</h3>
        <p className="mt-1 text-sm text-muted">Os cálculos usam conteúdos visíveis ao cliente e o histórico completo de avaliações.</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-line bg-surface p-4">
            <p className="text-sm font-semibold text-muted">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
            <p className="mt-1 text-xs text-muted">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <caption className="px-4 py-3 text-left font-semibold">Detalhamento por tipo de conteúdo</caption>
          <thead>
            <tr className="border-y border-line text-xs text-muted">
              <th scope="col" className="px-4 py-3">Tipo</th>
              <th scope="col" className="px-3 py-3">Avaliados</th>
              <th scope="col" className="px-3 py-3">Aprovados na 1ª</th>
              <th scope="col" className="px-3 py-3">Reprovados</th>
              <th scope="col" className="px-3 py-3">Pedidos de ajuste</th>
              <th scope="col" className="px-3 py-3">Ajustes/reprovado</th>
              <th scope="col" className="px-3 py-3">Reenvios</th>
            </tr>
          </thead>
          <tbody>
            {[...TYPES.map(({ id, label }) => ({ label, values: metrics.byType[id] })), { label: 'Total', values: metrics }].map(({ label, values }) => (
              <tr key={label} className={`border-b border-line last:border-0 ${label === 'Total' ? 'font-semibold' : ''}`}>
                <th scope="row" className="px-4 py-3">{label}</th>
                <td className="px-3 py-3">{count(values.evaluated)}</td>
                <td className="px-3 py-3">{count(values.approvedFirst)}</td>
                <td className="px-3 py-3">{count(values.rejected)}</td>
                <td className="px-3 py-3">{count(values.adjustments)}</td>
                <td className="px-3 py-3">{average(values.adjustments, values.rejected)}</td>
                <td className="px-3 py-3">{count(values.resends)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">Ajustes por reprovado é uma média de pedidos por publicação que recebeu ao menos um ajuste. Rascunhos ocultos ficam fora dos cálculos.</p>
    </section>
  );
}
