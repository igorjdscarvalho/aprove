create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

alter table public.admins             enable row level security;
alter table public.clients            enable row level security;
alter table public.client_credentials enable row level security;  -- sem policy: bloqueada
alter table public.posts              enable row level security;
alter table public.post_media         enable row level security;
alter table public.reviews            enable row level security;
alter table public.client_sessions    enable row level security;  -- sem policy: bloqueada
alter table public.login_attempts     enable row level security;  -- sem policy: bloqueada

create policy admin_all_clients on public.clients
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy admin_all_posts on public.posts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy admin_all_post_media on public.post_media
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy admin_all_reviews on public.reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Realtime para a caixa de entrada de aprovações
alter publication supabase_realtime add table public.reviews;
