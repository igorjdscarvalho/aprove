import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '@/providers/admin/SupabaseAdminProvider';

export function AdminGuard() {
  const [state, setState] = useState<'checking' | 'allowed' | 'denied'>('checking');

  useEffect(() => {
    let live = true;
    let checkId = 0;

    const check = async () => {
      const id = ++checkId;
      const { data, error } = await supabase.auth.getSession();
      if (!live || id !== checkId) return;
      if (error || !data.session) {
        setState('denied');
        return;
      }
      try {
        if (await verifyAdmin()) {
          if (live && id === checkId) setState('allowed');
        } else {
          await supabase.auth.signOut();
          if (live && id === checkId) setState('denied');
        }
      } catch {
        if (live && id === checkId) setState('denied');
      }
    };

    void check();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (!live) return;
        if (!session) {
          setState('denied');
          return;
        }
        void check();
      }, 0);
    });
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (state === 'checking') return <div className="mx-auto max-w-xl p-6"><Spinner label="Verificando acesso" /></div>;
  if (state === 'denied') return <Navigate to="/" replace />;
  return <Outlet />;
}
