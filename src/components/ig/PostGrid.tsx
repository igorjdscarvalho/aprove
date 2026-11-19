import type { Post } from '@/types/domain';
import { GridTile } from './GridTile';

interface Props {
  posts: Post[];
  emptyLabel: string;
  onShowAll: () => void;
  onOpen?: (index: number) => void;
}

export function PostGrid({ posts, emptyLabel, onShowAll, onOpen }: Props) {
  if (posts.length === 0) {
    return (
      <div className="px-4 py-16 text-center text-muted">
        <p>Nenhuma publicação planejada para {emptyLabel}.</p>
        <button
          type="button"
          onClick={onShowAll}
          className="mt-3 rounded-full border border-line px-4 py-1.5 text-[13px] font-medium text-fg hover:bg-surface"
        >
          Ver todos
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-[3px]">
        {posts.map((p, i) => (
          <GridTile key={p.id} post={p} onOpen={onOpen ? () => onOpen(i) : undefined} />
        ))}
      </div>
      <ul className="mt-4 flex justify-center gap-4 text-xs text-muted" aria-label="Legenda das bolinhas">
        <li className="flex items-center gap-1.5">
          <i className="h-[9px] w-[9px] rounded-full bg-ok" />
          Aprovado
        </li>
        <li className="flex items-center gap-1.5">
          <i className="h-[9px] w-[9px] rounded-full bg-warn" />
          Ajustes
        </li>
        <li className="flex items-center gap-1.5">
          <i className="h-[9px] w-[9px] rounded-full bg-[#a8a8a8]" />
          Pendente
        </li>
      </ul>
    </>
  );
}
