import { HashRouter, Route, Routes, useParams } from 'react-router-dom';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Diagnostico } from '@/pages/Diagnostico';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminLogin } from '@/pages/admin/AdminLogin';
import { ClientFormPage } from '@/pages/admin/ClientFormPage';
import { ClientEntry } from '@/pages/client/ClientEntry';
import { Unavailable } from '@/pages/client/Unavailable';

function EditClientRoute() {
  const { clientId } = useParams();
  return <ClientFormPage clientId={clientId} />;
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/diagnostico" element={<Diagnostico />} />
        <Route element={<AdminGuard />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/clients/new" element={<ClientFormPage />} />
          <Route path="/admin/clients/:clientId/edit" element={<EditClientRoute />} />
        </Route>
        {/* Uma rota só (com `*`) para o perfil e `p/:postId`: abrir um post não recarrega o perfil. */}
        <Route path="/c/:slug/*" element={<ClientEntry />} />
        <Route path="*" element={<Unavailable />} />
      </Routes>
    </HashRouter>
  );
}
