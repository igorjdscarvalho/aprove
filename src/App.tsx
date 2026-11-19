import { useEffect, useState } from 'react';
import { HashRouter, Link, Route, Routes, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

type Resultado = { estado: 'carregando' } | { estado: 'ok' | 'erro'; detalhe: string };

function Linha({ titulo, r }: { titulo: string; r: Resultado }) {
  const cor = r.estado === 'ok' ? 'text-ok' : r.estado === 'erro' ? 'text-bad' : 'text-muted';
  const marca = r.estado === 'ok' ? 'OK' : r.estado === 'erro' ? 'FALHOU' : '...';
  return (
    <li className="flex items-start justify-between gap-4 border-b border-line py-3">
      <span>{titulo}</span>
      <span className={`text-right font-semibold ${cor}`}>
        {marca}
        {r.estado !== 'carregando' && <span className="block text-xs font-normal text-muted">{r.detalhe}</span>}
      </span>
    </li>
  );
}

// Etapa 1: página de diagnóstico. Prova que o build, o roteador e a conexão com o Supabase funcionam.
function Diagnostico() {
  const [ping, setPing] = useState<Resultado>({ estado: 'carregando' });
  const [clients, setClients] = useState<Resultado>({ estado: 'carregando' });
  const [gate, setGate] = useState<Resultado>({ estado: 'carregando' });

  useEffect(() => {
    void (async () => {
      const p = await supabase.rpc('ping');
      setPing(
        p.error
          ? { estado: 'erro', detalhe: p.error.message }
          : p.data === 'ok'
            ? { estado: 'ok', detalhe: 'ping() respondeu "ok"' }
            : { estado: 'erro', detalhe: `resposta inesperada: ${JSON.stringify(p.data)}` },
      );

      // Esperado: o anônimo NÃO pode ler a tabela (erro de permissão ou lista vazia).
      const c = await supabase.from('clients').select('id').limit(1);
      if (c.error) {
        setClients({ estado: 'ok', detalhe: `bloqueado como esperado (${c.error.code ?? 'erro'})` });
      } else if ((c.data ?? []).length === 0) {
        setClients({ estado: 'ok', detalhe: 'nenhuma linha visível para o anônimo' });
      } else {
        setClients({ estado: 'erro', detalhe: 'ATENÇÃO: o anônimo conseguiu ler clientes!' });
      }

      const g = await supabase.rpc('client_gate', { p_slug: 'nao-existe-zz' });
      const disponivel = (g.data as { available?: boolean } | null)?.available;
      setGate(
        g.error
          ? { estado: 'erro', detalhe: g.error.message }
          : disponivel === false
            ? { estado: 'ok', detalhe: 'link inexistente → available: false' }
            : { estado: 'erro', detalhe: `resposta inesperada: ${JSON.stringify(g.data)}` },
      );
    })();
  }, []);

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold">Aprovação de conteúdo</h1>
      <p className="mt-1 text-muted">Etapa 1: esqueleto do projeto. Diagnóstico de conexão.</p>
      <ul className="mt-6">
        <Linha titulo="Site abriu (React + roteador)" r={{ estado: 'ok', detalhe: `base: ${import.meta.env.BASE_URL}` }} />
        <Linha titulo="Supabase responde (ping)" r={ping} />
        <Linha titulo="Anônimo não lê a tabela clients" r={clients} />
        <Linha titulo="client_gate (link inexistente)" r={gate} />
      </ul>
      <p className="mt-6 text-sm text-muted">
        Rotas de teste: <Link className="text-accent" to="/c/exemplo">/c/exemplo</Link>
      </p>
    </main>
  );
}

function ClientePlaceholder() {
  const { slug } = useParams();
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-bold">Cliente: {slug}</h1>
      <p className="mt-2 text-muted">Tela do cliente entra na Etapa 2.</p>
      <Link className="mt-4 inline-block text-accent" to="/">Voltar</Link>
    </main>
  );
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Diagnostico />} />
        <Route path="/c/:slug" element={<ClientePlaceholder />} />
        <Route path="*" element={<Diagnostico />} />
      </Routes>
    </HashRouter>
  );
}
