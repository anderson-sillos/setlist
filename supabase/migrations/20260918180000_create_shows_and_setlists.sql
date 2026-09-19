create type public.show_status as enum ('draft', 'ready', 'cancelled');

create type public.show_item_type as enum ('song', 'planning', 'separator');

create table public.shows (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands (id) on delete cascade,
  name text not null,
  starts_at timestamptz not null,
  venue text not null,
  notes text,
  status public.show_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shows_name_not_blank check (btrim(name) <> ''),
  constraint shows_name_length check (char_length(name) between 1 and 200),
  constraint shows_venue_not_blank check (btrim(venue) <> ''),
  constraint shows_venue_length check (char_length(venue) between 1 and 240)
);

create table public.show_blocks (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows (id) on delete cascade,
  name text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint show_blocks_name_not_blank check (btrim(name) <> ''),
  constraint show_blocks_name_length check (char_length(name) between 1 and 120),
  constraint show_blocks_position_non_negative check (position >= 0),
  constraint show_blocks_show_position_key unique (show_id, position)
);

create table public.show_items (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references public.show_blocks (id) on delete cascade,
  position integer not null,
  item_type public.show_item_type not null,
  song_id uuid references public.songs (id) on delete restrict,
  description text,
  estimated_duration_ms integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint show_items_position_non_negative check (position >= 0),
  constraint show_items_block_position_key unique (block_id, position),
  constraint show_items_duration_non_negative check (
    estimated_duration_ms is null or estimated_duration_ms >= 0
  ),
  constraint show_items_type_payload check (
    (item_type = 'song'
      and song_id is not null
      and description is null
      and estimated_duration_ms is null)
    or (item_type = 'planning'
      and song_id is null
      and description is not null
      and btrim(description) <> '')
    or (item_type = 'separator'
      and song_id is null
      and description is null
      and estimated_duration_ms is null)
  ),
  constraint show_items_notes_for_song check (
    notes is null or item_type = 'song'
  )
);

create index shows_band_starts_at_idx on public.shows (band_id, starts_at);
create index shows_band_status_idx on public.shows (band_id, status);
create index show_blocks_show_position_idx on public.show_blocks (show_id, position);
create index show_items_block_position_idx on public.show_items (block_id, position);
create index show_items_song_id_idx on public.show_items (song_id);

alter table public.shows enable row level security;
alter table public.show_blocks enable row level security;
alter table public.show_items enable row level security;
