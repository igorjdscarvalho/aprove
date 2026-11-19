import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function AdminHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <Link to="/admin" className="text-sm font-bold text-accent">Aprovação</Link>
        <span aria-hidden="true" className="text-muted">/</span>
        <h1 className="font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {action}
        <button
          type="button"
          onClick={() => void supabase.auth.signOut()}
          className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-bg"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
