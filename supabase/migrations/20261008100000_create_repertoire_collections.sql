-- A chave composta permite que participações verifiquem a banda em ambas as FKs.
alter table public.songs
  add constraint songs_band_id_id_key unique (band_id, id);

create table public.repertoire_collections (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repertoire_collections_band_id_id_key unique (band_id, id),
  constraint repertoire_collections_name_not_blank check (btrim(name) <> ''),
  constraint repertoire_collections_name_length check (
    char_length(name) between 1 and 120
  )
);

create unique index repertoire_collections_band_name_key
  on public.repertoire_collections (band_id, lower(btrim(name)));

create table public.repertoire_collection_songs (
  band_id uuid not null,
  collection_id uuid not null,
  song_id uuid not null,
  position integer not null,
  constraint repertoire_collection_songs_pkey
    primary key (collection_id, song_id),
  constraint repertoire_collection_songs_collection_band_fkey
    foreign key (band_id, collection_id)
    references public.repertoire_collections (band_id, id)
    on delete cascade,
  constraint repertoire_collection_songs_song_band_fkey
    foreign key (band_id, song_id)
    references public.songs (band_id, id)
    on delete cascade,
  constraint repertoire_collection_songs_position_non_negative
    check (position >= 0),
  constraint repertoire_collection_songs_collection_position_key
    unique (collection_id, position)
    deferrable initially immediate
);

create index repertoire_collection_songs_band_song_idx
  on public.repertoire_collection_songs (band_id, song_id);

create trigger repertoire_collections_set_updated_at
before update on public.repertoire_collections
for each row execute function public.set_updated_at();

alter table public.repertoire_collections enable row level security;
alter table public.repertoire_collection_songs enable row level security;

revoke all on public.repertoire_collections from anon, authenticated;
revoke all on public.repertoire_collection_songs from anon, authenticated;
grant select on public.repertoire_collections to authenticated;
grant select on public.repertoire_collection_songs to authenticated;

create policy repertoire_collections_select
on public.repertoire_collections
for select to authenticated
using (public.is_band_member(band_id));

create policy repertoire_collections_active_account
on public.repertoire_collections as restrictive
for all to authenticated
using (not public.is_account_suspended())
with check (not public.is_account_suspended());

create policy repertoire_collection_songs_select
on public.repertoire_collection_songs
for select to authenticated
using (
  public.is_band_member(band_id)
  and not public.is_song_moderated(song_id)
  and exists (
    select 1
    from public.repertoire_collections as collections
    where collections.id = collection_id
      and collections.band_id = repertoire_collection_songs.band_id
  )
);

create policy repertoire_collection_songs_active_account
on public.repertoire_collection_songs as restrictive
for all to authenticated
using (not public.is_account_suspended())
with check (not public.is_account_suspended());

comment on table public.repertoire_collections is
  'Coleções nomeadas de músicas do repertório, compartilhadas dentro de uma banda.';
comment on table public.repertoire_collection_songs is
  'Participações ordenadas de músicas em coleções do repertório da mesma banda.';
