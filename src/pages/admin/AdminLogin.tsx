import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '@/providers/admin/SupabaseAdminProvider';

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        try {
          if (await verifyAdmin()) {
            if (live) navigate('/admin', { replace: true });
            return;
          }
          await supabase.auth.signOut();
        } catch {
          await supabase.auth.signOut();
        }
      }
      if (live) setChecking(false);
    })();
    return () => {
      live = false;
    };
  }, [navigate]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) {
        setError('E-mail ou senha inválidos.');
        return;
      }
      let allowed = false;
      try {
        allowed = await verifyAdmin();
      } catch {
        await supabase.auth.signOut();
        setError('Não foi possível verificar o acesso administrativo. Tente novamente.');
        return;
      }
      if (!allowed) {
        await supabase.auth.signOut();
        setError('Esta conta não tem acesso administrativo.');
        return;
      }
      navigate('/admin', { replace: true });
    } catch {
      setError('Não foi possível entrar. Verifique a conexão e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  if (checking) return <main className="mx-auto max-w-xl p-6"><Spinner label="Verificando sessão" /></main>;

  return (
    <main className="flex min-h-screen items-start justify-center px-4 pt-[12vh]">
      <section className="w-full max-w-[390px] rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-accent">Aprovação de conteúdo</p>
        <h1 className="mt-3 text-center text-2xl font-bold">Acesso administrativo</h1>
        <p className="mt-2 text-center text-sm text-muted">Entre com seu e-mail e senha de administrador.</p>
        <form className="mt-6 space-y-4" onSubmit={(e) => void submit(e)}>
          <label className="block text-sm font-medium">
            E-mail
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg"
            />
          </label>
          <label className="block text-sm font-medium">
            Senha
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg"
            />
          </label>
          {error && <p role="alert" className="text-sm text-bad">{error}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-lg bg-accent px-4 py-2.5 font-semibold text-white disabled:opacity-60">
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-muted">Simulação para aprovação de conteúdo</p>
      </section>
    </main>
  );
}
