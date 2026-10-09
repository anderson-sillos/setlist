-- Gerado por: node scripts/generate-demo-band-seed.mjs
-- Banda Demo: composições e letras fictícias originais para divulgação e testes.
-- Executar explicitamente como administrador, após as migrações do projeto.
-- A conta asillos@gmail.com deve existir no Auth e possuir perfil.
-- Reexecutar preserva a banda existente e quaisquer alterações feitas no app.
-- Nenhum usuário, convite ou aceite de termo é criado por este arquivo.

do $demo_seed$
declare
  payload jsonb := $demo_payload$
__DEMO_PAYLOAD__
$demo_payload$::jsonb;
  seed_band_id uuid := (payload->'band'->>'id')::uuid;
  owner_email text := payload->'band'->>'ownerEmail';
  owner_id uuid;
  owner_count integer;
  reference_date date := coalesce(
    nullif(current_setting('setlist.demo_reference_date', true), '')::date,
    (current_timestamp at time zone 'America/Sao_Paulo')::date
  );
  reference_day timestamptz := reference_date::timestamp at time zone 'America/Sao_Paulo';
  song jsonb;
  collection jsonb;
  show_entry jsonb;
  block_entry record;
  item_entry record;
begin
  if current_user in ('anon', 'authenticated') then
    raise exception 'DEMO_ADMIN_CONNECTION_REQUIRED';
  end if;
  -- Serializa execuções simultâneas; o DO inteiro é uma operação atômica.
  perform pg_advisory_xact_lock(hashtextextended('setlist:banda-demo:v1', 0));

  select count(*), min(users.id::text)::uuid
    into owner_count, owner_id
  from auth.users as users
  where lower(btrim(users.email)) = lower(owner_email)
    and users.deleted_at is null;
  if owner_count <> 1 then
    raise exception 'DEMO_OWNER_NOT_FOUND_OR_AMBIGUOUS: %', owner_email
      using hint = 'Entre no app com essa conta no ambiente escolhido antes de executar o seed.';
  end if;
  if not exists (select 1 from public.profiles where id = owner_id) then
    raise exception 'DEMO_OWNER_PROFILE_NOT_FOUND'
      using hint = 'Entre no app para sincronizar o perfil da conta.';
  end if;
  if exists (select 1 from public.suspended_accounts where user_id = owner_id) then
    raise exception 'DEMO_OWNER_ACCOUNT_SUSPENDED';
  end if;

  if exists (select 1 from public.bands where id = seed_band_id) then
    if not exists (
      select 1 from public.band_members as members
      where members.band_id = seed_band_id and members.user_id = owner_id
        and members.role = 'owner'
    ) then
      raise exception 'DEMO_BAND_OWNER_CONFLICT';
    end if;
    raise notice 'Banda Demo já criada (id: %). Dados e alterações existentes preservados.', seed_band_id;
    return;
  end if;
  if exists (
    select 1 from public.bands as bands
    join public.band_members as members on members.band_id = bands.id
    where lower(btrim(bands.name)) = lower(payload->'band'->>'name')
      and members.user_id = owner_id
  ) then
    raise exception 'DEMO_BAND_NAME_ALREADY_EXISTS'
      using hint = 'Já existe uma Banda Demo dessa conta com outro id. Confira essa banda antes de carregar uma segunda.';
  end if;

  insert into public.bands (id, name, created_at, updated_at)
  values (seed_band_id, payload->'band'->>'name', reference_day - interval '120 days', reference_day);
  insert into public.band_members (band_id, user_id, role, joined_at)
  values (seed_band_id, owner_id, 'owner', reference_day);

  for song in select value from jsonb_array_elements(payload->'songs') loop
    if public.derive_lyric_status(song->'lyrics')::text <> song->>'lyricStatus' then
      raise exception 'DEMO_LYRIC_STATUS_MISMATCH: %', song->>'title';
    end if;
    insert into public.songs (
      id, band_id, title, original_artist, musical_key, bpm,
      estimated_duration_ms, youtube_reference, lyrics, lyric_status,
      notes, archived_at, created_at, updated_at
    ) values (
      (song->>'id')::uuid, seed_band_id, song->>'title', song->>'originalArtist',
      song->>'musicalKey', (song->>'bpm')::integer,
      (song->>'estimatedDurationMs')::integer, song->>'youtubeReference',
      song->'lyrics', public.derive_lyric_status(song->'lyrics'), song->>'notes',
      case when (song->>'archived')::boolean then reference_day - interval '10 days' end,
      reference_day - interval '120 days' + (song->>'number')::integer * interval '1 day',
      reference_day - interval '45 days' + mod((song->>'number')::integer, 42) * interval '1 day'
    );
  end loop;

  for collection in select value from jsonb_array_elements(payload->'collections') loop
    insert into public.repertoire_collections (id, band_id, name, created_at, updated_at)
    values (
      (collection->>'id')::uuid, seed_band_id, collection->>'name',
      reference_day - interval '30 days' + (collection->>'number')::integer * interval '1 day',
      reference_day
    );
    insert into public.repertoire_collection_songs (band_id, collection_id, song_id, position)
    select seed_band_id, (collection->>'id')::uuid, entries.value::uuid, (entries.ordinality - 1)::integer
    from jsonb_array_elements_text(collection->'songIds') with ordinality as entries;
  end loop;

  for show_entry in select value from jsonb_array_elements(payload->'shows') loop
    -- Os gatilhos exigem Rascunho enquanto blocos e itens são inseridos.
    insert into public.shows (id, band_id, name, starts_at, venue, notes, status, created_at, updated_at)
    values (
      (show_entry->>'id')::uuid, seed_band_id, show_entry->>'name',
      ((reference_date + (show_entry->>'dayOffset')::integer) + (show_entry->>'time')::time)
        at time zone 'America/Sao_Paulo',
      show_entry->>'venue', show_entry->>'notes', 'draft',
      reference_day - interval '100 days' + (show_entry->>'number')::integer * interval '1 day',
      reference_day
    );
    for block_entry in select value, ordinality from jsonb_array_elements(show_entry->'blocks') with ordinality loop
      insert into public.show_blocks (id, show_id, name, position)
      values ((block_entry.value->>'id')::uuid, (show_entry->>'id')::uuid,
        block_entry.value->>'name', (block_entry.ordinality - 1)::integer);
      for item_entry in select value, ordinality from jsonb_array_elements(block_entry.value->'items') with ordinality loop
        insert into public.show_items (id, block_id, position, item_type, song_id, description, estimated_duration_ms, notes)
        values (
          (item_entry.value->>'id')::uuid, (block_entry.value->>'id')::uuid,
          (item_entry.ordinality - 1)::integer, (item_entry.value->>'type')::public.show_item_type,
          (item_entry.value->>'songId')::uuid, item_entry.value->>'description',
          (item_entry.value->>'estimatedDurationMs')::integer, item_entry.value->>'notes'
        );
      end loop;
    end loop;
    update public.shows set status = (show_entry->>'status')::public.show_status
    where id = (show_entry->>'id')::uuid;
  end loop;

  raise notice 'Banda Demo criada (id: %, owner: %, referência: %): % músicas, % coleções e % shows.',
    seed_band_id, owner_email, reference_date,
    jsonb_array_length(payload->'songs'), jsonb_array_length(payload->'collections'),
    jsonb_array_length(payload->'shows');
end;
$demo_seed$;
