import { mediaSrc } from '@/lib/mediaSrc';
import { thumbPath } from '@/lib/posts';
import type { ApprovalStatus, Post } from '@/types/domain';
import { CarouselIcon, ReelIcon } from './icons';

const DOT: Record<ApprovalStatus, string> = {
  approved: 'bg-ok',
  changes_requested: 'bg-warn',
  pending: 'bg-[#a8a8a8]',
};
const DOT_LABEL: Record<ApprovalStatus, string> = {
  approved: 'Aprovado',
  changes_requested: 'Ajustes solicitados',
  pending: 'Pendente',
};

// Miniatura 3:4 com o recorte (object-position) definido pelo admin e a bolinha de status (D14).
export function GridTile({ post, onOpen }: { post: Post; onOpen?: () => void }) {
  const inner = (
    <>
      <img
        src={mediaSrc(thumbPath(post))}
        alt=""
        loading="lazy"
        decoding="async"
        className="block h-full w-full object-cover"
        style={{ objectPosition: `${post.grid_crop_x}% ${post.grid_crop_y}%` }}
      />
      {post.type !== 'image' && (
        <span className="absolute right-2 top-2 flex text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.5)]">
          {post.type === 'reel' ? <ReelIcon /> : <CarouselIcon />}
        </span>
      )}
      <i
        role="img"
        aria-label={DOT_LABEL[post.approval_status]}
        className={`absolute bottom-2 left-2 h-3 w-3 rounded-full border-2 border-white ${DOT[post.approval_status]}`}
      />
    </>
  );
  const cls = 'relative block aspect-[3/4] w-full overflow-hidden bg-surface';

  return onOpen ? (
    <button type="button" onClick={onOpen} aria-label="Abrir publicação" className={cls}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
