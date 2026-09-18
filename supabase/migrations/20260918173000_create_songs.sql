create type public.lyric_status as enum (
  'missing',
  'static',
  'incomplete',
  'synchronized'
);

create or replace function public.is_valid_lyric_document(document jsonb)
returns boolean
language plpgsql
immutable
strict
set search_path = pg_catalog, public
as $$
declare
  block jsonb;
  line jsonb;
  block_id text;
  line_id text;
  block_ids text[] := '{}'::text[];
  line_ids text[] := '{}'::text[];
begin
  if coalesce(jsonb_typeof(document), 'null') <> 'object'
    or coalesce(jsonb_typeof(document->'blocks'), 'null') <> 'array' then
    return false;
  end if;

  for block in select value from jsonb_array_elements(document->'blocks') loop
    if coalesce(jsonb_typeof(block), 'null') <> 'object'
      or coalesce(jsonb_typeof(block->'id'), 'null') <> 'string'
      or btrim(block->>'id') = ''
      or coalesce(jsonb_typeof(block->'lines'), 'null') <> 'array' then
      return false;
    end if;

    if block ? 'name'
      and jsonb_typeof(block->'name') not in ('null', 'string') then
      return false;
    end if;

    block_id := block->>'id';
    if block_id = any(block_ids) then
      return false;
    end if;
    block_ids := array_append(block_ids, block_id);

    for line in select value from jsonb_array_elements(block->'lines') loop
      if coalesce(jsonb_typeof(line), 'null') <> 'object'
        or coalesce(jsonb_typeof(line->'id'), 'null') <> 'string'
        or btrim(line->>'id') = ''
        or coalesce(jsonb_typeof(line->'text'), 'null') <> 'string' then
        return false;
      end if;

      if line ? 'startTimeMs'
        and jsonb_typeof(line->'startTimeMs') not in ('null', 'number') then
        return false;
      end if;

      if line ? 'startTimeMs'
        and jsonb_typeof(line->'startTimeMs') = 'number'
        and ((line->>'startTimeMs')::numeric < 0
          or mod((line->>'startTimeMs')::numeric, 1) <> 0) then
        return false;
      end if;

      line_id := line->>'id';
      if line_id = any(line_ids) then
        return false;
      end if;
      line_ids := array_append(line_ids, line_id);
    end loop;
  end loop;

  return true;
end;
$$;

create or replace function public.derive_lyric_status(document jsonb)
returns public.lyric_status
language plpgsql
immutable
strict
set search_path = pg_catalog, public
as $$
declare
  block jsonb;
  line jsonb;
  text_line_count integer := 0;
  timed_line_count integer := 0;
  previous_start_ms bigint;
  current_start_ms bigint;
  has_out_of_order boolean := false;
begin
  if not public.is_valid_lyric_document(document) then
    return 'missing'::public.lyric_status;
  end if;

  for block in select value from jsonb_array_elements(document->'blocks') loop
    for line in select value from jsonb_array_elements(block->'lines') loop
      if btrim(line->>'text') <> '' then
        text_line_count := text_line_count + 1;

        if line ? 'startTimeMs'
          and jsonb_typeof(line->'startTimeMs') = 'number' then
          current_start_ms := (line->>'startTimeMs')::bigint;
          timed_line_count := timed_line_count + 1;

          if previous_start_ms is not null
            and current_start_ms < previous_start_ms then
            has_out_of_order := true;
          end if;
          previous_start_ms := current_start_ms;
        end if;
      end if;
    end loop;
  end loop;

  if text_line_count = 0 then
    return 'missing'::public.lyric_status;
  end if;
  if timed_line_count = 0 then
    return 'static'::public.lyric_status;
  end if;
  if timed_line_count < text_line_count or has_out_of_order then
    return 'incomplete'::public.lyric_status;
  end if;
  return 'synchronized'::public.lyric_status;
end;
$$;

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands (id) on delete cascade,
  title text not null,
  original_artist text,
  musical_key text,
  bpm integer,
  estimated_duration_ms integer,
  youtube_reference text,
  lyrics jsonb not null default '{"blocks": []}'::jsonb,
  lyric_status public.lyric_status not null default 'missing',
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint songs_title_not_blank check (btrim(title) <> ''),
  constraint songs_title_length check (char_length(title) between 1 and 200),
  constraint songs_original_artist_not_blank check (
    original_artist is null or btrim(original_artist) <> ''
  ),
  constraint songs_bpm_positive check (bpm is null or bpm between 1 and 1000),
  constraint songs_duration_non_negative check (
    estimated_duration_ms is null or estimated_duration_ms >= 0
  ),
  constraint songs_youtube_reference_length check (
    youtube_reference is null or char_length(youtube_reference) <= 2048
  ),
  constraint songs_lyrics_valid check (public.is_valid_lyric_document(lyrics)),
  constraint songs_lyric_status_consistent check (
    lyric_status = public.derive_lyric_status(lyrics)
  )
);

create index songs_band_active_idx
  on public.songs (band_id, title)
  where archived_at is null;
create index songs_band_status_idx on public.songs (band_id, lyric_status);
create index songs_updated_at_idx on public.songs (band_id, updated_at desc);

alter table public.songs enable row level security;
