create type public.band_role as enum ('owner', 'editor', 'member');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_not_blank check (
    display_name is null or btrim(display_name) <> ''
  ),
  constraint profiles_email_not_blank check (email is null or btrim(email) <> '')
);

comment on table public.profiles is
  'Dados públicos mínimos do perfil autenticado; dados de autenticação permanecem em auth.users.';

create table public.bands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bands_name_not_blank check (btrim(name) <> ''),
  constraint bands_name_length check (char_length(name) between 1 and 120)
);

create table public.band_members (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.band_role not null default 'member',
  joined_at timestamptz not null default now(),
  constraint band_members_band_user_key unique (band_id, user_id)
);

create index band_members_user_id_idx on public.band_members (user_id);
create index band_members_band_role_idx on public.band_members (band_id, role);

create table public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  term_version text not null,
  accepted_at timestamptz not null default now(),
  constraint legal_acceptances_term_version_not_blank check (btrim(term_version) <> ''),
  constraint legal_acceptances_term_version_length check (
    char_length(term_version) between 1 and 64
  )
);

create unique index legal_acceptances_user_band_version_key
  on public.legal_acceptances (user_id, band_id, term_version)
  where user_id is not null;

-- As políticas serão adicionadas na tarefa 4.7. Até lá, RLS evita exposição acidental.
alter table public.profiles enable row level security;
alter table public.bands enable row level security;
alter table public.band_members enable row level security;
alter table public.legal_acceptances enable row level security;
