import type { GridTab } from '@/lib/posts';

const TABS: { id: GridTab; label: string }[] = [
  { id: 'posts', label: 'Publicações' },
  { id: 'reels', label: 'Reels' },
];

export function ProfileTabs({ tab, onChange }: { tab: GridTab; onChange: (t: GridTab) => void }) {
  return (
    <nav aria-label="Tipo de conteúdo" className="flex justify-center gap-12 border-t border-line">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          aria-current={tab === t.id ? 'page' : undefined}
          className={`-mt-px border-t px-1 py-3.5 text-[13px] font-semibold ${
            tab === t.id ? 'border-fg text-fg' : 'border-transparent text-muted'
          }`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
