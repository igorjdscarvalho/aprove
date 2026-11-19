import { useState, type FormEvent } from 'react';
import { Footer } from '@/components/ui/Footer';
import { mediaSrc } from '@/lib/mediaSrc';
import type { LoginError } from '@/providers/types';

interface Props {
  name: string;
  avatarPath: string | null;
  onLogin: (password: string) => Promise<{ ok: boolean; error?: LoginError }>;
  onUnavailable: () => void;
  onSuccess: () => void;
}

const MESSAGES: Record<'invalid_password' | 'locked' | 'network', string> = {
  invalid_password: 'Senha incorreta. Confira e tente novamente.',
  locked: 'Muitas tentativas. Tente novamente em alguns minutos.',
  network: 'Não foi possível conectar. Verifique a internet e tente de novo.',
};

export function Gate({ name, avatarPath, onLogin, onUnavailable, onSuccess }: Props) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<keyof typeof MESSAGES | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await onLogin(password);
      if (r.ok) return onSuccess();
      if (r.error === 'unavailable') return onUnavailable();
      setError(r.error === 'locked' ? 'locked' : 'invalid_password');
    } catch {
      setError('network');
    } finally {
      setBusy(false);
    }
  }

  const src = mediaSrc(avatarPath);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-[340px] flex-1 flex-col items-center px-6 pt-[12vh] text-center">
        {src ? (
          <img src={src} alt="" className="h-24 w-24 rounded-full object-cover" />
        ) : (
          <div aria-hidden="true" className="h-24 w-24 rounded-full bg-line" />
        )}
        <h1 className="mt-4 text-xl font-semibold">{name}</h1>
        <p className="mb-5 mt-1.5 text-muted">Digite a senha para ver e aprovar os materiais.</p>

        <form onSubmit={submit} className="w-full">
          <label htmlFor="senha" className="sr-only">
            Senha
          </label>
          <div className="relative">
            <input
              id="senha"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              disabled={error === 'locked'}
              placeholder="Senha"
              aria-invalid={error === 'invalid_password'}
              aria-describedby={error ? 'senha-erro' : undefined}
              className="w-full rounded-lg border border-line bg-surface px-3 py-3 pr-20 text-base outline-none focus:border-muted"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-pressed={show}
              className="absolute inset-y-0 right-0 px-3 text-sm font-semibold text-muted hover:text-fg"
            >
              {show ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {error && (
            <p id="senha-erro" role="alert" className="mt-3 text-left text-sm text-bad">
              {MESSAGES[error]}
            </p>
          )}

          <button
            type="submit"
            disabled={!password || busy || error === 'locked'}
            className="mt-4 w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Verificando…' : 'Entrar'}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
