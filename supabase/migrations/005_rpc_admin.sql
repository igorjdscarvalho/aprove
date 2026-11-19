-- Define/troca a senha de um cliente e derruba sessões existentes
create or replace function public.admin_set_client_password(p_client_id uuid, p_password text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if char_length(coalesce(p_password,'')) < 8 then raise exception 'password_too_short'; end if;

  insert into public.client_credentials(client_id, password_hash, updated_at)
  values (p_client_id, crypt(p_password, gen_salt('bf', 10)), now())
  on conflict (client_id) do update
     set password_hash = excluded.password_hash, updated_at = now();

  delete from public.client_sessions where client_id = p_client_id;
  delete from public.login_attempts  where client_id = p_client_id;
end $$;

-- Destrava o login de um cliente
create or replace function public.admin_unlock_client(p_client_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  delete from public.login_attempts where client_id = p_client_id;
end $$;

-- Derruba todas as sessões (ex.: suspeita de vazamento)
create or replace function public.admin_revoke_sessions(p_client_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  delete from public.client_sessions where client_id = p_client_id;
end $$;

-- Contadores para o dashboard (pendências por cliente)
create or replace function public.admin_client_counters()
returns table (client_id uuid, pending bigint, changes_requested bigint, approved bigint, unread_reviews bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return query
  select c.id,
         count(p.*) filter (where p.is_visible and p.approval_status = 'pending'),
         count(p.*) filter (where p.is_visible and p.approval_status = 'changes_requested'),
         count(p.*) filter (where p.is_visible and p.approval_status = 'approved'),
         (select count(*) from public.reviews r where r.client_id = c.id and r.read_at is null)
  from public.clients c
  left join public.posts p on p.client_id = c.id
  group by c.id;
end $$;
