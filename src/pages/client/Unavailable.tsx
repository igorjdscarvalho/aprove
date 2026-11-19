import { Footer } from '@/components/ui/Footer';

// Mesma tela para link inexistente, não publicado ou arquivado: nunca revela o motivo (seção 11.11).
export function Unavailable({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-[340px] flex-1 flex-col items-center px-6 pt-[12vh] text-center">
        <h1 className="text-xl font-semibold">Este link não está disponível.</h1>
        <p className="mt-1.5 text-muted">Entre em contato com quem enviou o link.</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:bg-surface"
          >
            Tentar novamente
          </button>
        )}
      </main>
      <Footer />
    </div>
  );
}
