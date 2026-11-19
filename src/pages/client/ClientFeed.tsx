import { mediaSrc } from '@/lib/mediaSrc';
import { Footer } from '@/components/ui/Footer';
import type { FeedData } from '@/types/domain';

const LABELS: Record<string, string> = { image: 'Imagens', carousel: 'Carrosséis', reel: 'Reels', story: 'Stories' };

// Etapa 2a: confirma que login e feed funcionam. Perfil, grade e filtro de mês chegam na 2b.
export function ClientFeed({ feed, onLogout }: { feed: FeedData; onLogout: () => void }) {
  const { client, posts } = feed;
  const counts = posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-profile flex-1 px-4 py-8">
        <div className="flex items-center gap-5">
          <img src={mediaSrc(client.avatar_path)} alt="" className="h-20 w-20 rounded-full object-cover" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">{client.name}</h1>
            <p className="text-sm text-muted">@{client.username}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="ml-auto rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:bg-surface"
          >
            Sair
          </button>
        </div>
        <p className="mt-4 whitespace-pre-line text-sm">{client.bio}</p>

        <section className="mt-8 rounded-lg border border-line p-4" aria-label="Conteúdo carregado">
          <h2 className="font-semibold">Acesso liberado</h2>
          <p className="mt-1 text-sm text-muted">
            O feed foi carregado ({posts.length} itens visíveis). A grade, o filtro de mês e a visualização dos posts
            entram nas próximas etapas.
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {Object.entries(LABELS).map(([type, label]) => (
              <li key={type} className="rounded-md bg-surface px-3 py-2">
                <span className="block text-lg font-semibold">{counts[type] ?? 0}</span>
                <span className="text-muted">{label}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
