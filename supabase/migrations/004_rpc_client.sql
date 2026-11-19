-- Resolve o token -> client_id (ou NULL). Só aceita cliente 'published' e sessão não expirada.
create or replace function public._session_client(p_token text) returns uuid
language sql stable security definer set search_path = public, extensions as $$
  select s.client_id
  from public.client_sessions s
  join public.clients c on c.id = s.client_id
  where s.token_hash = encode(digest(coalesce(p_token,''), 'sha256'), 'hex')
    and s.expires_at > now()
    and c.status = 'published'
  limit 1;
$$;

-- 1) Gate: diz se o link está disponível. Resposta IDÊNTICA para inexistente/não publicado/arquivado.
create or replace function public.client_gate(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c public.clients%rowtype;
begin
  select * into c from public.clients where slug = lower(coalesce(p_slug,''));
  if not found or c.status <> 'published' then
    return jsonb_build_object('available', false);
  end if;
  return jsonb_build_object('available', true, 'name', c.name,
                            'username', c.username, 'avatar_path', c.avatar_path);
end $$;

-- 2) Login por senha -> token de sessão
create or replace function public.client_login(p_slug text, p_password text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  c        public.clients%rowtype;
  v_hash   text;
  v_fails  integer;
  v_token  text;
begin
  select * into c from public.clients where slug = lower(coalesce(p_slug,''));
  if not found or c.status <> 'published' then
    return jsonb_build_object('ok', false, 'error', 'unavailable');
  end if;

  select count(*) into v_fails from public.login_attempts
   where client_id = c.id and success = false and created_at > now() - interval '15 minutes';
  if v_fails >= 5 then
    return jsonb_build_object('ok', false, 'error', 'locked');
  end if;

  select password_hash into v_hash from public.client_credentials where client_id = c.id;
  if v_hash is null or crypt(coalesce(p_password,''), v_hash) <> v_hash then
    insert into public.login_attempts(client_id, success) values (c.id, false);
    return jsonb_build_object('ok', false, 'error', 'invalid_password');
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.client_sessions(token_hash, client_id, expires_at)
  values (encode(digest(v_token, 'sha256'), 'hex'), c.id, now() + interval '7 days');

  delete from public.login_attempts where client_id = c.id;                 -- zera falhas
  delete from public.client_sessions where expires_at < now();               -- limpeza oportunista
  delete from public.login_attempts where created_at < now() - interval '2 days';

  return jsonb_build_object('ok', true, 'token', v_token);
end $$;

-- 3) Feed completo (perfil + posts visíveis + mídias + histórico de reviews)
create or replace function public.client_get_feed(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_id uuid := public._session_client(p_token);
  c public.clients%rowtype;
begin
  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;
  select * into c from public.clients where id = v_id;

  return jsonb_build_object(
    'ok', true,
    'client', jsonb_build_object(
      'name', c.name, 'username', c.username, 'bio', c.bio, 'category', c.category,
      'website', c.website, 'avatar_path', c.avatar_path,
      'followers_count', c.followers_count, 'following_count', c.following_count
    ),
    'posts', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id, 'type', p.type, 'caption', p.caption, 'location', p.location,
          'audio_name', p.audio_name, 'scheduled_date', p.scheduled_date,
          'scheduled_time', p.scheduled_time, 'approval_status', p.approval_status,
          'revision', p.revision, 'aspect_ratio', p.aspect_ratio, 'cover_path', p.cover_path,
          'grid_crop_x', p.grid_crop_x, 'grid_crop_y', p.grid_crop_y,
          'story_seconds', p.story_seconds,
          'media', (
            select coalesce(jsonb_agg(jsonb_build_object(
                     'id', m.id, 'position', m.position, 'kind', m.kind, 'path', m.path,
                     'poster_path', m.poster_path, 'width', m.width, 'height', m.height,
                     'duration', m.duration_seconds) order by m.position), '[]'::jsonb)
            from public.post_media m where m.post_id = p.id),
          'reviews', (
            select coalesce(jsonb_agg(jsonb_build_object(
                     'decision', r.decision, 'comment', r.comment,
                     'reviewer_name', r.reviewer_name, 'revision', r.revision,
                     'created_at', r.created_at) order by r.created_at desc), '[]'::jsonb)
            from public.reviews r where r.post_id = p.id)
        )
        order by p.scheduled_date desc, p.scheduled_time desc nulls last, p.created_at desc
      )
      from public.posts p
      where p.client_id = v_id and p.is_visible
    ), '[]'::jsonb)
  );
end $$;

-- 4) Enviar aprovação / pedido de ajuste
create or replace function public.client_submit_review(
  p_token text, p_post_id uuid, p_decision public.review_decision,
  p_comment text, p_reviewer_name text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := public._session_client(p_token);
  p public.posts%rowtype;
  v_comment text := btrim(coalesce(p_comment, ''));
  v_recent integer;
begin
  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;

  select * into p from public.posts
   where id = p_post_id and client_id = v_id and is_visible;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if p_decision = 'changes_requested' and v_comment = '' then
    return jsonb_build_object('ok', false, 'error', 'comment_required');
  end if;
  if char_length(v_comment) > 2000 then
    return jsonb_build_object('ok', false, 'error', 'comment_too_long');
  end if;

  -- anti-spam: no máx. 20 envios por cliente em 10 minutos
  select count(*) into v_recent from public.reviews
   where client_id = v_id and created_at > now() - interval '10 minutes';
  if v_recent >= 20 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  insert into public.reviews(post_id, client_id, decision, comment, reviewer_name, revision)
  values (p.id, v_id, p_decision,
          case when p_decision = 'approved' then '' else v_comment end,
          left(btrim(coalesce(p_reviewer_name,'')), 60), p.revision);

  update public.posts
     set approval_status = case p_decision when 'approved' then 'approved'::public.approval_status
                                           else 'changes_requested'::public.approval_status end
   where id = p.id;

  return jsonb_build_object('ok', true, 'approval_status', p_decision);
end $$;

-- 5) Logout
create or replace function public.client_logout(p_token text) returns void
language sql security definer set search_path = public, extensions as $$
  delete from public.client_sessions
   where token_hash = encode(digest(coalesce(p_token,''), 'sha256'), 'hex');
$$;

-- 6) Keep-alive (evita pausa por inatividade)
create or replace function public.ping() returns text
language sql stable as $$ select 'ok'::text $$;
