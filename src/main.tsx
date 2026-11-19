import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const root = createRoot(document.getElementById('root')!);

// O App é carregado de forma dinâmica para que um erro de configuração
// (variável de ambiente ausente) apareça na tela, e não como página em branco.
import('./App')
  .then(({ App }) =>
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
  .catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    root.render(
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-bold text-bad">Erro de configuração</h1>
        <p className="mt-3 whitespace-pre-wrap text-fg">{msg}</p>
      </main>,
    );
  });
