-- Extensões
create extension if not exists pgcrypto with schema extensions;

-- Tipos
create type public.client_status    as enum ('unpublished', 'published', 'archived');
create type public.post_type        as enum ('image', 'carousel', 'reel', 'story');
create type public.approval_status  as enum ('pending', 'approved', 'changes_requested');
create type public.review_decision  as enum ('approved', 'changes_requested');
create type public.media_kind       as enum ('image', 'video');

-- Admins (apenas você)
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Clientes
create table public.clients (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique
                   check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),
  name             text not null check (char_length(name) between 1 and 80),
  username         text not null check (username ~ '^[a-z0-9._]{1,30}$'),
  bio              text not null default '' check (char_length(bio) <= 150),
  category         text not null default '' check (char_length(category) <= 60),
  website          text not null default '' check (char_length(website) <= 200),
  avatar_path      text,
  followers_count  integer not null default 0 check (followers_count >= 0),
  following_count  integer not null default 0 check (following_count >= 0),
  status           public.client_status not null default 'unpublished',
  internal_notes   text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index clients_status_idx on public.clients(status);

-- Credenciais (hash). Nenhuma policy => ninguém lê via API; só funções SECURITY DEFINER.
create table public.client_credentials (
  client_id     uuid primary key references public.clients(id) on delete cascade,
  password_hash text not null,
  updated_at    timestamptz not null default now()
);

-- Posts
create table public.posts (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  type            public.post_type not null,
  caption         text not null default '' check (char_length(caption) <= 2200),
  location        text not null default '' check (char_length(location) <= 100),
  audio_name      text not null default '',               -- Reels: "Áudio original" etc.
  scheduled_date  date not null,                          -- data planejada (filtro por mês)
  scheduled_time  time,                                   -- opcional
  is_visible      boolean not null default false,         -- visível ao cliente?
  approval_status public.approval_status not null default 'pending',
  revision        integer not null default 1,             -- incrementa quando você reenvia
  aspect_ratio    text not null default '4:5'
                  check (aspect_ratio in ('1:1','4:5','1.91:1','9:16')),
  cover_path      text,                                   -- capa (Reels) ou miniatura
  grid_crop_x     numeric not null default 50 check (grid_crop_x between 0 and 100),
  grid_crop_y     numeric not null default 50 check (grid_crop_y between 0 and 100),
  story_seconds   integer not null default 5 check (story_seconds between 1 and 15),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index posts_client_date_idx on public.posts(client_id, scheduled_date desc);
create index posts_client_visible_idx on public.posts(client_id) where is_visible;

-- Mídias de um post (carrossel => várias)
create table public.post_media (
  id               uuid primary key default gen_random_uuid(),
  post_id          uuid not null references public.posts(id) on delete cascade,
  position         integer not null default 0,
  kind             public.media_kind not null,
  path             text not null,
  poster_path      text,                                  -- frame do vídeo
  mime             text not null default '',
  width            integer,
  height           integer,
  duration_seconds numeric,
  size_bytes       bigint,
  created_at       timestamptz not null default now(),
  unique (post_id, position) deferrable initially deferred
);
create index post_media_post_idx on public.post_media(post_id, position);

-- Aprovações (histórico completo, nunca sobrescreve)
create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.posts(id) on delete cascade,
  client_id     uuid not null references public.clients(id) on delete cascade,
  decision      public.review_decision not null,
  comment       text not null default '' check (char_length(comment) <= 2000),
  reviewer_name text not null default '' check (char_length(reviewer_name) <= 60),
  revision      integer not null,
  created_at    timestamptz not null default now(),
  read_at       timestamptz,                              -- quando VOCÊ leu
  check (decision = 'approved' or char_length(btrim(comment)) > 0)
);
create index reviews_unread_idx on public.reviews(created_at desc) where read_at is null;
create index reviews_post_idx   on public.reviews(post_id, created_at desc);

-- Sessões do cliente (token guardado só como hash)
create table public.client_sessions (
  token_hash text primary key,
  client_id  uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index client_sessions_client_idx on public.client_sessions(client_id);

-- Tentativas de login (anti força bruta)
create table public.login_attempts (
  id         bigint generated always as identity primary key,
  client_id  uuid not null references public.clients(id) on delete cascade,
  success    boolean not null,
  created_at timestamptz not null default now()
);
create index login_attempts_idx on public.login_attempts(client_id, created_at desc);

-- updated_at automático
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger clients_touch before update on public.clients
  for each row execute function public.touch_updated_at();
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();
