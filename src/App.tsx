import { HashRouter, Route, Routes } from 'react-router-dom';
import { Diagnostico } from '@/pages/Diagnostico';
import { ClientEntry } from '@/pages/client/ClientEntry';
import { Unavailable } from '@/pages/client/Unavailable';

export function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Etapa 3 trocará "/" pelo login do admin (D19). Até lá, é o diagnóstico. */}
        <Route path="/" element={<Diagnostico />} />
        <Route path="/diagnostico" element={<Diagnostico />} />
        <Route path="/c/:slug" element={<ClientEntry />} />
        <Route path="/c/:slug/p/:postId" element={<ClientEntry />} />
        <Route path="*" element={<Unavailable />} />
      </Routes>
    </HashRouter>
  );
}
